import { useState, useEffect } from 'react';
import { Bluetooth, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Card from './Card';

interface ServiceStatus {
  name: string;
  status: 'active' | 'inactive' | 'error';
  description: string;
  icon: React.ReactNode;
}

export default function ServiceStatusMonitor() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkServices = async () => {
    try {
      const btResponse = await fetch('/api/victron-devices');
      const btData = await btResponse.json();
      const bluetoothActive = btResponse.ok && Array.isArray(btData) && btData.length > 0;

      setServices([
        {
          name: 'Bluetooth Manager',
          status: bluetoothActive ? 'active' : 'inactive',
          description: bluetoothActive
            ? `${btData.length} device${btData.length !== 1 ? 's' : ''} connected`
            : 'No devices connected',
          icon: <Bluetooth className="w-5 h-5" />
        },
        {
          name: 'Victron Reader',
          status: bluetoothActive ? 'active' : 'inactive',
          description: 'VE.Direct serial reader',
          icon: <Bluetooth className="w-5 h-5" />
        }
      ]);
    } catch (error) {
      console.error('Error checking services:', error);
      setServices([
        {
          name: 'Bluetooth Manager',
          status: 'error',
          description: 'Failed to check status',
          icon: <Bluetooth className="w-5 h-5" />
        },
        {
          name: 'Victron Reader',
          status: 'error',
          description: 'Failed to check status',
          icon: <Bluetooth className="w-5 h-5" />
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: 'active' | 'inactive' | 'error') => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: 'active' | 'inactive' | 'error') => {
    switch (status) {
      case 'active':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: 'active' | 'inactive' | 'error') => {
    switch (status) {
      case 'active':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <Card title="Service Status" icon={<Bluetooth size={24} className="text-blue-600" />}>
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-6 text-gray-500">
            Checking services...
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.name}
              className={`border rounded-lg p-4 flex items-start gap-3 transition ${getStatusColor(service.status)}`}
            >
              <div className="mt-0.5">
                {getStatusIcon(service.status)}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${getStatusText(service.status)}`}>
                  {service.name}
                </h4>
                <p className="text-sm text-gray-600 mt-0.5">
                  {service.description}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                service.status === 'active'
                  ? 'bg-green-200 text-green-800'
                  : service.status === 'error'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-gray-200 text-gray-800'
              }`}>
                {service.status}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
