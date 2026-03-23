import { SupabaseClient } from '@supabase/supabase-js';

export interface BluetoothSpeaker {
  id: string;
  device_name: string;
  mac_address: string;
  connection_status: 'connected' | 'disconnected' | 'error';
  signal_strength: number | null;
  last_connected: string | null;
  created_at: string;
  updated_at: string;
}

export interface MusicPlaybackState {
  id: string;
  speaker_id: string | null;
  track_title: string | null;
  artist_name: string | null;
  album_name: string | null;
  album_artwork_url: string | null;
  playback_status: 'playing' | 'paused' | 'stopped';
  current_position_ms: number;
  track_duration_ms: number;
  volume_level: number;
  last_updated: string;
  created_at: string;
}

export interface DiscoveredSpeaker {
  mac_address: string;
  name: string;
  signal_strength: number;
}

export class BluetoothSpeakerManager {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getAllSpeakers(): Promise<BluetoothSpeaker[]> {
    const { data, error } = await this.supabase
      .from('bluetooth_speakers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching speakers:', error);
      return [];
    }

    return data as BluetoothSpeaker[];
  }

  async getConnectedSpeaker(): Promise<BluetoothSpeaker | null> {
    const { data, error } = await this.supabase
      .from('bluetooth_speakers')
      .select('*')
      .eq('connection_status', 'connected')
      .maybeSingle();

    if (error) {
      console.error('Error fetching connected speaker:', error);
      return null;
    }

    return data as BluetoothSpeaker | null;
  }

  async registerSpeaker(
    deviceName: string,
    macAddress: string
  ): Promise<BluetoothSpeaker | null> {
    try {
      const { data, error } = await this.supabase
        .from('bluetooth_speakers')
        .insert({
          device_name: deviceName,
          mac_address: macAddress.toUpperCase(),
          connection_status: 'disconnected'
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Speaker registered: ${deviceName} (${macAddress})`);
      return data as BluetoothSpeaker;
    } catch (error) {
      console.error('Error registering speaker:', error);
      throw error;
    }
  }

  async updateSpeakerStatus(
    speakerId: string,
    status: 'connected' | 'disconnected' | 'error',
    signalStrength?: number
  ): Promise<void> {
    const updateData: any = {
      connection_status: status,
      updated_at: new Date().toISOString()
    };

    if (signalStrength !== undefined) {
      updateData.signal_strength = signalStrength;
    }

    if (status === 'connected') {
      updateData.last_connected = new Date().toISOString();
    }

    const { error } = await this.supabase
      .from('bluetooth_speakers')
      .update(updateData)
      .eq('id', speakerId);

    if (error) {
      console.error(`Error updating speaker status for ${speakerId}:`, error);
    }
  }

  async removeSpeaker(speakerId: string): Promise<void> {
    const { error } = await this.supabase
      .from('bluetooth_speakers')
      .delete()
      .eq('id', speakerId);

    if (error) {
      console.error('Error removing speaker:', error);
      throw error;
    }
  }

  async discoverSpeakers(): Promise<DiscoveredSpeaker[]> {
    try {
      const discoveredSpeakers: DiscoveredSpeaker[] = [
        {
          mac_address: '00:1A:7D:DA:71:20',
          name: 'Living Room Speaker',
          signal_strength: -65
        },
        {
          mac_address: '00:1A:7D:DA:71:21',
          name: 'Bedroom Speaker',
          signal_strength: -72
        }
      ];

      return discoveredSpeakers;
    } catch (error) {
      console.error('Error during speaker discovery:', error);
      throw error;
    }
  }

  async getPlaybackState(): Promise<MusicPlaybackState | null> {
    const { data, error } = await this.supabase
      .from('music_playback')
      .select('*')
      .order('last_updated', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching playback state:', error);
      return null;
    }

    return data as MusicPlaybackState | null;
  }

  async initializePlaybackState(speakerId: string): Promise<MusicPlaybackState | null> {
    try {
      const { data, error } = await this.supabase
        .from('music_playback')
        .insert({
          speaker_id: speakerId,
          playback_status: 'stopped',
          volume_level: 50
        })
        .select()
        .single();

      if (error) throw error;

      return data as MusicPlaybackState;
    } catch (error) {
      console.error('Error initializing playback state:', error);
      throw error;
    }
  }

  async updatePlaybackState(
    playbackId: string,
    updates: Partial<MusicPlaybackState>
  ): Promise<void> {
    const updateData = {
      ...updates,
      last_updated: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('music_playback')
      .update(updateData)
      .eq('id', playbackId);

    if (error) {
      console.error(`Error updating playback state for ${playbackId}:`, error);
    }
  }

  async updatePlaybackTrack(
    playbackId: string,
    trackTitle: string,
    artistName: string,
    albumName: string,
    albumArtworkUrl?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('music_playback')
      .update({
        track_title: trackTitle,
        artist_name: artistName,
        album_name: albumName,
        album_artwork_url: albumArtworkUrl || null,
        last_updated: new Date().toISOString()
      })
      .eq('id', playbackId);

    if (error) {
      console.error(`Error updating track info for ${playbackId}:`, error);
    }
  }
}
