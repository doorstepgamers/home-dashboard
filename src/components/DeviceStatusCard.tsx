import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import Card from './Card';
import { supabase } from '../lib/supabase';

interface DeviceStatus {
  id: string;
  device_name: string;
  last_seen: string;
  system_info: {
    cpu?: number;
    memory?: number;
    temperature?: number;
    uptime?: number;
    hostname?: string;
  };
  ip_address?: string;
  last_check_time?: string;
  last_update_time?: string;
}

export default function DeviceStatusCard() {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;

    const fetchDevices = async () => {
      const { data, error } = await client
        .from('device_status')
        .select('*')
        .order('last_seen', { ascending: false });

      if (error) {
        console.error('Error fetching devices:', error);
      } else {
        setDevices(data || []);
      }
      setLoading(false);
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);

    const channel = client
      .channel('device_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_status'
        },
        () => {
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  const isOnline = (lastSeen: string) => {
    const lastSeenTime = new Date(lastSeen).getTime();
    const now = new Date().getTime();
    return now - lastSeenTime < 30000;
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!supabase) {
    return (
      <Card
        title="Device Status"
        icon={<Activity size={24} className="text-gray-400" />}
      >
        <div className="text-center py-8 text-gray-500">
          Supabase not configured
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card
        title="Device Status"
        icon={<Activity size={24} className="text-blue-600" />}
      >
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Card
        title="Device Status"
        icon={<Activity size={24} className="text-gray-400" />}
      >
        <div className="text-center py-8 text-gray-500">
          No devices connected yet
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Device Status"
      icon={<Activity size={24} className="text-blue-600" />}
    >
      <div className="space-y-4">
        {devices.map((device) => {
          const online = isOnline(device.last_seen);
          const lastSeenTime = new Date(device.last_seen);
          const secondsAgo = Math.floor((new Date().getTime() - lastSeenTime.getTime()) / 1000);

          return (
            <div
              key={device.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {online ? (
                    <Wifi size={20} className="text-green-500" />
                  ) : (
                    <WifiOff size={20} className="text-red-500" />
                  )}
                  <span className="font-semibold text-gray-800">
                    {device.system_info.hostname || device.device_name}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    online
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {online ? 'Online' : 'Offline'}
                </span>
              </div>

              {device.ip_address && (
                <div className="text-sm text-gray-600 mb-2">
                  IP: {device.ip_address}
                </div>
              )}

              {online && device.system_info && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {device.system_info.cpu !== undefined && (
                    <div>
                      <span className="text-gray-600">CPU:</span>{' '}
                      <span className="font-medium text-gray-800">
                        {device.system_info.cpu.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {device.system_info.memory !== undefined && (
                    <div>
                      <span className="text-gray-600">Memory:</span>{' '}
                      <span className="font-medium text-gray-800">
                        {device.system_info.memory.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {device.system_info.temperature !== undefined && (
                    <div>
                      <span className="text-gray-600">Temp:</span>{' '}
                      <span className="font-medium text-gray-800">
                        {device.system_info.temperature.toFixed(1)}°C
                      </span>
                    </div>
                  )}
                  {device.system_info.uptime !== undefined && (
                    <div>
                      <span className="text-gray-600">Uptime:</span>{' '}
                      <span className="font-medium text-gray-800">
                        {formatUptime(device.system_info.uptime)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2 text-xs text-gray-500">
                Last seen: {secondsAgo < 60 ? `${secondsAgo}s ago` : lastSeenTime.toLocaleTimeString()}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
