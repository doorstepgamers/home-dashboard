import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HEARTBEAT_INTERVAL = 60000;
const VICTRON_READ_INTERVAL = 30000;
const API_URL = 'http://localhost:3000/heartbeat';
const DEVICE_ID_FILE = path.join(__dirname, '.device-id');
const VE_DIRECT_PORT = process.env.VICTRON_PORT || '/dev/ttyUSB0';
const VE_DIRECT_BAUD = 19200;

let victronPort = null;
let victronParser = null;

function getDeviceId() {
  try {
    if (fs.existsSync(DEVICE_ID_FILE)) {
      return fs.readFileSync(DEVICE_ID_FILE, 'utf8').trim();
    }
  } catch (error) {
    console.error('Error reading device ID:', error);
  }

  const deviceId = crypto.randomUUID();
  try {
    fs.writeFileSync(DEVICE_ID_FILE, deviceId);
  } catch (error) {
    console.error('Error writing device ID:', error);
  }
  return deviceId;
}

function getSystemStats() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

  let cpuTemp = null;
  try {
    const tempData = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8');
    cpuTemp = parseInt(tempData) / 1000;
  } catch (error) {
    console.log('Could not read CPU temperature');
  }

  return {
    cpu: Math.round(cpuUsage * 10) / 10,
    memory: Math.round(memoryUsage * 10) / 10,
    temperature: cpuTemp,
    uptime: os.uptime(),
    hostname: os.hostname()
  };
}

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

async function sendHeartbeat() {
  const deviceId = getDeviceId();
  const systemInfo = getSystemStats();
  const ipAddress = getLocalIpAddress();
  const timestamp = new Date().toISOString();

  try {
    console.log(`[${timestamp}] Sending heartbeat to http://localhost:3000/api/heartbeat`);
    const response = await fetch('http://localhost:3000/api/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: deviceId,
        device_name: os.hostname(),
        system_info: systemInfo,
        ip_address: ipAddress
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[${timestamp}] Heartbeat sent successfully:`, result);
  } catch (error) {
    console.error(`[${timestamp}] Error sending heartbeat:`, error.message);
  }
}

function initVictronReader() {
  try {
    victronPort = new SerialPort({
      path: VE_DIRECT_PORT,
      baudRate: VE_DIRECT_BAUD,
      autoOpen: false,
    });

    victronParser = victronPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    victronPort.on('error', (err) => {
      console.error('Victron serial port error:', err.message);
    });

    victronPort.open((err) => {
      if (err) {
        console.error('Failed to open Victron serial port:', err.message);
      } else {
        console.log('Victron serial port opened successfully');
      }
    });
  } catch (error) {
    console.warn('SerialPort modules not available. Victron reader will not initialize:', error.message);
  }
}

function readVictronData() {
  return new Promise((resolve) => {
    if (!victronParser) {
      resolve(null);
      return;
    }

    const dataBuffer = {};
    let deviceType = 'mppt';
    let blockComplete = false;
    let resolved = false;

    const handleLine = (line) => {
      const trimmed = line.trim();

      if (trimmed === '') {
        if (blockComplete && Object.keys(dataBuffer).length > 0) {
          victronParser.removeListener('data', handleLine);

          if (!resolved) {
            resolved = true;

            const fieldMappings = {
              'V': 'battery_voltage',
              'I': 'battery_current',
              'P': 'battery_power',
              'VPV': 'pv_voltage',
              'IPV': 'pv_current',
              'PPV': 'pv_power',
              'IL': 'load_current',
              'H19': 'yield_today',
              'H20': 'yield_total',
              'MPPT': 'efficiency',
              'T': 'temperature',
              'CS': 'state_of_operation',
              'ERR': 'error_code',
            };

            const victronData = {
              device_type: deviceType,
              raw_data: dataBuffer,
            };

            for (const [field, value] of Object.entries(dataBuffer)) {
              const key = fieldMappings[field];
              if (key) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  victronData[key] = numValue;
                } else if (key === 'state_of_operation' || key === 'error_code') {
                  victronData[key] = value;
                }
              }

              if (field === 'PRODUCT' && value.includes('MPPT')) {
                deviceType = 'mppt';
              } else if (field === 'PRODUCT' && value.includes('Shunt')) {
                deviceType = 'shunt';
              }
            }

            resolve(victronData);
          }
        }
        blockComplete = true;
        return;
      }

      const colonIndex = trimmed.indexOf('\t');
      if (colonIndex > -1) {
        const field = trimmed.substring(0, colonIndex);
        const value = trimmed.substring(colonIndex + 1);
        dataBuffer[field] = value;
        blockComplete = false;
      }
    };

    victronParser.on('data', handleLine);

    setTimeout(() => {
      victronParser.removeListener('data', handleLine);
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 5000);
  });
}

async function sendVictronData() {
  const deviceId = getDeviceId();

  try {
    const data = await readVictronData();
    if (!data) return;

    const response = await fetch('http://localhost:3000/api/victron-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: deviceId,
        data: data
      })
    });

    if (response.ok) {
      console.log(`[${new Date().toISOString()}] Victron data sent successfully`);
    } else {
      console.error(`[${new Date().toISOString()}] Failed to send Victron data: ${response.status}`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error sending Victron data:`, error.message);
  }
}

console.log('Starting heartbeat service...');
console.log(`Device ID: ${getDeviceId()}`);
console.log(`Sending heartbeat every ${HEARTBEAT_INTERVAL / 1000} seconds`);
console.log(`Reading Victron data every ${VICTRON_READ_INTERVAL / 1000} seconds`);

initVictronReader();
sendHeartbeat();
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
setInterval(sendVictronData, VICTRON_READ_INTERVAL);
