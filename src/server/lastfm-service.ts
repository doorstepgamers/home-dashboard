import { SupabaseClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

interface LastFmTrack {
  name: string;
  artist: {
    name: string;
    '#text'?: string;
  };
  album?: {
    '#text'?: string;
  };
  image?: Array<{
    '#text': string;
    size: string;
  }>;
  url?: string;
  duration?: string;
  date?: {
    uts: string;
    '#text': string;
  };
  '@attr'?: {
    nowplaying: string;
  };
  mbid?: string;
}

interface CurrentTrack {
  track_title: string;
  artist_name: string;
  album_name: string | null;
  album_image_url: string | null;
  track_url: string | null;
  is_playing: boolean;
  timestamp: string | null;
  duration_ms: number | null;
}

export class LastFmService {
  private apiKey: string;
  private apiSecret: string;
  private supabase: SupabaseClient;

  constructor(apiKey: string, apiSecret: string, supabase: SupabaseClient) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.supabase = supabase;
  }

  private async makeRequest(params: Record<string, string>) {
    const baseUrl = 'http://ws.audioscrobbler.com/2.0/';
    const allParams = {
      ...params,
      api_key: this.apiKey,
      format: 'json'
    };

    const queryString = new URLSearchParams(allParams).toString();

    try {
      const response = await fetch(`${baseUrl}?${queryString}`);
      if (!response.ok) {
        throw new Error(`Last.fm API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Last.fm API request failed:', error);
      throw error;
    }
  }

  async getRecentTracks(username: string, limit: number = 50) {
    try {
      const data = await this.makeRequest({
        method: 'user.getRecentTracks',
        user: username,
        limit: limit.toString(),
        extended: '1'
      }) as any;

      if (data.error) {
        throw new Error(`Last.fm error: ${data.message || 'Unknown error'}`);
      }

      return data.recenttracks?.track || [];
    } catch (error) {
      console.error('Failed to fetch recent tracks:', error);
      throw error;
    }
  }

  async getCurrentTrack(username: string): Promise<CurrentTrack | null> {
    try {
      const tracks = await this.getRecentTracks(username, 1);
      if (!tracks || tracks.length === 0) {
        return null;
      }

      const track = Array.isArray(tracks) ? tracks[0] : tracks;
      const isNowPlaying = track['@attr']?.nowplaying === 'true';

      const artistName = typeof track.artist === 'string'
        ? track.artist
        : (track.artist?.['#text'] || track.artist?.name || '');

      const albumName = typeof track.album === 'string'
        ? track.album
        : (track.album?.['#text'] || null);

      let albumImage = null;
      if (track.image && Array.isArray(track.image)) {
        const largeImage = track.image.find(img => img.size === 'large' || img.size === 'extralarge');
        albumImage = largeImage?.['#text'] || null;
      }

      const duration = track.duration ? parseInt(track.duration) : null;
      const timestamp = track.date?.['#text'] || (isNowPlaying ? new Date().toISOString() : null);

      return {
        track_title: track.name || '',
        artist_name: artistName,
        album_name: albumName,
        album_image_url: albumImage,
        track_url: track.url || null,
        is_playing: isNowPlaying,
        timestamp: timestamp ? new Date(timestamp).toISOString() : null,
        duration_ms: duration
      };
    } catch (error) {
      console.error('Failed to get current track:', error);
      throw error;
    }
  }

  async storeCurrentTrack(currentTrack: CurrentTrack) {
    try {
      const { data, error } = await this.supabase
        .from('lastfm_current_track')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      const { error: insertError } = await this.supabase
        .from('lastfm_current_track')
        .insert({
          ...currentTrack,
          last_updated: new Date().toISOString()
        });

      if (insertError) throw insertError;
    } catch (error) {
      console.error('Failed to store current track:', error);
      throw error;
    }
  }

  async storeScrobbles(username: string, limit: number = 100) {
    try {
      const tracks = await this.getRecentTracks(username, limit);
      if (!tracks || tracks.length === 0) {
        return [];
      }

      const scrobbles = (Array.isArray(tracks) ? tracks : [tracks])
        .filter((track: LastFmTrack) => !track['@attr']?.nowplaying) // exclude now playing
        .map((track: LastFmTrack) => ({
          track_title: track.name || '',
          artist_name: typeof track.artist === 'string'
            ? track.artist
            : (track.artist?.['#text'] || track.artist?.name || ''),
          album_name: typeof track.album === 'string'
            ? track.album
            : (track.album?.['#text'] || null),
          track_mbid: track.mbid || null,
          timestamp: track.date?.['#text']
            ? new Date(track.date['#text']).toISOString()
            : new Date().toISOString(),
          duration_ms: track.duration ? parseInt(track.duration) : null,
          lastfm_track_id: track.url?.split('/track/')[1] || null
        }));

      if (scrobbles.length === 0) {
        return [];
      }

      const { data, error } = await this.supabase
        .from('music_scrobbles')
        .insert(scrobbles)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to store scrobbles:', error);
      throw error;
    }
  }

  async getStoredScrobbles(limit: number = 50, offset: number = 0) {
    try {
      const { data, error } = await this.supabase
        .from('music_scrobbles')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch stored scrobbles:', error);
      throw error;
    }
  }

  async getStoredCurrentTrack() {
    try {
      const { data, error } = await this.supabase
        .from('lastfm_current_track')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch current track:', error);
      throw error;
    }
  }
}
