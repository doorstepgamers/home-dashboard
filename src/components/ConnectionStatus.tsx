import { Wifi, WifiOff } from 'lucide-react';
import { DeviceConfig } from '../types/solar';

interface ConnectionStatusProps {
  devices: DeviceConfig[];
}

export function ConnectionStatus({ devices }: ConnectionStatusProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h3>
      <div className="space-y-3">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {device.is_connected ? (
                <Wifi className="text-green-500" size={20} />
              ) : (
                <WifiOff className="text-gray-400" size={20} />
              )}
              <div>
                <p className="font-medium text-gray-900">{device.device_name}</p>
                <p className="text-xs text-gray-500 capitalize">{device.device_type}</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                device.is_connected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {device.is_connected ? 'Connected' : 'Offline'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
