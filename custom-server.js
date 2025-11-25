const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('Starting custom Next.js server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);
console.log('Hostname:', hostname);

const app = next({
  dev,
  hostname,
  port,
  dir: process.cwd(),
  conf: {
    distDir: '.next',
  }
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

      // Add diagnostic endpoint
      if (pathname === '/debug') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Server is receiving requests!',
          timestamp: new Date().toISOString(),
          cwd: process.cwd(),
          env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            HOSTNAME: process.env.HOSTNAME,
          },
          headers: req.headers,
          url: req.url,
          method: req.method,
        }, null, 2));
        return;
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Custom server ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});