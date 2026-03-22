import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import serverApp from '../dist-server/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;
const DIST_DIR = join(__dirname, '..', 'dist');

app.use('/api', serverApp);

app.use(express.static(DIST_DIR));

app.get('*', (req, res) => {
  const indexPath = join(DIST_DIR, 'index.html');
  res.setHeader('Content-Type', 'text/html');
  res.send(readFileSync(indexPath, 'utf8'));
});

const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard running on http://0.0.0.0:${PORT}`);
  console.log(`Access from network: http://${getLocalIP()}:${PORT}`);
});

function getLocalIP() {
  const os = require('os');
  const nets = os.networkInterfaces();
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
