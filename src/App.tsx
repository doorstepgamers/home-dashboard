import { useEffect, useState } from 'react';
import { Sun, Zap, Battery, Activity, TrendingUp } from 'lucide-react';
import { supabase } from './lib/supabase';
import { SolarMetrics, DeviceConfig, SystemAlert } from './types/solar';
import { MetricCard } from './components/MetricCard';
import { BatteryIndicator } from './components/BatteryIndicator';
import { ConnectionStatus } from './components/ConnectionStatus';
import { AlertsList } from './components/AlertsList';
import { HistoryChart } from './components/HistoryChart';

function App() {
  const [currentMetrics, setCurrentMetrics] = useState<SolarMetrics | null>(null);
  const [history, setHistory] = useState<SolarMetrics[]>([]);
  const [devices, setDevices] = useState<DeviceConfig[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
    subscribeToRealtime();
  }, []);

  async function fetchInitialData() {
    try {
      const [metricsRes, historyRes, devicesRes, alertsRes] = await Promise.all([
        supabase
          .from('solar_metrics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('solar_history')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100),
        supabase.from('device_config').select('*'),
        supabase
          .from('system_alerts')
          .select('*')
          .eq('is_active', true)
          .order('triggered_at', { ascending: false })
      ]);

      if (metricsRes.data) setCurrentMetrics(metricsRes.data);
      if (historyRes.data) setHistory(historyRes.data.reverse());
      if (devicesRes.data) setDevices(devicesRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToRealtime() {
    const metricsChannel = supabase
      .channel('solar_metrics_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'solar_metrics' },
        (payload) => {
          setCurrentMetrics(payload.new as SolarMetrics);
        }
      )
      .subscribe();

    const historyChannel = supabase
      .channel('solar_history_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'solar_history' },
        (payload) => {
          setHistory((prev) => [...prev.slice(-99), payload.new as SolarMetrics]);
        }
      )
      .subscribe();

    const devicesChannel = supabase
      .channel('device_config_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'device_config' },
        () => {
          supabase.from('device_config').select('*').then(({ data }) => {
            if (data) setDevices(data);
          });
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel('system_alerts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_alerts' },
        () => {
          supabase
            .from('system_alerts')
            .select('*')
            .eq('is_active', true)
            .order('triggered_at', { ascending: false })
            .then(({ data }) => {
              if (data) setAlerts(data);
            });
        }
      )
      .subscribe();

    return () => {
      metricsChannel.unsubscribe();
      historyChannel.unsubscribe();
      devicesChannel.unsubscribe();
      alertsChannel.unsubscribe();
    };
  }

  const getStatus = (value: number | null, thresholds: { good: number; warning: number }) => {
    if (value === null) return 'good';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.warning) return 'warning';
    return 'critical';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading solar data...</p>
        </div>
      </div>
    );
  }

  const isCharging = (currentMetrics?.battery_current ?? 0) > 0;
  const batteryVoltage = currentMetrics?.battery_voltage ?? 0;
  const batterySoc = currentMetrics?.battery_soc ?? 0;
  const solarPower = currentMetrics?.solar_power ?? 0;
  const batteryPower = currentMetrics?.battery_power ?? 0;
  const inverterPower = currentMetrics?.inverter_power ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sun className="text-blue-600" size={40} />
            <h1 className="text-4xl font-bold text-gray-900">Van Solar Monitor</h1>
          </div>
          <p className="text-gray-600">
            Real-time monitoring of your Victron solar system
          </p>
          {currentMetrics && (
            <p className="text-sm text-gray-500 mt-1">
              Last update: {new Date(currentMetrics.timestamp).toLocaleString()}
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <BatteryIndicator
              soc={batterySoc}
              isCharging={isCharging}
              voltage={batteryVoltage}
            />
          </div>
          <div className="space-y-6">
            <ConnectionStatus devices={devices} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Solar Power"
            value={solarPower}
            unit="W"
            icon={Sun}
            status={solarPower > 50 ? 'good' : 'warning'}
          />
          <MetricCard
            title="Battery Current"
            value={Math.abs(currentMetrics?.battery_current ?? 0)}
            unit="A"
            icon={Zap}
            subtitle={isCharging ? 'Charging' : 'Discharging'}
            status="good"
          />
          <MetricCard
            title="Battery Power"
            value={Math.abs(batteryPower)}
            unit="W"
            icon={Battery}
            subtitle={isCharging ? 'Charging' : 'Discharging'}
            status="good"
          />
          <MetricCard
            title="Inverter Load"
            value={inverterPower}
            unit="W"
            icon={Activity}
            status={inverterPower < 500 ? 'good' : inverterPower < 1000 ? 'warning' : 'critical'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <HistoryChart
            history={history}
            metric="battery_voltage"
            title="Battery Voltage History"
            color="#3b82f6"
            unit="V"
          />
          <HistoryChart
            history={history}
            metric="battery_soc"
            title="State of Charge History"
            color="#10b981"
            unit="%"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <HistoryChart
            history={history}
            metric="solar_power"
            title="Solar Power Generation"
            color="#f59e0b"
            unit="W"
          />
          <HistoryChart
            history={history}
            metric="battery_power"
            title="Battery Power Flow"
            color="#8b5cf6"
            unit="W"
          />
        </div>

        <div className="mb-6">
          <AlertsList alerts={alerts} />
        </div>

        {currentMetrics?.charge_state && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Charge State</p>
                <p className="text-lg font-bold text-gray-900">{currentMetrics.charge_state}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Solar Voltage</p>
                <p className="text-lg font-bold text-gray-900">
                  {currentMetrics.solar_voltage?.toFixed(1) ?? '--'}V
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Consumed Ah</p>
                <p className="text-lg font-bold text-gray-900">
                  {currentMetrics.battery_consumed_ah?.toFixed(1) ?? '--'}Ah
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining Ah</p>
                <p className="text-lg font-bold text-gray-900">
                  {currentMetrics.battery_remaining_ah?.toFixed(1) ?? '--'}Ah
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
