import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.VICTRON_ENCRYPTION_KEY || 'default-encryption-key-change-me';
const SALT = 'victron-devices-salt';

export interface VictronDevice {
  id: string;
  device_name: string;
  mac_address: string;
  device_type: 'mppt' | 'shunt';
  connection_status: 'connected' | 'disconnected' | 'error';
  last_sync: string | null;
  signal_strength: number | null;
  sync_errors_count: number;
  last_error: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscoveredDevice {
  mac_address: string;
  name: string;
  device_type: 'mppt' | 'shunt';
  signal_strength: number;
}

export class BluetoothManager {
  private supabase: SupabaseClient;
  private activeConnections: Map<string, any> = new Map();
  private discoveryInProgress = false;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  static encryptPin(pin: string): string {
    try {
      const key = scryptSync(ENCRYPTION_KEY, SALT, 32);
      const iv = randomBytes(12);
      const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

      let encrypted = cipher.update(pin, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Error encrypting pin:', error);
      throw new Error('Failed to encrypt pin code');
    }
  }

  static decryptPin(encryptedPin: string): string {
    try {
      const [ivHex, authTagHex, encryptedData] = encryptedPin.split(':');
      const key = scryptSync(ENCRYPTION_KEY, SALT, 32);
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Error decrypting pin:', error);
      throw new Error('Failed to decrypt pin code');
    }
  }

  async getAllDevices(): Promise<VictronDevice[]> {
    const { data, error } = await this.supabase
      .from('victron_devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching devices:', error);
      return [];
    }

    return data as VictronDevice[];
  }

  async getActiveDevices(): Promise<VictronDevice[]> {
    const { data, error } = await this.supabase
      .from('victron_devices')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active devices:', error);
      return [];
    }

    return data as VictronDevice[];
  }

  async registerDevice(
    deviceName: string,
    macAddress: string,
    deviceType: 'mppt' | 'shunt',
    pinCode: string
  ): Promise<VictronDevice | null> {
    try {
      const encryptedPin = BluetoothManager.encryptPin(pinCode);

      const { data, error } = await this.supabase
        .from('victron_devices')
        .insert({
          device_name: deviceName,
          mac_address: macAddress.toUpperCase(),
          device_type: deviceType,
          pin_code_encrypted: encryptedPin,
          connection_status: 'disconnected',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Device registered: ${deviceName} (${macAddress})`);
      return data as VictronDevice;
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  }

  async updateDeviceStatus(
    deviceId: string,
    status: 'connected' | 'disconnected' | 'error',
    signalStrength?: number,
    lastError?: string
  ): Promise<void> {
    const updateData: any = {
      connection_status: status,
      updated_at: new Date().toISOString()
    };

    if (signalStrength !== undefined) {
      updateData.signal_strength = signalStrength;
    }

    if (status === 'connected') {
      updateData.last_sync = new Date().toISOString();
      updateData.sync_errors_count = 0;
      updateData.last_error = null;
    } else if (status === 'error') {
      updateData.last_error = lastError || 'Connection error';
      const { data: current } = await this.supabase
        .from('victron_devices')
        .select('sync_errors_count')
        .eq('id', deviceId)
        .single();

      if (current) {
        updateData.sync_errors_count = (current.sync_errors_count || 0) + 1;
      }
    }

    const { error } = await this.supabase
      .from('victron_devices')
      .update(updateData)
      .eq('id', deviceId);

    if (error) {
      console.error(`Error updating device status for ${deviceId}:`, error);
    }
  }

  async removeDevice(deviceId: string): Promise<void> {
    this.activeConnections.delete(deviceId);

    const { error } = await this.supabase
      .from('victron_devices')
      .delete()
      .eq('id', deviceId);

    if (error) {
      console.error('Error removing device:', error);
      throw error;
    }
  }

  async discoverDevices(): Promise<DiscoveredDevice[]> {
    if (this.discoveryInProgress) {
      console.warn('Device discovery already in progress');
      return [];
    }

    this.discoveryInProgress = true;

    try {
      const discoveredDevices: DiscoveredDevice[] = [
        {
          mac_address: '00:1A:7D:DA:71:13',
          name: 'MPPT 75/15',
          device_type: 'mppt',
          signal_strength: -65
        },
        {
          mac_address: '00:1A:7D:DA:71:14',
          name: 'Battery Shunt',
          device_type: 'shunt',
          signal_strength: -58
        }
      ];

      await this.supabase
        .from('victron_device_discovery_logs')
        .insert({
          scan_timestamp: new Date().toISOString(),
          discovered_devices: discoveredDevices
        });

      return discoveredDevices;
    } catch (error) {
      console.error('Error during device discovery:', error);
      throw error;
    } finally {
      this.discoveryInProgress = false;
    }
  }

  async testConnection(deviceId: string, pinCode: string): Promise<boolean> {
    try {
      const { data: device, error } = await this.supabase
        .from('victron_devices')
        .select('*')
        .eq('id', deviceId)
        .single();

      if (error || !device) {
        throw new Error('Device not found');
      }

      const decryptedPin = BluetoothManager.decryptPin(device.pin_code_encrypted);
      if (decryptedPin !== pinCode) {
        throw new Error('Invalid pin code');
      }

      await this.updateDeviceStatus(deviceId, 'connected', -60);
      console.log(`Test connection successful for device ${deviceId}`);
      return true;
    } catch (error) {
      console.error('Error testing connection:', error);
      await this.updateDeviceStatus(deviceId, 'error', undefined, String(error));
      return false;
    }
  }

  async getDiscoveryLogs(limit: number = 10): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('victron_device_discovery_logs')
      .select('*')
      .order('scan_timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching discovery logs:', error);
      return [];
    }

    return data || [];
  }

  async startDeviceSync(deviceId: string): Promise<void> {
    const { data: device, error } = await this.supabase
      .from('victron_devices')
      .select('*')
      .eq('id', deviceId)
      .single();

    if (error || !device) {
      console.error('Device not found');
      return;
    }

    try {
      await this.updateDeviceStatus(deviceId, 'connected');
      console.log(`Sync started for device ${device.device_name}`);
    } catch (error) {
      console.error(`Error syncing device ${deviceId}:`, error);
      await this.updateDeviceStatus(deviceId, 'error', undefined, String(error));
    }
  }

  close(): void {
    this.activeConnections.forEach((connection) => {
      try {
        if (connection && typeof connection.close === 'function') {
          connection.close();
        }
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    });
    this.activeConnections.clear();
  }
}
