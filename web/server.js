import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const WORKER_URL = process.env.WORKER_URL;

const app = express();

if (WORKER_URL) {
  // Mount on root with pathFilter so the full /api/... path reaches the Worker.
  // Using app.use('/api', ...) would strip the prefix before forwarding.
  app.use(
    createProxyMiddleware({
      pathFilter: '/api',
      target: WORKER_URL,
      changeOrigin: true,
      proxyTimeout: 600_000,
      timeout: 600_000,
    }),
  );
} else {
  console.warn('[server] WORKER_URL not set — /api/* requests will 404');
}

app.use(express.static(join(__dirname, 'dist')));

// SPA fallback — app.use without a path matches everything not yet handled
app.use((_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] http://0.0.0.0:${PORT}`);
});
