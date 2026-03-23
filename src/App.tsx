import { Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import WeatherCard from './components/WeatherCard';
import SystemStatsCard from './components/SystemStatsCard';
import DeviceStatusCard from './components/DeviceStatusCard';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

function App() {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    const fetchUpdateTimes = async () => {
      const { data } = await supabase
        .from('device_status')
        .select('last_check_time, last_update_time')
        .order('last_seen', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setLastCheckTime(data.last_check_time);
        setLastUpdateTime(data.last_update_time);
      }
    };

    fetchUpdateTimes();
    const interval = setInterval(fetchUpdateTimes, 5000);

    const channel = supabase
      .channel('update_times_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'device_status'
        },
        () => {
          fetchUpdateTimes();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home size={28} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Home Dashboard</h1>
            </div>
            <div className="text-sm text-gray-600">{currentTime}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DeviceStatusCard />
          <WeatherCard />
          <SystemStatsCard />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              <span className="font-medium">Last Check:</span> {formatTimestamp(lastCheckTime)}
            </div>
            <div>
              <span className="font-medium">Last Update:</span> {formatTimestamp(lastUpdateTime)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
