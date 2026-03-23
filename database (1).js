import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { networkInterfaces } from 'os';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = join(__dirname, '..', 'dist');
const SERVER_DIR = join(__dirname, '..', 'dist-server');

if (!existsSync(DIST_DIR)) {
  console.error('Error: dist directory not found. Please run "npm run build" first.');
  process.exit(1);
}

if (!existsSync(SERVER_DIR)) {
  console.error('Error: dist-server directory not found. Please run "npm run build" first.');
  process.exit(1);
}

const serverAppModule = await import('../dist-server/index.js');
const serverApp = serverAppModule.default;

app.use('/api', serverApp);

app.use(express.static(DIST_DIR));

app.get('*', (req, res) => {
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
