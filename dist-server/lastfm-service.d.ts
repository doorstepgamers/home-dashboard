import { SupabaseClient } from '@supabase/supabase-js';
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
export declare class LastFmService {
    private apiKey;
    private apiSecret;
    private supabase;
    constructor(apiKey: string, apiSecret: string, supabase: SupabaseClient);
    private makeRequest;
    getRecentTracks(username: string, limit?: number): Promise<any>;
    getCurrentTrack(username: string): Promise<CurrentTrack | null>;
    storeCurrentTrack(currentTrack: CurrentTrack): Promise<void>;
    storeScrobbles(username: string, limit?: number): Promise<any[]>;
    getStoredScrobbles(limit?: number, offset?: number): Promise<any[]>;
    getStoredCurrentTrack(): Promise<any>;
}
export {};
//# sourceMappingURL=lastfm-service.d.ts.map