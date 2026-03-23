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
