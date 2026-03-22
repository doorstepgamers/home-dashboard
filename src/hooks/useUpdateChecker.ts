import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const APP_VERSION = '1.0.0';

interface UpdateInfo {
  available: boolean;
  latest_version?: string;
  deployment_url?: string;
}

export function useUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  const checkForUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const apiUrl = `${supabaseUrl}/functions/v1/check-updates`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          component: 'dashboard',
          current_version: APP_VERSION,
          device_id: 'dashboard',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUpdateInfo({
          available: data.update_available,
          latest_version: data.latest_version,
          deployment_url: data.deployment_url,
        });
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  useEffect(() => {
    checkForUpdates();

    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    updateInfo,
    isCheckingUpdates,
    currentVersion: APP_VERSION,
    checkForUpdates,
  };
}
