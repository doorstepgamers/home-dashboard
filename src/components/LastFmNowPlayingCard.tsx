import React, { useState, useEffect } from 'react';
import { Music, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Card from './Card';

interface CurrentTrack {
  id: string;
  track_title: string;
  artist_name: string;
  album_name: string;
  album_image_url: string;
  track_url: string;
  is_playing: boolean;
  timestamp: string;
  duration_ms: number;
  last_updated: string;
}

export default function LastFmNowPlayingCard() {
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [recentTracks, setRecentTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecent, setShowRecent] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const fetchData = async () => {
      try {
        const [currentRes, recentRes] = await Promise.all([
          fetch('/api/lastfm/current'),
          fetch('/api/lastfm/recent?limit=10')
        ]);

        const current = await currentRes.json();
        const recent = await recentRes.json();

        if (current && Object.keys(current).length > 0) {
          setCurrentTrack(current);
        }
        setRecentTracks(Array.isArray(recent) ? recent : []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Last.fm data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    const channel = supabase
      .channel('lastfm_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lastfm_current_track'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  const formatTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 h-40 rounded-lg"></div>
            <div className="bg-gray-200 h-4 rounded w-3/4"></div>
            <div className="bg-gray-200 h-4 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Music className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold">Now Playing</h2>
          </div>
          <button
            onClick={() => setShowRecent(!showRecent)}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            {showRecent ? 'Now' : 'Recent'}
          </button>
        </div>

        {!showRecent ? (
          currentTrack ? (
            <div className="space-y-4">
              {currentTrack.album_image_url && (
                <img
                  src={currentTrack.album_image_url}
                  alt={currentTrack.album_name}
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
              )}

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                  {currentTrack.track_title}
                </h3>
                <p className="text-lg text-gray-600 line-clamp-1">
                  {currentTrack.artist_name}
                </p>
                <p className="text-sm text-gray-500">
                  {currentTrack.album_name}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {currentTrack.is_playing && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                      Now Playing
                    </span>
                  )}
                  {!currentTrack.is_playing && (
                    <span className="text-xs text-gray-500">
                      {formatTime(currentTrack.last_updated)}
                    </span>
                  )}
                </div>
                {currentTrack.track_url && (
                  <a
                    href={currentTrack.track_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-500 hover:text-red-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No track information available</p>
            </div>
          )
        ) : (
          <div className="space-y-2">
            {recentTracks.length > 0 ? (
              recentTracks.map((track) => (
                <div
                  key={track.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <p className="font-medium text-gray-900 line-clamp-1">
                    {track.track_title}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {track.artist_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(track.timestamp)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent tracks</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
