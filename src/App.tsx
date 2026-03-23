import { Home, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import WeatherCard from './components/WeatherCard';
import SystemStatsCard from './components/SystemStatsCard';
import DeviceStatusCard from './components/DeviceStatusCard';
import { AdminDashboard } from './components/AdminDashboard';
import { supabase } from './lib/supabase';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );
  const [lastSeenTime, setLastSeenTime] = useState<string | null>(null);

  useEffect(() => {
    const isAdmin = window.location.pathname === '/admin';
    setShowAdmin(isAdmin);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const fetchLastSeen = async () => {
      const { data } = await client
        .from('device_status')
        .select('last_seen')
        .order('last_seen', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setLastSeenTime(data.last_seen);
      }
    };

    fetchLastSeen();
    const interval = setInterval(fetchLastSeen, 5000);

    const channel = client
      .channel('device_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'device_status'
        },
        () => {
          fetchLastSeen();
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

  if (showAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home size={28} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Home Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">{currentTime}</div>
              <a
                href="/admin"
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Settings size={16} />
                Admin
              </a>
            </div>
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
          <div className="text-xs text-gray-600">
            <span className="font-medium">Last Device Heartbeat:</span> {formatTimestamp(lastSeenTime)}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
