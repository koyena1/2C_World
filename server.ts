import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

// Determine static build directory (supports both dist and build)
const staticDir = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist')
  : path.join(__dirname, 'build');

// Health check endpoints for Cloud Run ingress and container probes
app.get(['/healthz', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// Serve static assets with caching
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir, { maxAge: '1h' }));
}

// Fallback to index.html for SPA client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(staticDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('<!DOCTYPE html><html><head><title>2COMS Connect</title></head><body><div id="root">App is starting...</div></body></html>');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`2COMS Connect Server running on http://0.0.0.0:${PORT} (serving: ${staticDir})`);
});
