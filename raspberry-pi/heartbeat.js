import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HEARTBEAT_INTERVAL = 10000;
const API_URL = 'http://localhost:3000/heartbeat';
const DEVICE_ID_FILE = path.join(__dirname, '.device-id');

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

console.log('Starting heartbeat service...');
console.log(`Device ID: ${getDeviceId()}`);
console.log(`Sending heartbeat every ${HEARTBEAT_INTERVAL / 1000} seconds`);

sendHeartbeat();
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
