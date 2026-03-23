import { SupabaseClient } from '@supabase/supabase-js';
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
export declare class BluetoothManager {
    private supabase;
    private activeConnections;
    private discoveryInProgress;
    constructor(supabase: SupabaseClient);
    static encryptPin(pin: string): string;
    static decryptPin(encryptedPin: string): string;
    getAllDevices(): Promise<VictronDevice[]>;
    getActiveDevices(): Promise<VictronDevice[]>;
    registerDevice(deviceName: string, macAddress: string, deviceType: 'mppt' | 'shunt', pinCode: string): Promise<VictronDevice | null>;
    updateDeviceStatus(deviceId: string, status: 'connected' | 'disconnected' | 'error', signalStrength?: number, lastError?: string): Promise<void>;
    removeDevice(deviceId: string): Promise<void>;
    discoverDevices(): Promise<DiscoveredDevice[]>;
    testConnection(deviceId: string, pinCode: string): Promise<boolean>;
    getDiscoveryLogs(limit?: number): Promise<any[]>;
    startDeviceSync(deviceId: string): Promise<void>;
    close(): void;
}
//# sourceMappingURL=bluetooth-manager.d.ts.map