/*
  # Solar Monitoring System Database Schema

  ## Overview
  Creates a complete database structure for monitoring Victron solar equipment including
  MPPT charge controller, battery shunt, and inverter data.

  ## New Tables
  
  ### 1. `solar_metrics` - Real-time current metrics
  Stores the most recent readings from all devices:
  - `id` (uuid, primary key) - Unique identifier
  - `timestamp` (timestamptz) - When the reading was taken
  - `battery_voltage` (numeric) - Battery voltage in volts
  - `battery_current` (numeric) - Battery current in amps (+ charging, - discharging)
  - `battery_soc` (numeric) - State of charge percentage (0-100)
  - `battery_power` (numeric) - Battery power in watts
  - `battery_consumed_ah` (numeric) - Consumed amp hours
  - `battery_remaining_ah` (numeric) - Remaining amp hours
  - `solar_voltage` (numeric) - Solar panel voltage in volts
  - `solar_current` (numeric) - Solar panel current in amps
  - `solar_power` (numeric) - Solar power generation in watts
  - `charge_state` (text) - MPPT charge state (Off, Bulk, Absorption, Float)
  - `inverter_power` (numeric) - Inverter power consumption in watts
  - `inverter_status` (text) - Inverter status
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `solar_history` - Historical data logging
  Stores time-series data for trend analysis:
  - All fields from solar_metrics
  - Optimized for time-series queries with indexing

  ### 3. `device_config` - Device configuration and status
  Stores configuration and connection status:
  - `id` (uuid, primary key)
  - `device_name` (text) - Device identifier
  - `device_type` (text) - Type of device (mppt, shunt, inverter)
  - `connection_type` (text) - Connection method (usb, bluetooth)
  - `is_connected` (boolean) - Current connection status
  - `last_update` (timestamptz) - Last successful data update
  - `config_data` (jsonb) - Additional configuration as JSON
  - `updated_at` (timestamptz) - Last config update

  ### 4. `system_alerts` - Alert and notification system
  Tracks system alerts and thresholds:
  - `id` (uuid, primary key)
  - `alert_type` (text) - Type of alert (low_battery, high_temp, etc)
  - `threshold_value` (numeric) - Trigger threshold
  - `current_value` (numeric) - Current value that triggered alert
  - `is_active` (boolean) - Whether alert is currently active
  - `triggered_at` (timestamptz) - When alert was triggered
  - `resolved_at` (timestamptz) - When alert was resolved
  - `message` (text) - Alert message

  ## Security
  - RLS enabled on all tables
  - Public read access for monitoring (no auth required for this use case)
  - Restricted write access through service role only
*/

-- Create solar_metrics table for current real-time data
CREATE TABLE IF NOT EXISTS solar_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now() NOT NULL,
  battery_voltage numeric(6,3),
  battery_current numeric(7,3),
  battery_soc numeric(5,2),
  battery_power numeric(8,2),
  battery_consumed_ah numeric(8,2),
  battery_remaining_ah numeric(8,2),
  solar_voltage numeric(6,3),
  solar_current numeric(7,3),
  solar_power numeric(8,2),
  charge_state text,
  inverter_power numeric(8,2),
  inverter_status text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create solar_history table for historical data
CREATE TABLE IF NOT EXISTS solar_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now() NOT NULL,
  battery_voltage numeric(6,3),
  battery_current numeric(7,3),
  battery_soc numeric(5,2),
  battery_power numeric(8,2),
  battery_consumed_ah numeric(8,2),
  battery_remaining_ah numeric(8,2),
  solar_voltage numeric(6,3),
  solar_current numeric(7,3),
  solar_power numeric(8,2),
  charge_state text,
  inverter_power numeric(8,2),
  inverter_status text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create device_config table
CREATE TABLE IF NOT EXISTS device_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name text UNIQUE NOT NULL,
  device_type text NOT NULL,
  connection_type text DEFAULT 'usb',
  is_connected boolean DEFAULT false,
  last_update timestamptz,
  config_data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create system_alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  threshold_value numeric(8,2),
  current_value numeric(8,2),
  is_active boolean DEFAULT true,
  triggered_at timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz,
  message text NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_solar_metrics_timestamp ON solar_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_solar_history_timestamp ON solar_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_active ON system_alerts(is_active, triggered_at DESC);

-- Enable Row Level Security
ALTER TABLE solar_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (no authentication required for monitoring)
CREATE POLICY "Public read access for solar_metrics"
  ON solar_metrics FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public read access for solar_history"
  ON solar_history FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public read access for device_config"
  ON device_config FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public read access for system_alerts"
  ON system_alerts FOR SELECT
  TO anon
  USING (true);

-- Service role policies for write operations (for Raspberry Pi data collector)
CREATE POLICY "Service role can insert solar_metrics"
  ON solar_metrics FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service role can insert solar_history"
  ON solar_history FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service role can update device_config"
  ON device_config FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can insert device_config"
  ON device_config FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service role can insert system_alerts"
  ON system_alerts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service role can update system_alerts"
  ON system_alerts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Insert default device configurations
INSERT INTO device_config (device_name, device_type, connection_type, config_data)
VALUES 
  ('BlueSolar MPPT 75/10', 'mppt', 'usb', '{"model": "75/10", "max_voltage": 75, "max_current": 10}'::jsonb),
  ('SmartShunt 300A', 'shunt', 'usb', '{"model": "300A", "max_current": 300, "bluetooth_capable": true}'::jsonb),
  ('Inverter', 'inverter', 'usb', '{}'::jsonb)
ON CONFLICT (device_name) DO NOTHING;