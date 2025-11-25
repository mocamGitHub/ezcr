const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('=== SIMPLE DIAGNOSTIC SERVER STARTING ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);
console.log('Hostname:', hostname);
console.log('Current directory:', process.cwd());
console.log('Directory contents:', fs.readdirSync('.'));

// Check for important files
console.log('\n=== FILE CHECKS ===');
console.log('.next exists?', fs.existsSync('.next'));
console.log('src exists?', fs.existsSync('src'));
console.log('node_modules exists?', fs.existsSync('node_modules'));
console.log('package.json exists?', fs.existsSync('package.json'));

if (fs.existsSync('.next')) {
  console.log('.next contents:', fs.readdirSync('.next').slice(0, 10));
}

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.headers.host}`);

  // Simple routing
  if (req.url === '/' || req.url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Staging Server Diagnostic</title>
        </head>
        <body>
          <h1>🎉 Server is Working!</h1>
          <p>Simple server is responding correctly.</p>
          <p>Time: ${new Date().toISOString()}</p>
          <p>Environment: ${process.env.NODE_ENV}</p>
          <h2>Diagnostic Links:</h2>
          <ul>
            <li><a href="/debug">Debug Info</a></li>
            <li><a href="/api/health">Health Check</a></li>
            <li><a href="/test">Test API Route</a></li>
          </ul>
        </body>
      </html>
    `);
  } else if (req.url === '/debug') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Debug endpoint working!',
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
      files: {
        nextExists: fs.existsSync('.next'),
        srcExists: fs.existsSync('src'),
        nodeModulesExists: fs.existsSync('node_modules'),
      }
    }, null, 2));
  } else if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: 'simple-diagnostic'
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 - Not Found');
  }
});

server.listen(port, hostname, () => {
  console.log(`\n> Simple diagnostic server ready on http://${hostname}:${port}`);
  console.log('> Visit /debug for diagnostic information');
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});