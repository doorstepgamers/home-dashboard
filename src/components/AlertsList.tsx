import { AlertTriangle, CheckCircle } from 'lucide-react';
import { SystemAlert } from '../types/solar';

interface AlertsListProps {
  alerts: SystemAlert[];
}

export function AlertsList({ alerts }: AlertsListProps) {
  const activeAlerts = alerts.filter(a => a.is_active);

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
          <CheckCircle className="text-green-500" size={24} />
          <div>
            <p className="font-medium text-green-900">All Systems Normal</p>
            <p className="text-sm text-green-600">No active alerts</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        System Alerts ({activeAlerts.length})
      </h3>
      <div className="space-y-3">
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg"
          >
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium text-red-900">{alert.message}</p>
              <p className="text-sm text-red-600 mt-1">
                {new Date(alert.triggered_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
