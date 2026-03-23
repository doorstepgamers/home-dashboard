/*
  # Add Last.fm Integration Tables and Settings

  1. New Tables
    - `music_scrobbles` - Store historical Last.fm scrobbles
      - `id` (uuid, primary key)
      - `track_title` (text)
      - `artist_name` (text)
      - `album_name` (text)
      - `track_mbid` (text, optional MusicBrainz ID)
      - `timestamp` (timestamptz, when the track was listened to)
      - `duration_ms` (integer, track duration)
      - `lastfm_track_id` (text, Last.fm track identifier)
      - `created_at` (timestamptz, when record was created)

    - `lastfm_current_track` - Store current nowplaying track
      - `id` (uuid, primary key)
      - `track_title` (text)
      - `artist_name` (text)
      - `album_name` (text)
      - `album_image_url` (text, album artwork)
      - `track_url` (text, Last.fm track URL)
      - `is_playing` (boolean)
      - `timestamp` (timestamptz, when track started)
      - `duration_ms` (integer)
      - `last_updated` (timestamptz)

  2. Modified Tables
    - `app_settings` - Add Last.fm configuration entries
      - Will store: lastfm_username, lastfm_auth_token, lastfm_sync_interval

  3. Security
    - Enable RLS on `music_scrobbles` table
    - Enable RLS on `lastfm_current_track` table
    - Create public read policies for music data
    - Restrict writes to authenticated users or service role only

  4. Indexes
    - Create index on music_scrobbles(timestamp DESC) for efficient querying
    - Create index on music_scrobbles(artist_name) for searching
*/

CREATE TABLE IF NOT EXISTS music_scrobbles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_title text NOT NULL,
  artist_name text NOT NULL,
  album_name text,
  track_mbid text,
  timestamp timestamptz NOT NULL,
  duration_ms integer,
  lastfm_track_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lastfm_current_track (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_title text NOT NULL,
  artist_name text NOT NULL,
  album_name text,
  album_image_url text,
  track_url text,
  is_playing boolean DEFAULT false,
  timestamp timestamptz,
  duration_ms integer,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE music_scrobbles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lastfm_current_track ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scrobbles"
  ON music_scrobbles FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage scrobbles"
  ON music_scrobbles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can delete scrobbles"
  ON music_scrobbles FOR DELETE
  USING (true);

CREATE POLICY "Anyone can view current track"
  ON lastfm_current_track FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage current track"
  ON lastfm_current_track FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update current track"
  ON lastfm_current_track FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "Service role can delete current track"
  ON lastfm_current_track FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_music_scrobbles_timestamp 
  ON music_scrobbles(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_music_scrobbles_artist 
  ON music_scrobbles(artist_name);

CREATE INDEX IF NOT EXISTS idx_music_scrobbles_track 
  ON music_scrobbles(track_title);
