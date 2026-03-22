export interface SolarMetrics {
  id: string;
  timestamp: string;
  battery_voltage: number | null;
  battery_current: number | null;
  battery_soc: number | null;
  battery_power: number | null;
  battery_consumed_ah: number | null;
  battery_remaining_ah: number | null;
  solar_voltage: number | null;
  solar_current: number | null;
  solar_power: number | null;
  charge_state: string | null;
  inverter_power: number | null;
  inverter_status: string | null;
  created_at: string;
}

export interface DeviceConfig {
  id: string;
  device_name: string;
  device_type: string;
  connection_type: string;
  is_connected: boolean;
  last_update: string | null;
  config_data: Record<string, any>;
  updated_at: string;
}

export interface SystemAlert {
  id: string;
  alert_type: string;
  threshold_value: number | null;
  current_value: number | null;
  is_active: boolean;
  triggered_at: string;
  resolved_at: string | null;
  message: string;
}
