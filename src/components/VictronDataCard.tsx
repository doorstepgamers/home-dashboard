import { useState, useEffect } from 'react';
import { Zap, Droplet, Thermometer, AlertCircle, ChevronDown } from 'lucide-react';
import Card from './Card';
import { supabase } from '../lib/supabase';

interface VictronData {
  id: string;
  device_type: 'mppt' | 'shunt';
  timestamp: string;
  pv_voltage: number | null;
  pv_current: number | null;
  pv_power: number | null;
  battery_voltage: number | null;
  battery_current: number | null;
  battery_power: number | null;
  load_current: number | null;
  yield_today: number | null;
  yield_total: number | null;
  efficiency: number | null;
  temperature: number | null;
  state_of_operation: string | null;
  error_code: string | null;
}

interface VictronDevice {
  id: string;
  device_name: string;
  device_type: 'mppt' | 'shunt';
  connection_status: string;
}

export default function VictronDataCard() {
  const [victronData, setVictronData] = useState<VictronData | null>(null);
  const [devices, setDevices] = useState<VictronDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    const loadDevices = async () => {
      try {
        const response = await fetch('/api/victron-devices');
        const data = await response.json();
        setDevices(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedDeviceId(data[0].id);
        }
      } catch (err) {
        console.error('Error loading devices:', err);
      }
    };

    loadDevices();
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const fetchVictronData = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('victron_data')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1);

        if (selectedDeviceId) {
          query = query.eq('device_id', selectedDeviceId);
        }

        const { data, error: fetchError } = await query.maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setVictronData(data as VictronData);
          setError(null);
        } else {
          setError('No Victron data available');
        }
      } catch (err) {
        console.error('Error fetching Victron data:', err);
        setError('Failed to load Victron data');
      } finally {
        setLoading(false);
      }
    };

    fetchVictronData();
    const interval = setInterval(fetchVictronData, 30000);

    const channel = supabase
      .channel('victron_data_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'victron_data'
        },
        () => {
          fetchVictronData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [selectedDeviceId]);

  const formatValue = (value: number | null, unit: string, decimals = 2) => {
    if (value === null) return 'N/A';
    return `${value.toFixed(decimals)} ${unit}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) {
    return (
      <Card title="Victron Energy" icon={<Zap size={24} className="text-yellow-600" />}>
        <div className="animate-pulse text-center py-8 text-gray-500">Loading...</div>
      </Card>
    );
  }

  if (error || !victronData) {
    return (
      <Card title="Victron Energy" icon={<AlertCircle size={24} className="text-red-600" />}>
        <div className="text-center py-8 text-red-600">{error}</div>
      </Card>
    );
  }

  const isMPPT = victronData.device_type === 'mppt';
  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  return (
    <Card title="Victron Energy" icon={<Zap size={24} className="text-yellow-600" />}>
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {devices.length > 1 && (
              <div className="relative">
                <select
                  value={selectedDeviceId || ''}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 text-sm font-medium text-gray-700 cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  {devices.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.device_name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none" />
              </div>
            )}
            <span className="text-sm font-medium text-gray-600">
              {victronData.device_type === 'mppt' ? 'MPPT Controller' : 'Battery Shunt'}
            </span>
          </div>
          <span className="text-xs text-gray-500">{formatTimestamp(victronData.timestamp)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {isMPPT && victronData.pv_voltage !== null && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs font-semibold text-blue-600 mb-1">PV Voltage</div>
              <div className="text-lg font-bold text-blue-900">{formatValue(victronData.pv_voltage, 'V', 1)}</div>
            </div>
          )}

          {isMPPT && victronData.pv_current !== null && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs font-semibold text-blue-600 mb-1">PV Current</div>
              <div className="text-lg font-bold text-blue-900">{formatValue(victronData.pv_current, 'A', 1)}</div>
            </div>
          )}

          {isMPPT && victronData.pv_power !== null && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-xs font-semibold text-green-600 mb-1">PV Power</div>
              <div className="text-lg font-bold text-green-900">{formatValue(victronData.pv_power, 'W', 0)}</div>
            </div>
          )}

          {victronData.battery_voltage !== null && (
            <div className="bg-emerald-50 p-3 rounded-lg">
              <div className="text-xs font-semibold text-emerald-600 mb-1">Battery Voltage</div>
              <div className="text-lg font-bold text-emerald-900">{formatValue(victronData.battery_voltage, 'V', 2)}</div>
            </div>
          )}

          {victronData.battery_current !== null && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-xs font-semibold text-orange-600 mb-1">Battery Current</div>
              <div className="text-lg font-bold text-orange-900">{formatValue(victronData.battery_current, 'A', 1)}</div>
            </div>
          )}

          {victronData.battery_power !== null && (
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-xs font-semibold text-red-600 mb-1">Battery Power</div>
              <div className="text-lg font-bold text-red-900">{formatValue(victronData.battery_power, 'W', 0)}</div>
            </div>
          )}

          {victronData.load_current !== null && (
            <div className="bg-violet-50 p-3 rounded-lg">
              <div className="text-xs font-semibold text-violet-600 mb-1">Load Current</div>
              <div className="text-lg font-bold text-violet-900">{formatValue(victronData.load_current, 'A', 1)}</div>
            </div>
          )}

          {isMPPT && victronData.yield_today !== null && (
            <div className="bg-cyan-50 p-3 rounded-lg">
              <div className="text-xs font-semibold text-cyan-600 mb-1">Today's Yield</div>
              <div className="text-lg font-bold text-cyan-900">{formatValue(victronData.yield_today, 'Wh', 0)}</div>
            </div>
          )}

          {isMPPT && victronData.yield_total !== null && (
            <div className="bg-cyan-50 p-3 rounded-lg">
              <div className="text-xs font-semibold text-cyan-600 mb-1">Total Yield</div>
              <div className="text-lg font-bold text-cyan-900">{formatValue(victronData.yield_total, 'kWh', 2)}</div>
            </div>
          )}

          {victronData.temperature !== null && (
            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="text-xs font-semibold text-amber-600 mb-1 flex items-center gap-1">
                <Thermometer size={14} />
                Temperature
              </div>
              <div className="text-lg font-bold text-amber-900">{formatValue(victronData.temperature, '°C', 1)}</div>
            </div>
          )}

          {isMPPT && victronData.efficiency !== null && (
            <div className="bg-lime-50 p-3 rounded-lg">
              <div className="text-xs font-semibold text-lime-600 mb-1">Efficiency</div>
              <div className="text-lg font-bold text-lime-900">{victronData.efficiency.toFixed(0)}%</div>
            </div>
          )}
        </div>

        {victronData.state_of_operation && (
          <div className="bg-gray-50 p-2 rounded text-xs text-gray-700">
            <span className="font-semibold">State:</span> {victronData.state_of_operation}
          </div>
        )}

        {victronData.error_code && (
          <div className="bg-red-50 p-2 rounded text-xs text-red-700">
            <span className="font-semibold">Error:</span> {victronData.error_code}
          </div>
        )}
      </div>
    </Card>
  );
}
