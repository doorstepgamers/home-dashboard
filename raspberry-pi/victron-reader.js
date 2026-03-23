import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { readFileSync } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const VE_DIRECT_BAUD = 19200;
const API_URL = process.env.API_URL || 'http://localhost:3000';
const DASHBOARD_DIR = process.env.DASHBOARD_DIR || join(__dirname, '..');

let deviceId = null;
let port = null;
let parser = null;
let isConnected = false;
let victronPort = '/dev/ttyUSB0';
let victronEnabled = false;

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

function getDeviceId() {
  if (deviceId) return deviceId;
  try {
    const deviceIdFile = join(DASHBOARD_DIR, 'raspberry-pi', '.device-id');
    deviceId = readFileSync(deviceIdFile, 'utf8').trim();
    return deviceId;
  } catch (err) {
    console.error('Error reading device ID:', err);
    return null;
  }
}

async function loadSettings() {
  try {
    const portResponse = await fetch(`${API_URL}/api/settings/victron_port`);
    if (portResponse.ok) {
      const portData = await portResponse.json();
      victronPort = portData.value || '/dev/ttyUSB0';
    }

    const enabledResponse = await fetch(`${API_URL}/api/settings/victron_enabled`);
    if (enabledResponse.ok) {
      const enabledData = await enabledResponse.json();
      victronEnabled = enabledData.value === 'true';
    }

    console.log(`Victron settings loaded: port=${victronPort}, enabled=${victronEnabled}`);
  } catch (error) {
    console.warn('Error loading Victron settings from API, using defaults:', error);
    victronPort = '/dev/ttyUSB0';
    victronEnabled = false;
  }
}

async function initializeVictronReader() {
  if (!victronEnabled) {
    console.log('Victron monitoring is disabled in settings');
    return;
  }

  try {
    console.log(`Attempting to open serial port: ${victronPort}`);
    port = new SerialPort({
      path: victronPort,
      baudRate: VE_DIRECT_BAUD,
      autoOpen: false,
    });

    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('error', (err) => {
      console.error('Victron serial port error:', err);
      isConnected = false;
    });

    port.on('close', () => {
      console.log('Victron serial port closed');
      isConnected = false;
    });

    await new Promise((resolve, reject) => {
      port.open((err) => {
        if (err) {
          console.error('Failed to open Victron serial port:', err);
          reject(err);
        } else {
          console.log('Victron serial port opened successfully on', VE_DIRECT_PORT);
          isConnected = true;
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error initializing Victron reader:', error);
    isConnected = false;
    throw error;
  }
}

async function readVictronData() {
  if (!isConnected || !parser) {
    return null;
  }

  return new Promise((resolve) => {
    const dataBuffer = {};
    let deviceType = 'mppt';
    let blockComplete = false;

    const handleLine = (line) => {
      const trimmed = line.trim();

      if (trimmed === '') {
        if (blockComplete && Object.keys(dataBuffer).length > 0) {
          parser.removeListener('data', handleLine);

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
        blockComplete = true;
        return;
      }

      const tabIndex = trimmed.indexOf('\t');
      if (tabIndex > -1) {
        const field = trimmed.substring(0, tabIndex);
        const value = trimmed.substring(tabIndex + 1);
        dataBuffer[field] = value;
        blockComplete = false;
      }
    };

    parser.on('data', handleLine);

    setTimeout(() => {
      parser.removeListener('data', handleLine);
      resolve(null);
    }, 5000);
  });
}

async function sendVictronData(data) {
  if (!data) return;

  const deviceId = getDeviceId();
  if (!deviceId) {
    console.error('Device ID not found');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/victron-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: deviceId,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Victron data sent successfully:', result);
  } catch (error) {
    console.error('Error sending Victron data:', error);
  }
}

async function main() {
  try {
    console.log('Loading Victron settings from API...');
    await loadSettings();

    await initializeVictronReader();

    if (isConnected) {
      console.log('Victron reader started successfully');
      setInterval(async () => {
        const data = await readVictronData();
        if (data) {
          console.log('Read Victron data:', data);
          await sendVictronData(data);
        }
      }, 30000);

      setInterval(async () => {
        console.log('Refreshing Victron settings from API...');
        await loadSettings();
      }, 300000);
    } else {
      console.log('Victron reader not connected, will retry in 30 seconds...');
      setTimeout(main, 30000);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (port && port.isOpen) {
    port.close(() => {
      console.log('Serial port closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (port && port.isOpen) {
    port.close(() => {
      console.log('Serial port closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

main();
