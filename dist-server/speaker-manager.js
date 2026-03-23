export class BluetoothSpeakerManager {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async getAllSpeakers() {
        const { data, error } = await this.supabase
            .from('bluetooth_speakers')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching speakers:', error);
            return [];
        }
        return data;
    }
    async getConnectedSpeaker() {
        const { data, error } = await this.supabase
            .from('bluetooth_speakers')
            .select('*')
            .eq('connection_status', 'connected')
            .maybeSingle();
        if (error) {
            console.error('Error fetching connected speaker:', error);
            return null;
        }
        return data;
    }
    async registerSpeaker(deviceName, macAddress) {
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
            if (error)
                throw error;
            console.log(`Speaker registered: ${deviceName} (${macAddress})`);
            return data;
        }
        catch (error) {
            console.error('Error registering speaker:', error);
            throw error;
        }
    }
    async updateSpeakerStatus(speakerId, status, signalStrength) {
        const updateData = {
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
    async removeSpeaker(speakerId) {
        const { error } = await this.supabase
            .from('bluetooth_speakers')
            .delete()
            .eq('id', speakerId);
        if (error) {
            console.error('Error removing speaker:', error);
            throw error;
        }
    }
    async discoverSpeakers() {
        try {
            const discoveredSpeakers = [
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
        }
        catch (error) {
            console.error('Error during speaker discovery:', error);
            throw error;
        }
    }
    async getPlaybackState() {
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
        return data;
    }
    async initializePlaybackState(speakerId) {
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
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Error initializing playback state:', error);
            throw error;
        }
    }
    async updatePlaybackState(playbackId, updates) {
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
    async updatePlaybackTrack(playbackId, trackTitle, artistName, albumName, albumArtworkUrl) {
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
//# sourceMappingURL=speaker-manager.js.map