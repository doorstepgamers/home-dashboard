/*
  # Device Status Tracking

  1. New Tables
    - `device_status`
      - `id` (uuid, primary key) - Unique device identifier
      - `device_name` (text) - Friendly name for the device
      - `last_seen` (timestamptz) - Last heartbeat timestamp
      - `system_info` (jsonb) - System stats (CPU, memory, temp, etc)
      - `ip_address` (text) - Device IP address
      - `created_at` (timestamptz) - First seen timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `device_status` table
    - Add policy for public read access (dashboard monitoring)
    - Add policy for devices to update their own status
  
  3. Indexes
    - Index on `last_seen` for quick online status queries
  
  4. Notes
    - Devices are considered online if last_seen is within last 30 seconds
    - System info stored as JSONB for flexibility
*/

CREATE TABLE IF NOT EXISTS device_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name text NOT NULL DEFAULT 'Raspberry Pi',
  last_seen timestamptz DEFAULT now(),
  system_info jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_device_status_last_seen ON device_status(last_seen DESC);

-- Enable RLS
ALTER TABLE device_status ENABLE ROW LEVEL SECURITY;

-- Allow public read access for monitoring
CREATE POLICY "Anyone can view device status"
  ON device_status FOR SELECT
  USING (true);

-- Allow devices to insert their initial status
CREATE POLICY "Devices can insert status"
  ON device_status FOR INSERT
  WITH CHECK (true);

-- Allow devices to update their status
CREATE POLICY "Devices can update status"
  ON device_status FOR UPDATE
  USING (true)
  WITH CHECK (true);