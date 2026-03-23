import { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Card from './Card';

interface VictronSetting {
  id: string;
  key: string;
  value: string;
  description: string;
}

interface FormData {
  [key: string]: string | boolean;
}

export default function VictronSettingsPanel() {
  const [settings, setSettings] = useState<VictronSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState<FormData>({});

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
        .eq('category', 'victron')
        .order('key', { ascending: true });

      if (error) throw error;
      setSettings(data || []);

      const values: FormData = {};
      data?.forEach(setting => {
        values[setting.key] = setting.value === 'true' ? true : (setting.value === 'false' ? false : setting.value);
      });
      setFormData(values);
      setMessage('');
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('Failed to load Victron settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    setMessage('');

    try {
      for (const setting of settings) {
        const newValue = formData[setting.key];
        const stringValue = typeof newValue === 'boolean' ? String(newValue) : String(newValue);

        if (stringValue !== setting.value) {
          const { error } = await supabase
            .from('app_settings')
            .update({
              value: stringValue,
              updated_at: new Date().toISOString()
            })
            .eq('key', setting.key);

          if (error) throw error;
        }
      }

      setMessage('Victron settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save Victron settings');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = settings.some(setting => {
    const newValue = formData[setting.key];
    const stringValue = typeof newValue === 'boolean' ? String(newValue) : String(newValue);
    return stringValue !== setting.value;
  });

  if (loading) {
    return (
      <Card title="Victron Settings" icon={<Settings size={24} className="text-blue-600" />}>
        <div className="text-center text-gray-500">Loading settings...</div>
      </Card>
    );
  }

  if (settings.length === 0) {
    return null;
  }

  const booleanSettings = settings.filter(s => s.value === 'true' || s.value === 'false');
  const stringSettings = settings.filter(s => s.value !== 'true' && s.value !== 'false');

  return (
    <Card title="Victron Settings" icon={<Settings size={24} className="text-blue-600" />}>
      <div className="space-y-6">
        {message && (
          <div className={`p-3 rounded-lg flex gap-2 ${
            message.includes('success')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm">{message}</span>
          </div>
        )}

        {booleanSettings.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Feature Toggles</h3>
            <div className="space-y-3">
              {booleanSettings.map(setting => (
                <div key={setting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900">
                      {setting.key.split('_').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </label>
                    {setting.description && (
                      <p className="text-xs text-gray-600 mt-1">{setting.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleChange(setting.key, !(formData[setting.key] === true))}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${
                      formData[setting.key] === true ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        formData[setting.key] === true ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {stringSettings.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Configuration</h3>
            <div className="space-y-4">
              {stringSettings.map(setting => (
                <div key={setting.id}>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {setting.key.split('_').map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </label>
                  <input
                    type={setting.key.includes('port') ? 'text' : 'text'}
                    value={formData[setting.key] || ''}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder={setting.description}
                  />
                  {setting.description && (
                    <p className="mt-1 text-xs text-gray-600">{setting.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={loadSettings}
            disabled={saving}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium flex-1 justify-center"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </Card>
  );
}
