import { useState, useEffect } from 'react';
import { Bluetooth, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { BluetoothSpeaker } from '../server/speaker-manager';

export default function SpeakerStatusCard() {
  const [speaker, setSpeaker] = useState<BluetoothSpeaker | null>(null);
  const [availableSpeakers, setAvailableSpeakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const fetchSpeaker = async () => {
      try {
        const response = await fetch('/api/speakers/connected');
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
          setSpeaker(data);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching speaker:', error);
        setLoading(false);
      }
    };

    fetchSpeaker();
    const interval = setInterval(fetchSpeaker, 5000);

    const channel = supabase
      .channel('bluetooth_speakers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bluetooth_speakers'
        },
        () => {
          fetchSpeaker();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  const handleDiscoverSpeakers = async () => {
    setDiscovering(true);
    try {
      const response = await fetch('/api/speakers/discover', { method: 'POST' });
      const data = await response.json();
      setAvailableSpeakers(data || []);
    } catch (error) {
      console.error('Error discovering speakers:', error);
    } finally {
      setDiscovering(false);
    }
  };

  const handleConnectSpeaker = async (deviceName: string, macAddress: string) => {
    try {
      const response = await fetch('/api/speakers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_name: deviceName,
          mac_address: macAddress
        })
      });

      if (response.ok) {
        const newSpeaker = await response.json();
        setSpeaker(newSpeaker);
        setShowDiscovery(false);

        await fetch(`/api/speakers/${newSpeaker.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'connected' })
        });
      }
    } catch (error) {
      console.error('Error connecting speaker:', error);
    }
  };

  const handleDisconnect = async () => {
    if (!speaker?.id) return;
    try {
      await fetch(`/api/speakers/${speaker.id}`, { method: 'DELETE' });
      setSpeaker(null);
    } catch (error) {
      console.error('Error disconnecting speaker:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-600" />;
      default:
        return <HelpCircle size={20} className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="animate-pulse space-y-3">
          <div className="bg-gray-200 h-6 rounded w-1/2"></div>
          <div className="bg-gray-200 h-4 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Speaker</h2>
        <Bluetooth size={20} className="text-gray-600" />
      </div>

      {speaker ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{speaker.device_name}</p>
              <p className="text-xs text-gray-600 font-mono mt-1">{speaker.mac_address}</p>
              {speaker.signal_strength && (
                <p className="text-xs text-gray-600 mt-1">Signal: {speaker.signal_strength} dBm</p>
              )}
            </div>
            {getStatusIcon(speaker.connection_status)}
          </div>

          <div className="inline-flex items-center gap-2 bg-green-50 px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-xs font-medium text-green-800 capitalize">
              {speaker.connection_status}
            </span>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">No speaker connected</p>
          <button
            onClick={() => setShowDiscovery(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Discover Speakers
          </button>
        </div>
      )}

      {showDiscovery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Speakers</h3>

              {!discovering && availableSpeakers.length === 0 && (
                <button
                  onClick={handleDiscoverSpeakers}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Scan for Speakers
                </button>
              )}

              {discovering && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin">
                    <Bluetooth size={24} className="text-blue-600" />
                  </div>
                  <span className="ml-2 text-gray-600">Scanning...</span>
                </div>
              )}

              {availableSpeakers.length > 0 && (
                <div className="space-y-2">
                  {availableSpeakers.map((spk, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleConnectSpeaker(spk.name, spk.mac_address)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{spk.name}</p>
                      <p className="text-xs text-gray-600 font-mono">{spk.mac_address}</p>
                      <p className="text-xs text-gray-500 mt-1">Signal: {spk.signal_strength} dBm</p>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowDiscovery(false)}
                className="w-full mt-4 text-gray-700 hover:text-gray-900 text-sm font-medium py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
