import { useState, useEffect } from 'react';
import { Cpu, HardDrive, Activity, Thermometer } from 'lucide-react';
import Card from './Card';

interface SystemStats {
  cpuUsage: number;
  cpuTemp: number;
  memoryUsed: number;
  memoryTotal: number;
  diskUsed: number;
  diskTotal: number;
  uptime: string;
}

export default function SystemStatsCard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);

      const response = await fetch('/api/system-stats');

      if (!response.ok) {
        throw new Error('Failed to fetch system stats');
      }

      const text = await response.text();

      try {
        const data = JSON.parse(text);
        setStats(data);
        setLoading(false);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system stats');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const getProgressColor = (percentage: number) => {
    if (percentage < 60) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const ProgressBar = ({ value, max, label, unit }: { value: number; max: number; label: string; unit: string }) => {
    const percentage = (value / max) * 100;
    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{label}</span>
          <span>{value.toFixed(1)}{unit} / {max.toFixed(1)}{unit}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <Card title="System Stats" icon={<Activity size={24} />}>
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-gray-400">Loading system stats...</div>
        </div>
      )}

      {error && (
        <div className="text-amber-600 text-sm bg-amber-50 p-3 rounded">
          {error}
          <div className="text-xs mt-1 text-gray-600">
            System stats will be available when running on Raspberry Pi
          </div>
        </div>
      )}

      {stats && !loading && (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
              <Cpu size={24} className="text-blue-600" />
              <div>
                <div className="text-xs text-gray-600">CPU Usage</div>
                <div className="text-lg font-semibold text-gray-800">{stats.cpuUsage.toFixed(1)}%</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded">
              <Thermometer size={24} className="text-orange-600" />
              <div>
                <div className="text-xs text-gray-600">CPU Temp</div>
                <div className="text-lg font-semibold text-gray-800">{stats.cpuTemp.toFixed(1)}°C</div>
              </div>
            </div>
          </div>

          <ProgressBar
            value={stats.memoryUsed}
            max={stats.memoryTotal}
            label="Memory"
            unit="GB"
          />

          <ProgressBar
            value={stats.diskUsed}
            max={stats.diskTotal}
            label="Disk Space"
            unit="GB"
          />

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <HardDrive size={16} className="text-gray-500" />
            <div className="text-xs text-gray-600">Uptime: {stats.uptime}</div>
          </div>
        </div>
      )}
    </Card>
  );
}
