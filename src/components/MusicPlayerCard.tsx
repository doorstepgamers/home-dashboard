import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { MusicPlaybackState } from '../server/speaker-manager';

export default function MusicPlayerCard() {
  const [playback, setPlayback] = useState<MusicPlaybackState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;

    const fetchPlayback = async () => {
      try {
        const response = await fetch('/api/music/playback');
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
          setPlayback(data);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching playback state:', error);
        setLoading(false);
      }
    };

    fetchPlayback();
    const interval = setInterval(fetchPlayback, 3000);

    const channel = supabase
      .channel('music_playback_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'music_playback'
        },
        () => {
          fetchPlayback();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  const handlePlayPause = async () => {
    if (!playback?.id) return;
    try {
      const newStatus = playback.playback_status === 'playing' ? 'paused' : 'playing';
      const response = await fetch(`/api/music/playback/${playback.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playback_status: newStatus })
      });
      if (response.ok) {
        setPlayback(prev => prev ? { ...prev, playback_status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating playback:', error);
    }
  };

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playback?.id) return;
    const volume = parseInt(e.target.value);
    try {
      const response = await fetch(`/api/music/playback/${playback.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume_level: volume })
      });
      if (response.ok) {
        setPlayback(prev => prev ? { ...prev, volume_level: volume } : null);
      }
    } catch (error) {
      console.error('Error updating volume:', error);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;
    return `${minutes}:${displaySeconds.toString().padStart(2, '0')}`;
  };

  const progress = playback?.track_duration_ms ? (playback.current_position_ms / playback.track_duration_ms) * 100 : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 h-32 rounded-lg"></div>
          <div className="bg-gray-200 h-4 rounded w-3/4"></div>
          <div className="bg-gray-200 h-4 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Music Player</h2>
        <Volume2 size={20} className="text-gray-600" />
      </div>

      {playback ? (
        <div className="space-y-4">
          {playback.album_artwork_url && (
            <img
              src={playback.album_artwork_url}
              alt="Album art"
              className="w-full h-32 object-cover rounded-lg bg-gray-100"
            />
          )}

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
              {playback.track_title || 'No track playing'}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-1">
              {playback.artist_name || 'Unknown Artist'}
            </p>
            <p className="text-xs text-gray-500 line-clamp-1">
              {playback.album_name || 'Unknown Album'}
            </p>
          </div>

          {playback.playback_status !== 'stopped' && (
            <div className="space-y-1">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{formatTime(playback.current_position_ms)}</span>
                <span>{formatTime(playback.track_duration_ms)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <SkipBack size={18} className="text-gray-700" />
            </button>
            <button
              onClick={handlePlayPause}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {playback.playback_status === 'playing' ? (
                <>
                  <Pause size={18} />
                  <span className="text-sm font-medium">Pause</span>
                </>
              ) : (
                <>
                  <Play size={18} />
                  <span className="text-sm font-medium">Play</span>
                </>
              )}
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <SkipForward size={18} className="text-gray-700" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Volume</span>
              <span className="text-xs text-gray-600">{playback.volume_level}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={playback.volume_level}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-gray-500">
          <p>No speaker connected</p>
        </div>
      )}
    </div>
  );
}
