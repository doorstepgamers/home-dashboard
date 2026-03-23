import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getSetting(key: string): Promise<string> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return '';
  }

  return data?.value || '';
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', keys);

  if (error) {
    console.error('Error fetching settings:', error);
    return {};
  }

  const settings: Record<string, string> = {};
  data?.forEach(setting => {
    settings[setting.key] = setting.value;
  });

  return settings;
}
