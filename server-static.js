const http = require('http');
const fs = require('fs');
const path = require('path');

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';

console.log('Starting minimal static server...');
console.log('Port:', port);
console.log('Hostname:', hostname);

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);

  // Health check endpoint
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: 'static-minimal'
    }));
    return;
  }

  // Serve a basic HTML page
  if (req.url === '/' || req.url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EZ Cycle Ramp - Staging</title>
        </head>
        <body>
          <h1>Staging Server Running</h1>
          <p>The minimal static server is working!</p>
          <p>Time: ${new Date().toISOString()}</p>
          <p>Environment: ${process.env.NODE_ENV}</p>
          <p>Port: ${port}</p>
          <hr>
          <p>Next.js app is being configured...</p>
        </body>
      </html>
    `);
    return;
  }

  // Try to serve from .next/static
  const staticPath = path.join(process.cwd(), '.next', 'static', req.url);
  if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    const content = fs.readFileSync(staticPath);
    res.writeHead(200);
    res.end(content);
    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(port, hostname, () => {
  console.log(`> Minimal server ready on http://${hostname}:${port}`);
  console.log('> This is a fallback server to verify the container is running');
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});