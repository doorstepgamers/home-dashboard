import { useState, useEffect } from 'react';
import { Settings, Save, X, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <a
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Back to Dashboard
          </a>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success')
              ? 'bg-green-500/20 text-green-300 border border-green-500/50'
              : 'bg-red-500/20 text-red-300 border border-red-500/50'
          }`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="glass-card">
            <div className="text-center text-slate-400">Loading settings...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSettings).map(([category, categorySettings]) => (
              <div key={category} className="glass-card">
                <h2 className="text-xl font-semibold text-white mb-4 capitalize">
                  {category} Settings
                </h2>
                <div className="space-y-4">
                  {categorySettings.map(setting => (
                    <div key={setting.id}>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        {setting.key.split('_').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </label>
                      <input
                        type={setting.key.includes('key') ? 'password' : 'text'}
                        value={editedValues[setting.key] || ''}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={setting.description}
                      />
                      <p className="mt-1 text-xs text-slate-400">{setting.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-between gap-4">
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {updating ? 'Updating...' : 'Update from GitHub'}
              </button>
              <div className="flex gap-4">
                <button
                  onClick={loadSettings}
                  disabled={saving}
                  className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Changes
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
