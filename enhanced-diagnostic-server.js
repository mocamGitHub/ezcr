const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('=== ENHANCED DIAGNOSTIC SERVER v2.0 ===');
console.log('Starting at:', new Date().toISOString());
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);
console.log('Hostname:', hostname);
console.log('Process ID:', process.pid);
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Log all environment variables (useful for debugging)
console.log('\n=== ENVIRONMENT VARIABLES ===');
Object.keys(process.env).sort().forEach(key => {
  if (!key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY')) {
    console.log(`${key}=${process.env[key]}`);
  }
});

// Check file system
console.log('\n=== FILE SYSTEM CHECK ===');
console.log('Root directory contents:');
try {
  const files = fs.readdirSync('.');
  files.forEach(file => {
    const stats = fs.statSync(file);
    console.log(`  ${file} (${stats.isDirectory() ? 'DIR' : 'FILE'})`);
  });
} catch (err) {
  console.log('  Error reading directory:', err.message);
}

// Request counter
let requestCount = 0;
const requestLog = [];

const server = http.createServer((req, res) => {
  requestCount++;
  const timestamp = new Date().toISOString();
  const logEntry = {
    count: requestCount,
    timestamp,
    method: req.method,
    url: req.url,
    headers: req.headers,
    remoteAddr: req.socket.remoteAddress
  };

  requestLog.push(logEntry);
  if (requestLog.length > 100) requestLog.shift(); // Keep last 100 requests

  console.log(`[${timestamp}] #${requestCount} ${req.method} ${req.url} from ${req.headers.host || 'unknown'} (${req.socket.remoteAddress})`);

  // Helper function to send JSON response
  const sendJson = (data, status = 200) => {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'X-Server': 'enhanced-diagnostic-v2',
      'X-Request-Count': requestCount.toString()
    });
    res.end(JSON.stringify(data, null, 2));
  };

  // Helper function to send HTML response
  const sendHtml = (html, status = 200) => {
    res.writeHead(status, {
      'Content-Type': 'text/html',
      'X-Server': 'enhanced-diagnostic-v2',
      'X-Request-Count': requestCount.toString()
    });
    res.end(html);
  };

  // Route handling
  const route = req.url.split('?')[0];

  switch(route) {
    case '/':
    case '':
      sendHtml(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Enhanced Diagnostic Server</title>
            <style>
              body { font-family: system-ui; max-width: 1200px; margin: 40px auto; padding: 20px; }
              h1 { color: #22c55e; }
              .info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .endpoint { background: white; border: 1px solid #e5e7eb; padding: 10px; margin: 10px 0; border-radius: 4px; }
              a { color: #3b82f6; text-decoration: none; }
              a:hover { text-decoration: underline; }
              .status { display: inline-block; padding: 4px 8px; background: #22c55e; color: white; border-radius: 4px; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>✅ Enhanced Diagnostic Server is Working!</h1>
            <span class="status">OPERATIONAL</span>

            <div class="info">
              <strong>Server Time:</strong> ${timestamp}<br>
              <strong>Request Count:</strong> #${requestCount}<br>
              <strong>Your IP:</strong> ${req.socket.remoteAddress}<br>
              <strong>Your Host Header:</strong> ${req.headers.host || 'none'}<br>
              <strong>Environment:</strong> ${process.env.NODE_ENV || 'not set'}<br>
              <strong>Server Port:</strong> ${port}
            </div>

            <h2>🔍 Diagnostic Endpoints</h2>
            <div class="endpoint">
              <a href="/health">/health</a> - Basic health check (returns OK)
            </div>
            <div class="endpoint">
              <a href="/api/health">/api/health</a> - API health check (JSON)
            </div>
            <div class="endpoint">
              <a href="/debug">/debug</a> - Full debug information (JSON)
            </div>
            <div class="endpoint">
              <a href="/headers">/headers</a> - Show all request headers
            </div>
            <div class="endpoint">
              <a href="/env">/env</a> - Environment variables (safe only)
            </div>
            <div class="endpoint">
              <a href="/files">/files</a> - File system structure
            </div>
            <div class="endpoint">
              <a href="/requests">/requests</a> - Recent request log
            </div>
            <div class="endpoint">
              <a href="/echo?test=123">/echo</a> - Echo back request details
            </div>
            <div class="endpoint">
              <a href="/test">/test</a> - Test API endpoint
            </div>

            <h2>📊 Quick Stats</h2>
            <div class="info">
              <strong>Process Uptime:</strong> ${Math.floor(process.uptime())} seconds<br>
              <strong>Memory Usage:</strong> ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB<br>
              <strong>Node Version:</strong> ${process.version}
            </div>

            <h2>🚀 Deployment Status</h2>
            <div class="info">
              This diagnostic server confirms that:<br>
              ✅ Docker container is running<br>
              ✅ Port ${port} is exposed<br>
              ✅ HTTP server is responding<br>
              ${req.headers.host === 'staging.ezcycleramp.com' ? '✅ Domain routing is working' : '⚠️ Accessed via: ' + (req.headers.host || 'direct IP')}
            </div>
          </body>
        </html>
      `);
      break;

    case '/health':
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
      break;

    case '/api/health':
      sendJson({
        status: 'healthy',
        timestamp,
        uptime: process.uptime(),
        requestCount,
        server: 'enhanced-diagnostic-v2'
      });
      break;

    case '/debug':
      sendJson({
        message: 'Full debug information',
        timestamp,
        request: {
          method: req.method,
          url: req.url,
          headers: req.headers,
          httpVersion: req.httpVersion,
          remoteAddress: req.socket.remoteAddress,
          remotePort: req.socket.remotePort
        },
        server: {
          hostname,
          port,
          cwd: process.cwd(),
          pid: process.pid,
          nodeVersion: process.version,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
          HOSTNAME: process.env.HOSTNAME,
          HOME: process.env.HOME,
          USER: process.env.USER,
          PWD: process.env.PWD
        },
        files: {
          '.next': fs.existsSync('.next'),
          'src': fs.existsSync('src'),
          'public': fs.existsSync('public'),
          'node_modules': fs.existsSync('node_modules'),
          'package.json': fs.existsSync('package.json'),
          'next.config.js': fs.existsSync('next.config.js')
        },
        requestCount,
        requestLog: requestLog.slice(-5) // Last 5 requests
      });
      break;

    case '/headers':
      sendJson({
        message: 'Your request headers',
        timestamp,
        headers: req.headers,
        remoteAddress: req.socket.remoteAddress
      });
      break;

    case '/env':
      const safeEnv = {};
      Object.keys(process.env).forEach(key => {
        if (!key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY') && !key.includes('TOKEN')) {
          safeEnv[key] = process.env[key];
        }
      });
      sendJson({
        message: 'Environment variables (sensitive excluded)',
        timestamp,
        environment: safeEnv
      });
      break;

    case '/files':
      const getDirectoryStructure = (dir, level = 0, maxLevel = 2) => {
        if (level > maxLevel) return [];
        const items = [];
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            if (file.startsWith('.') && file !== '.next') continue;
            if (file === 'node_modules' && level > 0) continue;

            const fullPath = path.join(dir, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
              items.push({
                name: file,
                type: 'directory',
                children: getDirectoryStructure(fullPath, level + 1, maxLevel)
              });
            } else {
              items.push({
                name: file,
                type: 'file',
                size: stats.size
              });
            }
          }
        } catch (err) {
          items.push({ error: err.message });
        }
        return items;
      };

      sendJson({
        message: 'File system structure',
        timestamp,
        structure: getDirectoryStructure('.', 0, 2)
      });
      break;

    case '/requests':
      sendJson({
        message: 'Recent requests',
        timestamp,
        totalRequests: requestCount,
        recentRequests: requestLog.slice(-20).reverse()
      });
      break;

    case '/echo':
      sendJson({
        message: 'Echo endpoint - reflecting your request',
        timestamp,
        request: {
          method: req.method,
          url: req.url,
          headers: req.headers,
          query: req.url.includes('?') ? req.url.split('?')[1] : null,
          remoteAddress: req.socket.remoteAddress
        },
        server: {
          respondingPort: port,
          respondingHost: hostname
        }
      });
      break;

    case '/test':
      sendJson({
        message: 'Test endpoint working!',
        timestamp,
        data: {
          random: Math.random(),
          serverTime: new Date().toISOString(),
          requestNumber: requestCount
        }
      });
      break;

    default:
      sendJson({
        error: 'Not Found',
        message: `The path '${route}' does not exist`,
        timestamp,
        availableEndpoints: [
          '/', '/health', '/api/health', '/debug',
          '/headers', '/env', '/files', '/requests',
          '/echo', '/test'
        ]
      }, 404);
  }
});

server.listen(port, hostname, () => {
  console.log(`\n=== SERVER STARTED SUCCESSFULLY ===`);
  console.log(`> Enhanced Diagnostic Server v2.0`);
  console.log(`> Listening on http://${hostname}:${port}`);
  console.log(`> Process ID: ${process.pid}`);
  console.log(`> Ready to receive requests...`);
  console.log(`\nVisit http://${hostname}:${port} for the diagnostic dashboard`);
});

server.on('error', (err) => {
  console.error('=== SERVER ERROR ===');
  console.error(err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});