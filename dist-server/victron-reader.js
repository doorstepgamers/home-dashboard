const VE_DIRECT_PORT = process.env.VICTRON_PORT || '/dev/ttyUSB0';
const VE_DIRECT_BAUD = 19200;
let port = null;
let parser = null;
let isConnected = false;
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
    'SOC': 'state_of_charge',
    'TTG': 'time_to_go',
};
export async function initializeVictronReader() {
    try {
        const { SerialPort } = await import('serialport');
        const { ReadlineParser } = await import('@serialport/parser-readline');
        port = new SerialPort({
            path: VE_DIRECT_PORT,
            baudRate: VE_DIRECT_BAUD,
            autoOpen: false,
        });
        parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
        port.on('error', (err) => {
            console.error('Victron serial port error:', err);
            isConnected = false;
        });
        parser.on('data', (line) => {
            console.log('Victron data received:', line);
        });
        await new Promise((resolve, reject) => {
            port.open((err) => {
                if (err) {
                    console.error('Failed to open Victron serial port:', err);
                    reject(err);
                }
                else {
                    console.log('Victron serial port opened successfully');
                    isConnected = true;
                    resolve(null);
                }
            });
        });
    }
    catch (error) {
        console.warn('SerialPort modules not available. Victron reader will not function:', error);
        isConnected = false;
    }
}
export async function readVictronData() {
    if (!isConnected || !parser) {
        return null;
    }
    return new Promise((resolve) => {
        const dataBuffer = {};
        let deviceType = 'mppt';
        let blockComplete = false;
        const handleLine = (line) => {
            const trimmed = line.trim();
            if (trimmed === '' || trimmed === 'Checksum') {
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
                            }
                            else if (key === 'state_of_operation' || key === 'error_code') {
                                victronData[key] = value;
                            }
                        }
                        if (field === 'BMV' && value.includes('Shunt')) {
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
                const field = trimmed.substring(0, tabIndex).trim();
                const value = trimmed.substring(tabIndex + 1).trim();
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
export function closeVictronReader() {
    if (port && port.isOpen) {
        port.close(() => {
            console.log('Victron serial port closed');
            isConnected = false;
        });
    }
}
export function isVictronConnected() {
    return isConnected;
}
//# sourceMappingURL=victron-reader.js.map