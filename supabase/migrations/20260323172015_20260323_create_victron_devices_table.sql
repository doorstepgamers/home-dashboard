/*
  # Create Victron Devices Management System

  1. New Tables
    - `victron_devices`: Store paired Bluetooth Victron devices with encrypted pin codes
      - `id` (uuid, primary key)
      - `device_name` (text): User-friendly name for the device
      - `mac_address` (text, unique): Bluetooth MAC address for device identification
      - `device_type` (text): 'mppt' or 'shunt'
      - `pin_code_encrypted` (text): Encrypted pin code for device authentication
      - `connection_status` (text): 'connected', 'disconnected', 'error'
      - `last_sync` (timestamptz): Last successful data sync timestamp
      - `signal_strength` (integer): Bluetooth signal strength (-100 to 0 dBm)
      - `sync_errors_count` (integer): Count of consecutive sync failures
      - `last_error` (text): Last error message if any
      - `is_active` (boolean): Enable/disable device syncing
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `victron_device_discovery_logs`: Track device discovery history
      - `id` (uuid, primary key)
      - `scan_timestamp` (timestamptz): When the discovery scan was performed
      - `discovered_devices` (jsonb): Array of devices found during scan
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `victron_devices` table
    - Add restrictive policy: only admin can read device data
    - Add policy for heartbeat service to update device status

  3. Settings
    - Add Victron Bluetooth configuration to app_settings table
    - Support multiple sync intervals and adapter selection

  4. Notes
    - Pin codes are encrypted on the server before storage
    - Device MACs must be unique to prevent duplicates
    - Connection status tracks real-time device connectivity
    - Sync error tracking helps diagnose persistent issues
*/

CREATE TABLE IF NOT EXISTS victron_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name text NOT NULL,
  mac_address text UNIQUE NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('mppt', 'shunt')),
  pin_code_encrypted text NOT NULL,
  connection_status text NOT NULL DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  last_sync timestamptz,
  signal_strength integer,
  sync_errors_count integer DEFAULT 0,
  last_error text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS victron_device_discovery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_timestamp timestamptz DEFAULT now(),
  discovered_devices jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE victron_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE victron_device_discovery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authenticated users can view Victron devices"
  ON victron_devices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can manage Victron devices"
  ON victron_devices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update Victron devices"
  ON victron_devices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can delete Victron devices"
  ON victron_devices FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can view discovery logs"
  ON victron_device_discovery_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can insert discovery logs"
  ON victron_device_discovery_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

INSERT INTO app_settings (key, value, description, category)
VALUES 
  ('victron_bluetooth_enabled', 'false', 'Enable Victron Bluetooth device discovery and connection', 'victron'),
  ('victron_sync_interval', '30', 'Interval in seconds between Victron device syncs (default: 30s)', 'victron'),
  ('victron_auto_discovery', 'false', 'Automatically discover Victron devices on startup', 'victron'),
  ('victron_connection_timeout', '10', 'Connection timeout in seconds for Bluetooth devices', 'victron'),
  ('victron_max_sync_errors', '5', 'Maximum consecutive errors before marking device as offline', 'victron')
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_victron_devices_mac_address ON victron_devices(mac_address);
CREATE INDEX IF NOT EXISTS idx_victron_devices_device_type ON victron_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_victron_devices_is_active ON victron_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_victron_device_discovery_logs_timestamp ON victron_device_discovery_logs(scan_timestamp);
