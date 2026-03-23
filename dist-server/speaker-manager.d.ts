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
export declare class BluetoothSpeakerManager {
    private supabase;
    constructor(supabase: SupabaseClient);
    getAllSpeakers(): Promise<BluetoothSpeaker[]>;
    getConnectedSpeaker(): Promise<BluetoothSpeaker | null>;
    registerSpeaker(deviceName: string, macAddress: string): Promise<BluetoothSpeaker | null>;
    updateSpeakerStatus(speakerId: string, status: 'connected' | 'disconnected' | 'error', signalStrength?: number): Promise<void>;
    removeSpeaker(speakerId: string): Promise<void>;
    discoverSpeakers(): Promise<DiscoveredSpeaker[]>;
    getPlaybackState(): Promise<MusicPlaybackState | null>;
    initializePlaybackState(speakerId: string): Promise<MusicPlaybackState | null>;
    updatePlaybackState(playbackId: string, updates: Partial<MusicPlaybackState>): Promise<void>;
    updatePlaybackTrack(playbackId: string, trackTitle: string, artistName: string, albumName: string, albumArtworkUrl?: string): Promise<void>;
}
//# sourceMappingURL=speaker-manager.d.ts.map