import express from 'express';
import { getSystemStats } from './system-stats.js';
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
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
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`System stats API running on port ${PORT}`);
    });
}
export default app;
//# sourceMappingURL=index.js.map