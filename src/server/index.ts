import express, { Request, Response, NextFunction } from 'express';
import { getSystemStats } from './system-stats.js';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/system-stats', async (req: Request, res: Response) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/heartbeat', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { device_id, device_name, system_info, ip_address } = req.body;

    const { data: existing } = await supabase
      .from('device_status')
      .select('id')
      .eq('id', device_id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('device_status')
        .update({
          last_seen: new Date().toISOString(),
          system_info: system_info || {},
          ip_address: ip_address || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', device_id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('device_status')
        .insert({
          id: device_id,
          device_name: device_name || 'Raspberry Pi',
          last_seen: new Date().toISOString(),
          system_info: system_info || {},
          ip_address: ip_address || null
        });

      if (error) throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    res.status(500).json({ error: 'Failed to update heartbeat' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`System stats API running on port ${PORT}`);
  });
}

export default app;
