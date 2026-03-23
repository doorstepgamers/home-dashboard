const VE_DIRECT_PORT = process.env.VICTRON_PORT || '/dev/ttyUSB0';
const VE_DIRECT_BAUD = 19200;
let port = null;
let parser = null;
let isConnected = false;
const SHUNT_PIDS = ['0xA389', '0xA381', '0xA382', '0xA383', '0xA384', '0xA385', '0xA386', '0xA387', '0xA388'];
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
            console.log('Victron raw:', line.trim());
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
        let linesReceived = 0;
        let checkSumSeen = false;
        const handleLine = (line) => {
            const trimmed = line.trim();
            linesReceived++;
            if (trimmed.startsWith('Checksum')) {
                checkSumSeen = true;
                return;
            }
            if (checkSumSeen && Object.keys(dataBuffer).length > 3) {
                parser.removeListener('data', handleLine);
                const victronData = parseVictronBuffer(dataBuffer);
                console.log('Victron parsed data:', JSON.stringify(victronData, null, 2));
                resolve(victronData);
                return;
            }
            const tabIndex = trimmed.indexOf('\t');
            if (tabIndex > -1) {
                const field = trimmed.substring(0, tabIndex).trim();
                const value = trimmed.substring(tabIndex + 1).trim();
                dataBuffer[field] = value;
            }
        };
        parser.on('data', handleLine);
        setTimeout(() => {
            parser.removeListener('data', handleLine);
            if (Object.keys(dataBuffer).length > 0) {
                const victronData = parseVictronBuffer(dataBuffer);
                console.log('Victron parsed (timeout):', JSON.stringify(victronData, null, 2));
                resolve(victronData);
            }
            else {
                resolve(null);
            }
        }, 5000);
    });
}
function parseVictronBuffer(dataBuffer) {
    const pid = dataBuffer['PID'] || '';
    const isShunt = SHUNT_PIDS.includes(pid) ||
        dataBuffer['SOC'] !== undefined ||
        dataBuffer['TTG'] !== undefined ||
        (dataBuffer['BMV'] !== undefined);
    const deviceType = isShunt ? 'shunt' : 'mppt';
    const victronData = {
        device_type: deviceType,
        raw_data: dataBuffer,
    };
    if (dataBuffer['V']) {
        victronData.battery_voltage = parseFloat(dataBuffer['V']) / 1000;
    }
    if (dataBuffer['I']) {
        victronData.battery_current = parseFloat(dataBuffer['I']) / 1000;
    }
    if (dataBuffer['P']) {
        victronData.battery_power = parseFloat(dataBuffer['P']);
    }
    if (dataBuffer['VPV']) {
        victronData.pv_voltage = parseFloat(dataBuffer['VPV']) / 1000;
    }
    if (dataBuffer['IPV']) {
        victronData.pv_current = parseFloat(dataBuffer['IPV']) / 1000;
    }
    if (dataBuffer['PPV']) {
        victronData.pv_power = parseFloat(dataBuffer['PPV']);
    }
    if (dataBuffer['IL']) {
        victronData.load_current = parseFloat(dataBuffer['IL']) / 1000;
    }
    if (dataBuffer['H20']) {
        victronData.yield_today = parseFloat(dataBuffer['H20']) / 100;
    }
    if (dataBuffer['H19']) {
        victronData.yield_total = parseFloat(dataBuffer['H19']) / 100;
    }
    if (dataBuffer['T']) {
        victronData.temperature = parseFloat(dataBuffer['T']);
    }
    if (dataBuffer['CS']) {
        victronData.state_of_operation = dataBuffer['CS'];
    }
    if (dataBuffer['ERR']) {
        victronData.error_code = dataBuffer['ERR'];
    }
    if (dataBuffer['SOC']) {
        victronData.state_of_charge = parseFloat(dataBuffer['SOC']) / 10;
    }
    if (dataBuffer['TTG']) {
        victronData.time_to_go = parseFloat(dataBuffer['TTG']);
    }
    return victronData;
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