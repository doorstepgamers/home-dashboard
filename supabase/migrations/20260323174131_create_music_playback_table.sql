/*
  # Create Music Playback Table

  1. New Tables
    - `music_playback`
      - `id` (uuid, primary key)
      - `speaker_id` (uuid, foreign key) - Reference to bluetooth_speakers
      - `track_title` (text) - Current track title
      - `artist_name` (text) - Artist name
      - `album_name` (text) - Album name
      - `album_artwork_url` (text) - URL to album artwork
      - `playback_status` (text) - playing, paused, stopped
      - `current_position_ms` (bigint) - Current playback position in milliseconds
      - `track_duration_ms` (bigint) - Total track duration in milliseconds
      - `volume_level` (integer) - Volume 0-100
      - `last_updated` (timestamptz) - Last playback update time
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on `music_playback` table
    - Add policies for reading and updating playback state
*/

CREATE TABLE IF NOT EXISTS music_playback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_id uuid REFERENCES bluetooth_speakers(id) ON DELETE CASCADE,
  track_title text,
  artist_name text,
  album_name text,
  album_artwork_url text,
  playback_status text DEFAULT 'stopped' CHECK (playback_status IN ('playing', 'paused', 'stopped')),
  current_position_ms bigint DEFAULT 0,
  track_duration_ms bigint DEFAULT 0,
  volume_level integer DEFAULT 50 CHECK (volume_level >= 0 AND volume_level <= 100),
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE music_playback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to playback state"
  ON music_playback FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to update playback"
  ON music_playback FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert playback"
  ON music_playback FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete playback"
  ON music_playback FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_music_playback_speaker_id ON music_playback(speaker_id);
CREATE INDEX IF NOT EXISTS idx_music_playback_last_updated ON music_playback(last_updated DESC);
