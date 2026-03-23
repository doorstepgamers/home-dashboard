import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { networkInterfaces } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createHmac } from 'crypto';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getSystemStats } from './system-stats.js';
import { createClient } from '@supabase/supabase-js';
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
let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}
app.use(cors());
app.use((req, res, next) => {
    if (req.path === '/api/webhook/github') {
        let rawBody = '';
        req.on('data', chunk => {
            rawBody += chunk.toString();
        });
        req.on('end', () => {
            req.rawBody = rawBody;
            try {
                req.body = JSON.parse(rawBody);
            }
            catch {
                req.body = {};
            }
            next();
        });
    }
    else {
        express.json()(req, res, next);
    }
});
app.use(express.static(DIST_DIR));
app.get('/api/system-stats', async (req, res) => {
    try {
        const stats = await getSystemStats();
        res.json(stats);
    }
    catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({ error: 'Failed to fetch system stats' });
    }
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/settings/:key', async (req, res) => {
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
        if (error)
            throw error;
        res.json({ value: data?.value || '' });
    }
    catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({ error: 'Failed to fetch setting' });
    }
});
app.post('/api/heartbeat', async (req, res) => {
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
            if (error)
                throw error;
        }
        else {
            const { error } = await supabase
                .from('device_status')
                .insert({
                id: device_id,
                device_name: device_name || 'Raspberry Pi',
                last_seen: new Date().toISOString(),
                system_info: system_info || {},
                ip_address: ip_address || null
            });
            if (error)
                throw error;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating heartbeat:', error);
        res.status(500).json({ error: 'Failed to update heartbeat' });
    }
});
app.post('/api/update-tracker', async (req, res) => {
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
        if (error)
            throw error;
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating tracker:', error);
        res.status(500).json({ error: 'Failed to update tracker' });
    }
});
app.post('/api/victron-data', async (req, res) => {
    if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
    }
    try {
        const { device_id, data } = req.body;
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
        if (error)
            throw error;
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error storing victron data:', error);
        res.status(500).json({ error: 'Failed to store victron data' });
    }
});
app.get('/api/victron-data/latest', async (req, res) => {
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
            query = query.eq('device_id', device_id);
        }
        const { data, error } = await query.maybeSingle();
        if (error)
            throw error;
        res.json(data || {});
    }
    catch (error) {
        console.error('Error fetching victron data:', error);
        res.status(500).json({ error: 'Failed to fetch victron data' });
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
                }
                catch {
                    // Device ID file might not exist, that's okay
                }
            }
            return { status: 'update completed successfully' };
        }
        catch (error) {
            console.error('Update failed:', error);
            return { status: 'update failed', error: String(error) };
        }
        finally {
            isUpdating = false;
        }
    }
    catch (error) {
        console.error('Update error:', error);
        return { status: 'update error', error: String(error) };
    }
}
app.post('/api/webhook/github', async (req, res) => {
    try {
        const signature = req.headers['x-hub-signature-256'];
        const rawBody = req.rawBody || '';
        if (!signature || !validateGitHubSignature(rawBody, signature)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }
        res.json({ status: 'update started' });
        await performUpdate();
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
app.post('/api/update', async (req, res) => {
    const result = await performUpdate();
    if (result.status === 'update already in progress') {
        return res.status(202).json(result);
    }
    if (result.error) {
        return res.status(500).json(result);
    }
    res.json(result);
});
app.get('*', (req, res) => {
    const indexPath = join(DIST_DIR, 'index.html');
    res.setHeader('Content-Type', 'text/html');
    res.send(readFileSync(indexPath, 'utf8'));
});
const server = createServer(app);
server.setOption?.('SO_REUSEADDR', 1);
server.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================`);
    console.log(`  Raspberry Pi Dashboard Started`);
    console.log(`========================================`);
    console.log(`Local:   http://localhost:${PORT}`);
    console.log(`Network: http://${getLocalIP()}:${PORT}`);
    console.log(`========================================`);
});
server.on('error', (err) => {
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
function validateGitHubSignature(rawBody, signature) {
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
//# sourceMappingURL=index.js.map