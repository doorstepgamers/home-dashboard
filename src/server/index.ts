import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { networkInterfaces } from 'os';
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getSystemStats } from './system-stats.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DIST_DIR = join(__dirname, '..', '..', 'dist');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

app.use(cors());
app.use(express.json());

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

app.get('/api/settings/:key', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { key } = req.params;
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;

    res.json({ value: data?.value || '' });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
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

app.post('/api/update-tracker', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { device_id, type } = req.body;

    if (!device_id || !type) {
      return res.status(400).json({ error: 'device_id and type are required' });
    }

    const updateField = type === 'check' ? 'last_check_time' : 'last_update_time';
    const timestamp = new Date().toISOString();

    const { error } = await supabase
      .from('device_status')
      .update({ [updateField]: timestamp })
      .eq('id', device_id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating tracker:', error);
    res.status(500).json({ error: 'Failed to update tracker' });
  }
});

app.use(express.static(DIST_DIR));

app.get('*', (req: Request, res: Response) => {
  const indexPath = join(DIST_DIR, 'index.html');
  res.setHeader('Content-Type', 'text/html');
  res.send(readFileSync(indexPath, 'utf8'));
});

const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`  Raspberry Pi Dashboard Started`);
  console.log(`========================================`);
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Network: http://${getLocalIP()}:${PORT}`);
  console.log(`========================================`);
});

function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
