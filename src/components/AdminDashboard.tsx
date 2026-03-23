import { useState, useEffect } from 'react';
import { Settings, Save, X, Download, RotateCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VictronDeviceManager from './VictronDeviceManager';
import LastFmSettings from './LastFmSettings';

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
}

export function AdminDashboard() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [message, setMessage] = useState('');
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!supabase) {
      setMessage('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setSettings(data || []);

      const values: Record<string, string> = {};
      data?.forEach(setting => {
        values[setting.key] = setting.value;
      });
      setEditedValues(values);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    setMessage('');

    try {
      for (const setting of settings) {
        const newValue = editedValues[setting.key];
        if (newValue !== setting.value) {
          const { error } = await supabase
            .from('app_settings')
            .update({
              value: newValue,
              updated_at: new Date().toISOString()
            })
            .eq('key', setting.key);

          if (error) throw error;
        }
      }

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setMessage('');

    try {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(`Update failed: ${result.error || 'Unknown error'}`);
      } else {
        setMessage('Update started! This may take a few minutes...');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error triggering update:', error);
      setMessage('Failed to trigger update');
    } finally {
      setUpdating(false);
    }
  };

  const handleRestart = async () => {
    if (!confirm('Are you sure you want to restart the device?')) {
      return;
    }

    setRestarting(true);
    setMessage('');

    try {
      const response = await fetch('/api/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(`Restart failed: ${result.error || 'Unknown error'}`);
      } else {
        setMessage('Restart initiated! Device will reboot shortly...');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error triggering restart:', error);
      setMessage('Failed to trigger restart');
    } finally {
      setRestarting(false);
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  const hasChanges = settings.some(
    setting => editedValues[setting.key] !== setting.value
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <a
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
            Back to Dashboard
          </a>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="glass-card">
            <div className="text-center text-gray-500">Loading settings...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <VictronDeviceManager />
            <LastFmSettings />

            {Object.entries(groupedSettings).map(([category, categorySettings]) => (
              <div key={category} className="glass-card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
                  {category} Settings
                </h2>
                <div className="space-y-4">
                  {categorySettings.map(setting => (
                    <div key={setting.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {setting.key.split('_').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </label>
                      <input
                        type={setting.key.includes('key') ? 'password' : 'text'}
                        value={editedValues[setting.key] || ''}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={setting.description}
                      />
                      <p className="mt-1 text-xs text-gray-600">{setting.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-between gap-4">
              <div className="flex gap-4">
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {updating ? 'Updating...' : 'Update from GitHub'}
                </button>
                <button
                  onClick={handleRestart}
                  disabled={restarting}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCw className="w-4 h-4" />
                  {restarting ? 'Restarting...' : 'Restart Device'}
                </button>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={loadSettings}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Changes
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
