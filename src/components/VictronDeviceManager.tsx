import { useState, useEffect } from 'react';
import { Bluetooth, Plus, Trash2, Check, X, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import Card from './Card';

interface VictronDevice {
  id: string;
  device_name: string;
  mac_address: string;
  device_type: 'mppt' | 'shunt';
  connection_status: 'connected' | 'disconnected' | 'error';
  last_sync: string | null;
  signal_strength: number | null;
  sync_errors_count: number;
  last_error: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DiscoveredDevice {
  mac_address: string;
  name: string;
  device_type: 'mppt' | 'shunt';
  signal_strength: number;
}

export default function VictronDeviceManager() {
  const [devices, setDevices] = useState<VictronDevice[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPinCode, setShowPinCode] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    device_name: '',
    mac_address: '',
    device_type: 'mppt' as 'mppt' | 'shunt',
    pin_code: ''
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/victron-devices');
      const data = await response.json();
      setDevices(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error loading devices:', err);
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverDevices = async () => {
    try {
      setDiscovering(true);
      setError(null);

      const response = await fetch('/api/victron-devices/discover/scan', {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Discovery failed');

      const result = await response.json();
      const { devices = [], scanning = false } = result;

      setDiscoveredDevices(devices);
      setSuccess(`Found ${devices.length} device(s)${scanning ? ' (scanning in progress...)' : ''}`);

      if (scanning) {
        let pollCount = 0;
        const pollInterval = setInterval(async () => {
          pollCount++;
          if (pollCount > 15) {
            clearInterval(pollInterval);
            setDiscovering(false);
            return;
          }

          try {
            const pollResponse = await fetch('/api/victron-devices/discover/scan', {
              method: 'POST'
            });

            if (pollResponse.ok) {
              const pollResult = await pollResponse.json();
              const { devices: updatedDevices = [], scanning: stillScanning = false } = pollResult;

              setDiscoveredDevices(updatedDevices);
              if (updatedDevices.length > 0) {
                setSuccess(`Found ${updatedDevices.length} device(s)`);
              }

              if (!stillScanning) {
                clearInterval(pollInterval);
                setDiscovering(false);
              }
            }
          } catch (pollErr) {
            console.error('Error polling discovery results:', pollErr);
          }
        }, 1000);
      } else {
        setDiscovering(false);
      }
    } catch (err) {
      console.error('Error discovering devices:', err);
      setError('Failed to discover devices');
      setDiscovering(false);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.device_name || !formData.mac_address || !formData.pin_code) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/victron-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add device');
      }

      const newDevice = await response.json();
      setDevices([...devices, newDevice]);
      setSuccess('Device added successfully');
      setFormData({
        device_name: '',
        mac_address: '',
        device_type: 'mppt',
        pin_code: ''
      });
      setShowAddForm(false);
      setDiscoveredDevices([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add device');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (deviceId: string, pinCode: string) => {
    try {
      setTestingConnection(deviceId);
      setError(null);

      const response = await fetch(`/api/victron-devices/${deviceId}/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin_code: pinCode })
      });

      if (!response.ok) throw new Error('Connection test failed');

      const result = await response.json();
      if (result.success) {
        setSuccess('Connection test successful');
        await loadDevices();
      } else {
        setError('Connection test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this device?')) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/victron-devices/${deviceId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to remove device');

      setDevices(devices.filter(d => d.id !== deviceId));
      setSuccess('Device removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove device');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (device: VictronDevice) => {
    try {
      const response = await fetch(`/api/victron-devices/${device.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !device.is_active })
      });

      if (!response.ok) throw new Error('Failed to update device');

      const updated = await response.json();
      setDevices(devices.map(d => d.id === device.id ? updated : d));
      setSuccess(`Device ${!device.is_active ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getDeviceIcon = (type: string) => {
    return type === 'mppt' ? '☀️' : '🔋';
  };

  return (
    <div className="space-y-6">
      <Card title="Victron Devices" icon={<Bluetooth size={24} className="text-blue-600" />}>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex gap-2 text-red-700 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex gap-2 text-green-700 text-sm">
              <Check size={18} className="flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bluetooth size={32} className="mx-auto mb-2 opacity-30" />
              <p>No Victron devices connected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map(device => (
                <div key={device.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getDeviceIcon(device.device_type)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{device.device_name}</h4>
                          <p className="text-xs text-gray-500">{device.mac_address}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <div className={`inline-block ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(device.connection_status)}`}>
                            {device.connection_status}
                          </div>
                        </div>
                        {device.signal_strength && (
                          <div>
                            <span className="text-gray-600">Signal:</span>
                            <span className="ml-2 font-mono">{device.signal_strength} dBm</span>
                          </div>
                        )}
                        {device.last_sync && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Last sync:</span>
                            <span className="ml-2 text-gray-700">
                              {new Date(device.last_sync).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                        {device.last_error && (
                          <div className="col-span-2 text-red-600">
                            <span className="text-gray-600">Error:</span>
                            <span className="ml-2">{device.last_error}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleToggleActive(device)}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition"
                        style={{
                          background: device.is_active ? '#dbeafe' : '#f3f4f6',
                          color: device.is_active ? '#0369a1' : '#6b7280'
                        }}
                      >
                        {device.is_active ? '✓ Active' : '○ Inactive'}
                      </button>

                      <button
                        onClick={() => {
                          const pinCode = prompt('Enter device PIN code:');
                          if (pinCode) {
                            handleTestConnection(device.id, pinCode);
                          }
                        }}
                        disabled={testingConnection === device.id || loading}
                        className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition disabled:opacity-50"
                      >
                        {testingConnection === device.id ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            Test
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleRemoveDevice(device.id)}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 space-y-3">
            <button
              onClick={handleDiscoverDevices}
              disabled={discovering || loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition disabled:opacity-50"
            >
              {discovering ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Bluetooth size={18} />
                  Scan for Devices
                </>
              )}
            </button>

            {discoveredDevices.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-blue-900">Discovered Devices:</p>
                {discoveredDevices.map((dev, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm text-blue-700 bg-white p-2 rounded">
                    <span>{getDeviceIcon(dev.device_type)} {dev.name} ({dev.mac_address})</span>
                    <span className="text-xs text-gray-500">{dev.signal_strength} dBm</span>
                  </div>
                ))}
              </div>
            )}

            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 font-medium transition"
              >
                <Plus size={18} />
                Add Device
              </button>
            ) : (
              <form onSubmit={handleAddDevice} className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-200">
                <h3 className="font-semibold text-gray-900">Add Victron Device</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
                  <input
                    type="text"
                    value={formData.device_name}
                    onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                    placeholder="e.g., MPPT 75/15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MAC Address</label>
                  <input
                    type="text"
                    value={formData.mac_address}
                    onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                    placeholder="e.g., 00:1A:7D:DA:71:13"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
                  <select
                    value={formData.device_type}
                    onChange={(e) => setFormData({ ...formData, device_type: e.target.value as 'mppt' | 'shunt' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mppt">MPPT Controller</option>
                    <option value="shunt">Battery Shunt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                  <div className="flex gap-2">
                    <input
                      type={showPinCode === 'new' ? 'text' : 'password'}
                      value={formData.pin_code}
                      onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                      placeholder="Device PIN code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinCode(showPinCode === 'new' ? null : 'new')}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                    >
                      {showPinCode === 'new' ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Add Device
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
