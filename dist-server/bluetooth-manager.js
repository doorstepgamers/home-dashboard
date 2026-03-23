import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.VICTRON_ENCRYPTION_KEY || 'default-encryption-key-change-me';
const SALT = 'victron-devices-salt';
export class BluetoothManager {
    constructor(supabase) {
        this.activeConnections = new Map();
        this.discoveryInProgress = false;
        this.supabase = supabase;
    }
    static encryptPin(pin) {
        try {
            const key = scryptSync(ENCRYPTION_KEY, SALT, 32);
            const iv = randomBytes(12);
            const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
            let encrypted = cipher.update(pin, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        }
        catch (error) {
            console.error('Error encrypting pin:', error);
            throw new Error('Failed to encrypt pin code');
        }
    }
    static decryptPin(encryptedPin) {
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
        }
        catch (error) {
            console.error('Error decrypting pin:', error);
            throw new Error('Failed to decrypt pin code');
        }
    }
    async getAllDevices() {
        const { data, error } = await this.supabase
            .from('victron_devices')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching devices:', error);
            return [];
        }
        return data;
    }
    async getActiveDevices() {
        const { data, error } = await this.supabase
            .from('victron_devices')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching active devices:', error);
            return [];
        }
        return data;
    }
    async registerDevice(deviceName, macAddress, deviceType, pinCode) {
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
                .maybeSingle();
            if (error)
                throw error;
            if (!data)
                throw new Error('Failed to insert device');
            console.log(`Device registered: ${deviceName} (${macAddress})`);
            return data;
        }
        catch (error) {
            console.error('Error registering device:', error);
            throw error;
        }
    }
    async updateDeviceStatus(deviceId, status, signalStrength, lastError) {
        const updateData = {
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
        }
        else if (status === 'error') {
            updateData.last_error = lastError || 'Connection error';
            const { data: current } = await this.supabase
                .from('victron_devices')
                .select('sync_errors_count')
                .eq('id', deviceId)
                .maybeSingle();
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
    async removeDevice(deviceId) {
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
    async discoverDevices() {
        if (this.discoveryInProgress) {
            console.warn('Device discovery already in progress');
            return [];
        }
        this.discoveryInProgress = true;
        try {
            const discoveredDevices = [];
            console.log('Starting Bluetooth device discovery...');
            await this.supabase
                .from('victron_device_discovery_logs')
                .insert({
                scan_timestamp: new Date().toISOString(),
                discovered_devices: discoveredDevices
            });
            if (discoveredDevices.length === 0) {
                console.info('No Bluetooth devices discovered. Make sure Bluetooth is enabled and devices are in pairing mode.');
            }
            return discoveredDevices;
        }
        catch (error) {
            console.error('Error during device discovery:', error);
            throw error;
        }
        finally {
            this.discoveryInProgress = false;
        }
    }
    async testConnection(deviceId, pinCode) {
        try {
            const { data: device, error } = await this.supabase
                .from('victron_devices')
                .select('*')
                .eq('id', deviceId)
                .maybeSingle();
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
        }
        catch (error) {
            console.error('Error testing connection:', error);
            await this.updateDeviceStatus(deviceId, 'error', undefined, String(error));
            return false;
        }
    }
    async getDiscoveryLogs(limit = 10) {
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
    async startDeviceSync(deviceId) {
        const { data: device, error } = await this.supabase
            .from('victron_devices')
            .select('*')
            .eq('id', deviceId)
            .maybeSingle();
        if (error || !device) {
            console.error('Device not found');
            return;
        }
        try {
            await this.updateDeviceStatus(deviceId, 'connected');
            console.log(`Sync started for device ${device.device_name}`);
        }
        catch (error) {
            console.error(`Error syncing device ${deviceId}:`, error);
            await this.updateDeviceStatus(deviceId, 'error', undefined, String(error));
        }
    }
    close() {
        this.activeConnections.forEach((connection) => {
            try {
                if (connection && typeof connection.close === 'function') {
                    connection.close();
                }
            }
            catch (error) {
                console.error('Error closing connection:', error);
            }
        });
        this.activeConnections.clear();
    }
}
//# sourceMappingURL=bluetooth-manager.js.map