/*
  # Create Victron Energy Data Table

  1. New Tables
    - `victron_data`
      - `id` (uuid, primary key)
      - `device_id` (uuid, foreign key to device_status)
      - `device_type` (text) - 'mppt' or 'shunt'
      - `timestamp` (timestamptz)
      - `pv_voltage` (numeric) - PV array voltage in volts
      - `pv_current` (numeric) - PV array current in amps
      - `pv_power` (numeric) - PV power in watts
      - `battery_voltage` (numeric) - Battery voltage in volts
      - `battery_current` (numeric) - Battery current in amps (positive = charging)
      - `battery_power` (numeric) - Battery power in watts
      - `load_current` (numeric) - Load current in amps (for shunt)
      - `yield_today` (numeric) - Energy produced today in Wh
      - `yield_total` (numeric) - Total energy produced in kWh
      - `efficiency` (numeric) - MPPT efficiency percentage
      - `temperature` (numeric) - Device temperature in Celsius
      - `state_of_operation` (text) - Operating state
      - `error_code` (text) - Any error codes
      - `raw_data` (jsonb) - Complete raw data for reference

  2. Security
    - Enable RLS on `victron_data` table
    - Add policy for authenticated users to read all data
    - Add policy for backend to insert/update data

  3. Indexes
    - Index on `device_id` for fast lookups by device
    - Index on `timestamp` for time-based queries
    - Index on `(device_id, timestamp DESC)` for efficient pagination
*/

CREATE TABLE IF NOT EXISTS victron_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES device_status(id) ON DELETE CASCADE,
  device_type text NOT NULL CHECK (device_type IN ('mppt', 'shunt')),
  timestamp timestamptz NOT NULL DEFAULT now(),
  pv_voltage numeric,
  pv_current numeric,
  pv_power numeric,
  battery_voltage numeric,
  battery_current numeric,
  battery_power numeric,
  load_current numeric,
  yield_today numeric,
  yield_total numeric,
  efficiency numeric,
  temperature numeric,
  state_of_operation text,
  error_code text,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_victron_device_id ON victron_data(device_id);
CREATE INDEX idx_victron_timestamp ON victron_data(timestamp DESC);
CREATE INDEX idx_victron_device_timestamp ON victron_data(device_id, timestamp DESC);

ALTER TABLE victron_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view victron data"
  ON victron_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Backend can insert victron data"
  ON victron_data
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
