/*
  # Add Update Tracking Fields

  1. Changes
    - Add `last_check_time` (timestamptz) - Last time auto-update checked for updates
    - Add `last_update_time` (timestamptz) - Last time an actual update was applied
  
  2. Notes
    - `last_check_time` updates every 15 minutes when the script checks
    - `last_update_time` only updates when git pull actually happens
    - Both default to null (no checks/updates yet)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'device_status' AND column_name = 'last_check_time'
  ) THEN
    ALTER TABLE device_status ADD COLUMN last_check_time timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'device_status' AND column_name = 'last_update_time'
  ) THEN
    ALTER TABLE device_status ADD COLUMN last_update_time timestamptz;
  END IF;
END $$;