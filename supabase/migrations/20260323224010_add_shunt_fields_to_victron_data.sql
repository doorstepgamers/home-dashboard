/*
  # Add shunt-specific fields to victron_data table

  1. New Columns
    - `state_of_charge` (numeric) - Battery state of charge (0-100%)
    - `time_to_go` (numeric) - Estimated time until battery depleted (seconds)

  2. Details
    - These fields are specific to SmartShunt devices
    - Both columns are nullable to support MPPT devices that don't have these values
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'victron_data' AND column_name = 'state_of_charge'
  ) THEN
    ALTER TABLE victron_data ADD COLUMN state_of_charge numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'victron_data' AND column_name = 'time_to_go'
  ) THEN
    ALTER TABLE victron_data ADD COLUMN time_to_go numeric;
  END IF;
END $$;
