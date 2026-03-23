/*
  # Create Bluetooth Speakers Table

  1. New Tables
    - `bluetooth_speakers`
      - `id` (uuid, primary key)
      - `device_name` (text) - Friendly name of the speaker
      - `mac_address` (text, unique) - Bluetooth MAC address
      - `connection_status` (text) - connected, disconnected, error
      - `signal_strength` (integer) - RSSI signal strength in dBm
      - `last_connected` (timestamptz) - Last successful connection time
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `bluetooth_speakers` table
    - Add policy for authenticated users to read speaker status
*/

CREATE TABLE IF NOT EXISTS bluetooth_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name text NOT NULL,
  mac_address text UNIQUE NOT NULL,
  connection_status text DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  signal_strength integer,
  last_connected timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bluetooth_speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to speakers"
  ON bluetooth_speakers FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to update speakers"
  ON bluetooth_speakers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert speakers"
  ON bluetooth_speakers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete speakers"
  ON bluetooth_speakers FOR DELETE
  TO authenticated
  USING (true);
