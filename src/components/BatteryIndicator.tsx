import { Battery, BatteryCharging, BatteryWarning } from 'lucide-react';

interface BatteryIndicatorProps {
  soc: number;
  isCharging: boolean;
  voltage: number;
}

export function BatteryIndicator({ soc, isCharging, voltage }: BatteryIndicatorProps) {
  const getStatusColor = () => {
    if (soc >= 70) return 'bg-green-500';
    if (soc >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (soc >= 70) return 'text-green-600';
    if (soc >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBatteryIcon = () => {
    if (soc < 20) return BatteryWarning;
    if (isCharging) return BatteryCharging;
    return Battery;
  };

  const Icon = getBatteryIcon();

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Battery Status</h3>
        <Icon className={getTextColor()} size={28} />
      </div>

      <div className="relative mb-6">
        <div className="w-full h-16 bg-gray-200 rounded-lg overflow-hidden">
          <div
            className={`h-full ${getStatusColor()} transition-all duration-500 flex items-center justify-center`}
            style={{ width: `${soc}%` }}
          >
            {soc > 15 && (
              <span className="text-white font-bold text-xl">{soc.toFixed(0)}%</span>
            )}
          </div>
        </div>
        {soc <= 15 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-700 font-bold text-xl">{soc.toFixed(0)}%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Voltage</p>
          <p className="text-xl font-bold text-gray-900">{voltage.toFixed(2)}V</p>
        </div>
        <div>
          <p className="text-gray-600">Status</p>
          <p className="text-xl font-bold text-gray-900">
            {isCharging ? 'Charging' : 'Discharging'}
          </p>
        </div>
      </div>
    </div>
  );
}
