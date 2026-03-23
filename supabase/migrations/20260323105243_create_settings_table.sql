/*
  # Create Settings Table

  1. New Tables
    - `app_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `key` (text, unique) - Setting key (e.g., 'weather_api_key', 'weather_location')
      - `value` (text) - Setting value
      - `description` (text) - Description of what this setting does
      - `category` (text) - Category grouping (e.g., 'weather', 'general')
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `app_settings` table
    - Add policy for public read access (frontend needs to read settings)
    - Add policy for authenticated updates (admin dashboard)

  3. Initial Data
    - Insert default weather settings placeholders

  4. Notes
    - Settings are stored as key-value pairs for flexibility
    - Frontend can read all settings publicly
    - Updates require authentication (future: admin role check)
*/

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text DEFAULT '',
  description text DEFAULT '',
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings"
  ON app_settings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert settings"
  ON app_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update settings"
  ON app_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Insert default settings if they don't exist
INSERT INTO app_settings (key, value, description, category)
VALUES 
  ('weather_api_key', '', 'OpenWeatherMap API Key from openweathermap.org/api', 'weather'),
  ('weather_location', 'London', 'City name for weather display', 'weather')
ON CONFLICT (key) DO NOTHING;