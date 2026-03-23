/*
  # Add Victron Energy Settings

  1. Changes
    - Add Victron port setting for USB connection
    - Add Victron device ID setting

  2. Notes
    - victron_port: USB port path (default: /dev/ttyUSB0)
    - victron_enabled: Toggle to enable/disable Victron reader
*/

INSERT INTO app_settings (key, value, description, category)
VALUES 
  ('victron_port', '/dev/ttyUSB0', 'USB port for Victron VE.Direct connection (e.g., /dev/ttyUSB0)', 'victron'),
  ('victron_enabled', 'false', 'Enable Victron Energy monitoring', 'victron')
ON CONFLICT (key) DO NOTHING;
