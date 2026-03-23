export interface VictronData {
  device_type: 'mppt' | 'shunt';
  pv_voltage?: number;
  pv_current?: number;
  pv_power?: number;
  battery_voltage?: number;
  battery_current?: number;
  battery_power?: number;
  load_current?: number;
  yield_today?: number;
  yield_total?: number;
  efficiency?: number;
  temperature?: number;
  state_of_operation?: string;
  error_code?: string;
  raw_data: Record<string, string>;
}

const VE_DIRECT_PORT = process.env.VICTRON_PORT || '/dev/ttyUSB0';
const VE_DIRECT_BAUD = 19200;

let port: any = null;
let parser: any = null;
let isConnected = false;

const fieldMappings: Record<string, keyof VictronData> = {
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

export async function initializeVictronReader(): Promise<void> {
  try {
    const { SerialPort } = await import('serialport' as any);
    const { ReadlineParser } = await import('@serialport/parser-readline' as any);

    port = new SerialPort({
      path: VE_DIRECT_PORT,
      baudRate: VE_DIRECT_BAUD,
      autoOpen: false,
    });

    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('error', (err: Error) => {
      console.error('Victron serial port error:', err);
      isConnected = false;
    });

    parser.on('data', (line: string) => {
      console.log('Victron data received:', line);
    });

    await new Promise((resolve, reject) => {
      port.open((err: Error | null) => {
        if (err) {
          console.error('Failed to open Victron serial port:', err);
          reject(err);
        } else {
          console.log('Victron serial port opened successfully');
          isConnected = true;
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.warn('SerialPort modules not available. Victron reader will not function:', error);
    isConnected = false;
  }
}

export async function readVictronData(): Promise<VictronData | null> {
  if (!isConnected || !parser) {
    return null;
  }

  return new Promise((resolve) => {
    const dataBuffer: Record<string, string> = {};
    let deviceType: 'mppt' | 'shunt' = 'mppt';
    let blockComplete = false;

    const handleLine = (line: string) => {
      const trimmed = line.trim();

      if (trimmed === '') {
        if (blockComplete && Object.keys(dataBuffer).length > 0) {
          parser!.removeListener('data', handleLine);

          const victronData: VictronData = {
            device_type: deviceType,
            raw_data: dataBuffer,
          };

          for (const [field, value] of Object.entries(dataBuffer)) {
            const key = fieldMappings[field];
            if (key) {
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                (victronData[key] as number) = numValue;
              } else if (key === 'state_of_operation' || key === 'error_code') {
                (victronData[key] as string) = value;
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

      const colonIndex = trimmed.indexOf('\t');
      if (colonIndex > -1) {
        const field = trimmed.substring(0, colonIndex);
        const value = trimmed.substring(colonIndex + 1);
        dataBuffer[field] = value;
        blockComplete = false;
      }
    };

    parser!.on('data', handleLine);

    setTimeout(() => {
      parser!.removeListener('data', handleLine);
      resolve(null);
    }, 5000);
  });
}

export function closeVictronReader(): void {
  if (port && port.isOpen) {
    port.close(() => {
      console.log('Victron serial port closed');
      isConnected = false;
    });
  }
}

export function isVictronConnected(): boolean {
  return isConnected;
}
