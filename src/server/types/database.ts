export interface DeviceStatus {
  id: string;
  device_name: string;
  last_seen: string;
  system_info: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  updated_at: string;
  last_check_time?: string;
  last_update_time?: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface VictronDevice {
  id: string;
  device_name: string;
  mac_address: string;
  device_type: 'mppt' | 'shunt';
  pin_code_encrypted: string;
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

export interface VictronDeviceDiscoveryLog {
  id: string;
  scan_timestamp: string;
  discovered_devices: DiscoveredDevice[];
  created_at: string;
}
