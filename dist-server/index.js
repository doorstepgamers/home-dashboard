import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getSystemStats } from './system-stats.js';
import { createClient } from '@supabase/supabase-js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}
app.use(cors());
app.use(express.json());
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
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`System stats API running on port ${PORT}`);
    });
}
export default app;
//# sourceMappingURL=index.js.map