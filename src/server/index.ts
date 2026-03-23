import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { networkInterfaces } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createHmac } from 'crypto';
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getSystemStats } from './system-stats.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BluetoothManager } from './bluetooth-manager.js';
import { BluetoothSpeakerManager } from './speaker-manager.js';
import { LastFmService } from './lastfm-service.js';
import { initializeVictronReader, readVictronData } from './victron-reader.js';
import type { VictronData } from './victron-reader.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DIST_DIR = join(__dirname, '..', 'dist');
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'webhook-secret';
let isUpdating = false;

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const lastFmApiKey = process.env.LASTFM_API_KEY || '';
const lastFmApiSecret = process.env.LASTFM_API_SECRET || '';
let supabase: SupabaseClient | null = null;
let bluetoothManager: BluetoothManager | null = null;
let speakerManager: BluetoothSpeakerManager | null = null;
let lastFmService: LastFmService | null = null;
let lastFmSyncInterval: NodeJS.Timeout | null = null;
let victronReaderInitialized = false;
let victronPollInterval: NodeJS.Timeout | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  bluetoothManager = new BluetoothManager(supabase);
  speakerManager = new BluetoothSpeakerManager(supabase);
  if (lastFmApiKey && lastFmApiSecret) {
    lastFmService = new LastFmService(lastFmApiKey, lastFmApiSecret, supabase);
  }
}

app.use(cors());

app.use((req, res, next) => {
  if (req.path === '/api/webhook/github') {
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk.toString();
    });
    req.on('end', () => {
      (req as any).rawBody = rawBody;
      try {
        (req as any).body = JSON.parse(rawBody);
      } catch {
        (req as any).body = {};
      }
      next();
    });
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.static(DIST_DIR));

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

app.post('/api/victron-data', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { device_id, data } = req.body as { device_id: string; data: VictronData };

    if (!device_id || !data) {
      return res.status(400).json({ error: 'device_id and data are required' });
    }

    const { error } = await supabase
      .from('victron_data')
      .insert({
        device_id,
        device_type: data.device_type,
        pv_voltage: data.pv_voltage ?? null,
        pv_current: data.pv_current ?? null,
        pv_power: data.pv_power ?? null,
        battery_voltage: data.battery_voltage ?? null,
        battery_current: data.battery_current ?? null,
        battery_power: data.battery_power ?? null,
        load_current: data.load_current ?? null,
        yield_today: data.yield_today ?? null,
        yield_total: data.yield_total ?? null,
        efficiency: data.efficiency ?? null,
        temperature: data.temperature ?? null,
        state_of_operation: data.state_of_operation ?? null,
        error_code: data.error_code ?? null,
        raw_data: data.raw_data,
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error storing victron data:', error);
    res.status(500).json({ error: 'Failed to store victron data' });
  }
});

app.get('/api/victron-data/latest', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { device_id } = req.query;

    let query = supabase
      .from('victron_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1);

    if (device_id) {
      query = query.eq('device_id', device_id as string);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;

    res.json(data || {});
  } catch (error) {
    console.error('Error fetching victron data:', error);
    res.status(500).json({ error: 'Failed to fetch victron data' });
  }
});

app.get('/api/victron-devices', async (req: Request, res: Response) => {
  if (!bluetoothManager) {
    return res.status(500).json({ error: 'Bluetooth manager not initialized' });
  }

  try {
    const devices = await bluetoothManager.getAllDevices();
    res.json(devices);
  } catch (error) {
    console.error('Error fetching Victron devices:', error);
    res.status(500).json({ error: 'Failed to fetch Victron devices' });
  }
});

app.post('/api/victron-devices', async (req: Request, res: Response) => {
  if (!bluetoothManager) {
    return res.status(500).json({ error: 'Bluetooth manager not initialized' });
  }

  try {
    const { device_name, mac_address, device_type, pin_code } = req.body;

    if (!device_name || !mac_address || !device_type || !pin_code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['mppt', 'shunt'].includes(device_type)) {
      return res.status(400).json({ error: 'Invalid device type' });
    }

    const device = await bluetoothManager.registerDevice(
      device_name,
      mac_address,
      device_type,
      pin_code
    );

    res.status(201).json(device);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Error registering device:', error);
    res.status(500).json({ error: `Failed to register device: ${errorMessage}` });
  }
});

app.put('/api/victron-devices/:id', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { id } = req.params;
    const { device_name, is_active } = req.body;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (device_name !== undefined) updateData.device_name = device_name;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('victron_devices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

app.delete('/api/victron-devices/:id', async (req: Request, res: Response) => {
  if (!bluetoothManager) {
    return res.status(500).json({ error: 'Bluetooth manager not initialized' });
  }

  try {
    const { id } = req.params;
    await bluetoothManager.removeDevice(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing device:', error);
    res.status(500).json({ error: 'Failed to remove device' });
  }
});

let lastDiscoveredDevices: any[] = [];
let isDiscoveryInProgress = false;

app.post('/api/victron-devices/discover/scan', async (req: Request, res: Response) => {
  if (!bluetoothManager) {
    return res.status(500).json({ error: 'Bluetooth manager not initialized', devices: [] });
  }

  res.json({ devices: lastDiscoveredDevices, scanning: isDiscoveryInProgress });

  if (!isDiscoveryInProgress) {
    isDiscoveryInProgress = true;
    try {
      const devices = await bluetoothManager.discoverDevices();
      lastDiscoveredDevices = devices;
    } catch (error) {
      console.error('Error discovering devices:', error);
      lastDiscoveredDevices = [];
    } finally {
      isDiscoveryInProgress = false;
    }
  }
});

app.post('/api/victron-devices/:id/test-connection', async (req: Request, res: Response) => {
  if (!bluetoothManager) {
    return res.status(500).json({ error: 'Bluetooth manager not initialized' });
  }

  try {
    const { id } = req.params;
    const { pin_code } = req.body;

    if (!pin_code) {
      return res.status(400).json({ error: 'Pin code required' });
    }

    const success = await bluetoothManager.testConnection(id, pin_code);
    res.json({ success });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error testing connection:', errorMessage);
    res.status(500).json({ error: `Failed to test connection: ${errorMessage}` });
  }
});

app.get('/api/victron-devices/:id/status', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { id } = req.params;

    const { data: device, error } = await supabase
      .from('victron_devices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!device) return res.status(404).json({ error: 'Device not found' });

    res.json({
      id: device.id,
      device_name: device.device_name,
      connection_status: device.connection_status,
      signal_strength: device.signal_strength,
      last_sync: device.last_sync,
      sync_errors_count: device.sync_errors_count,
      last_error: device.last_error
    });
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ error: 'Failed to fetch device status' });
  }
});

app.get('/api/victron-devices/discovery/logs', async (req: Request, res: Response) => {
  if (!bluetoothManager) {
    return res.status(500).json({ error: 'Bluetooth manager not initialized' });
  }

  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const logs = await bluetoothManager.getDiscoveryLogs(limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching discovery logs:', error);
    res.status(500).json({ error: 'Failed to fetch discovery logs' });
  }
});

app.get('/api/speakers', async (req: Request, res: Response) => {
  if (!speakerManager) {
    return res.status(500).json({ error: 'Speaker manager not initialized' });
  }

  try {
    const speakers = await speakerManager.getAllSpeakers();
    res.json(speakers);
  } catch (error) {
    console.error('Error fetching speakers:', error);
    res.status(500).json({ error: 'Failed to fetch speakers' });
  }
});

app.get('/api/speakers/connected', async (req: Request, res: Response) => {
  if (!speakerManager) {
    return res.status(500).json({ error: 'Speaker manager not initialized' });
  }

  try {
    const speaker = await speakerManager.getConnectedSpeaker();
    res.json(speaker || {});
  } catch (error) {
    console.error('Error fetching connected speaker:', error);
    res.status(500).json({ error: 'Failed to fetch connected speaker' });
  }
});

app.post('/api/speakers/discover', async (req: Request, res: Response) => {
  if (!speakerManager) {
    return res.status(500).json({ error: 'Speaker manager not initialized' });
  }

  try {
    const speakers = await speakerManager.discoverSpeakers();
    res.json(speakers);
  } catch (error) {
    console.error('Error discovering speakers:', error);
    res.status(500).json({ error: 'Failed to discover speakers' });
  }
});

app.post('/api/speakers', async (req: Request, res: Response) => {
  if (!speakerManager) {
    return res.status(500).json({ error: 'Speaker manager not initialized' });
  }

  try {
    const { device_name, mac_address } = req.body;

    if (!device_name || !mac_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const speaker = await speakerManager.registerSpeaker(device_name, mac_address);
    res.status(201).json(speaker);
  } catch (error) {
    console.error('Error registering speaker:', error);
    res.status(500).json({ error: 'Failed to register speaker' });
  }
});

app.put('/api/speakers/:id/status', async (req: Request, res: Response) => {
  if (!speakerManager) {
    return res.status(500).json({ error: 'Speaker manager not initialized' });
  }

  try {
    const { id } = req.params;
    const { status, signal_strength } = req.body;

    if (!status || !['connected', 'disconnected', 'error'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await speakerManager.updateSpeakerStatus(id, status, signal_strength);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating speaker status:', error);
    res.status(500).json({ error: 'Failed to update speaker status' });
  }
});

app.delete('/api/speakers/:id', async (req: Request, res: Response) => {
  if (!speakerManager) {
    return res.status(500).json({ error: 'Speaker manager not initialized' });
  }

  try {
    const { id } = req.params;
    await speakerManager.removeSpeaker(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing speaker:', error);
    res.status(500).json({ error: 'Failed to remove speaker' });
  }
});

app.get('/api/music/playback', async (req: Request, res: Response) => {
  if (!speakerManager) {
    return res.status(500).json({ error: 'Speaker manager not initialized' });
  }

  try {
    const playback = await speakerManager.getPlaybackState();
    res.json(playback || {});
  } catch (error) {
    console.error('Error fetching playback state:', error);
    res.status(500).json({ error: 'Failed to fetch playback state' });
  }
});

app.put('/api/music/playback/:id', async (req: Request, res: Response) => {
  if (!speakerManager) {
    return res.status(500).json({ error: 'Speaker manager not initialized' });
  }

  try {
    const { id } = req.params;
    const updates = req.body;

    await speakerManager.updatePlaybackState(id, updates);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating playback state:', error);
    res.status(500).json({ error: 'Failed to update playback state' });
  }
});

app.put('/api/music/track/:id', async (req: Request, res: Response) => {
  if (!speakerManager) {
    return res.status(500).json({ error: 'Speaker manager not initialized' });
  }

  try {
    const { id } = req.params;
    const { track_title, artist_name, album_name, album_artwork_url } = req.body;

    if (!track_title || !artist_name || !album_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await speakerManager.updatePlaybackTrack(
      id,
      track_title,
      artist_name,
      album_name,
      album_artwork_url
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating track:', error);
    res.status(500).json({ error: 'Failed to update track' });
  }
});

app.get('/api/lastfm/current', async (req: Request, res: Response) => {
  if (!lastFmService) {
    return res.status(500).json({ error: 'Last.fm service not configured' });
  }

  try {
    const track = await lastFmService.getStoredCurrentTrack();
    res.json(track || {});
  } catch (error) {
    console.error('Error fetching current Last.fm track:', error);
    res.status(500).json({ error: 'Failed to fetch current track' });
  }
});

app.get('/api/lastfm/recent', async (req: Request, res: Response) => {
  if (!lastFmService) {
    return res.status(500).json({ error: 'Last.fm service not configured' });
  }

  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const scrobbles = await lastFmService.getStoredScrobbles(limit, offset);
    res.json(scrobbles);
  } catch (error) {
    console.error('Error fetching Last.fm scrobbles:', error);
    res.status(500).json({ error: 'Failed to fetch scrobbles' });
  }
});

app.post('/api/lastfm/sync', async (req: Request, res: Response) => {
  if (!lastFmService || !supabase) {
    return res.status(500).json({ error: 'Last.fm service not configured' });
  }

  try {
    const { data: settings } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'lastfm_username')
      .maybeSingle();

    if (!settings?.value) {
      return res.status(400).json({ error: 'Last.fm username not configured' });
    }

    const username = settings.value;

    const currentTrack = await lastFmService.getCurrentTrack(username);
    if (currentTrack) {
      await lastFmService.storeCurrentTrack(currentTrack);
    }

    if (!currentTrack?.is_playing) {
      await lastFmService.storeScrobbles(username, 100);
    }

    res.json({ success: true, currentTrack });
  } catch (error) {
    console.error('Error syncing Last.fm data:', error);
    res.status(500).json({ error: 'Failed to sync Last.fm data' });
  }
});

app.post('/api/lastfm/config', async (req: Request, res: Response) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const { error: upsertError } = await supabase
      .from('app_settings')
      .upsert([
        {
          key: 'lastfm_username',
          value: username,
          category: 'music',
          description: 'Last.fm username for music scrobbling'
        }
      ]);

    if (upsertError) throw upsertError;

    res.json({ success: true });
  } catch (error) {
    console.error('Error configuring Last.fm:', error);
    res.status(500).json({ error: 'Failed to configure Last.fm' });
  }
});

async function performUpdate() {
  if (isUpdating) {
    return { status: 'update already in progress' };
  }

  try {
    isUpdating = true;
    const dashboardDir = process.env.DASHBOARD_DIR || `${process.env.HOME || '/home/pi'}/home-dashboard`;

    try {
      console.log('Starting update...');

      await execAsync(`cd "${dashboardDir}" && git pull`, { maxBuffer: 10 * 1024 * 1024 });
      console.log('Git pull completed');

      await execAsync(`cd "${dashboardDir}" && npm install`, { maxBuffer: 10 * 1024 * 1024, timeout: 120000 });
      console.log('npm install completed');

      await execAsync(`cd "${dashboardDir}" && npm run build`, { maxBuffer: 10 * 1024 * 1024, timeout: 120000 });
      console.log('Build completed');

      await execAsync('pm2 restart home-dashboard home-dashboard-heartbeat', { timeout: 30000 });
      console.log('PM2 processes restarted successfully');

      if (supabase) {
        const deviceIdFile = `${dashboardDir}/raspberry-pi/.device-id`;
        try {
          const deviceId = readFileSync(deviceIdFile, 'utf8').trim();
          await supabase
            .from('device_status')
            .update({ last_update_time: new Date().toISOString() })
            .eq('id', deviceId);
        } catch {
          // Device ID file might not exist, that's okay
        }
      }

      return { status: 'update completed successfully' };
    } catch (error) {
      console.error('Update failed:', error);
      return { status: 'update failed', error: String(error) };
    } finally {
      isUpdating = false;
    }
  } catch (error) {
    console.error('Update error:', error);
    return { status: 'update error', error: String(error) };
  }
}

app.post('/api/webhook/github', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const rawBody = (req as any).rawBody || '';

    if (!signature || !validateGitHubSignature(rawBody, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    res.json({ status: 'update started' });
    await performUpdate();
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.post('/api/update', async (req: Request, res: Response) => {
  const result = await performUpdate();

  if (result.status === 'update already in progress') {
    return res.status(202).json(result);
  }

  if (result.error) {
    return res.status(500).json(result);
  }

  res.json(result);
});

app.post('/api/restart', async (req: Request, res: Response) => {
  try {
    res.json({ status: 'restart initiated' });

    setTimeout(async () => {
      try {
        await execAsync('pm2 restart home-dashboard home-dashboard-heartbeat', { timeout: 30000 });
        console.log('PM2 processes restarted via API');
      } catch (error) {
        console.error('Restart failed:', error);
      }
    }, 500);
  } catch (error) {
    console.error('Restart error:', error);
    res.status(500).json({ error: 'Failed to initiate restart' });
  }
});

app.get('*', (req: Request, res: Response) => {
  const indexPath = join(DIST_DIR, 'index.html');
  res.setHeader('Content-Type', 'text/html');
  res.send(readFileSync(indexPath, 'utf8'));
});

const server = createServer(app);

(server as any).setOption?.('SO_REUSEADDR', 1);

async function initializeVictronSync() {
  try {
    console.log('Initializing Victron reader...');
    await initializeVictronReader();
    victronReaderInitialized = true;
    console.log('Victron reader initialized successfully');

    const pollInterval = parseInt(process.env.VICTRON_POLL_INTERVAL || '30') * 1000;

    if (victronPollInterval) clearInterval(victronPollInterval);

    victronPollInterval = setInterval(async () => {
      try {
        const data = await readVictronData();
        if (data && supabase) {
          const { data: devices } = await supabase
            .from('victron_devices')
            .select('id')
            .eq('is_active', true)
            .maybeSingle();

          const deviceId = devices?.id || 'default-shunt';

          await supabase
            .from('victron_data')
            .insert({
              device_id: deviceId,
              device_type: data.device_type,
              pv_voltage: data.pv_voltage ?? null,
              pv_current: data.pv_current ?? null,
              pv_power: data.pv_power ?? null,
              battery_voltage: data.battery_voltage ?? null,
              battery_current: data.battery_current ?? null,
              battery_power: data.battery_power ?? null,
              load_current: data.load_current ?? null,
              yield_today: data.yield_today ?? null,
              yield_total: data.yield_total ?? null,
              efficiency: data.efficiency ?? null,
              temperature: data.temperature ?? null,
              state_of_operation: data.state_of_operation ?? null,
              error_code: data.error_code ?? null,
              raw_data: data.raw_data,
            });
        }
      } catch (error) {
        console.error('Victron data sync error:', error);
      }
    }, pollInterval);

    console.log('Victron sync polling started');
  } catch (error) {
    console.warn('Victron reader initialization failed (this is normal if serial port is not available):', error instanceof Error ? error.message : String(error));
    victronReaderInitialized = false;
  }
}

async function initializeLastFmSync() {
  if (!lastFmService || !supabase) return;

  try {
    const { data: settings } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'lastfm_username')
      .maybeSingle();

    if (settings?.value) {
      console.log('Last.fm sync initialized');
      const syncInterval = parseInt(process.env.LASTFM_SYNC_INTERVAL || '30') * 1000;

      if (lastFmSyncInterval) clearInterval(lastFmSyncInterval);

      lastFmSyncInterval = setInterval(async () => {
        try {
          const username = settings.value;
          const currentTrack = await lastFmService.getCurrentTrack(username);
          if (currentTrack) {
            await lastFmService.storeCurrentTrack(currentTrack);
          }
          if (!currentTrack?.is_playing) {
            await lastFmService.storeScrobbles(username, 50);
          }
        } catch (error) {
          console.error('Last.fm sync error:', error);
        }
      }, syncInterval);

      try {
        const currentTrack = await lastFmService.getCurrentTrack(settings.value);
        if (currentTrack) {
          await lastFmService.storeCurrentTrack(currentTrack);
        }
      } catch (error) {
        console.error('Initial Last.fm sync failed:', error);
      }
    }
  } catch (error) {
    console.error('Failed to initialize Last.fm sync:', error);
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`  Raspberry Pi Dashboard Started`);
  console.log(`========================================`);
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Network: http://${getLocalIP()}:${PORT}`);
  console.log(`========================================`);
  initializeVictronSync();
  initializeLastFmSync();
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Retrying in 2 seconds...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT, '0.0.0.0');
    }, 2000);
  }
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

function validateGitHubSignature(rawBody: string, signature: string): boolean {
  const hmac = createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(rawBody);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;
  return signature === expectedSignature;
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
