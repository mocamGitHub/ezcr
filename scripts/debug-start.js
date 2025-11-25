#!/usr/bin/env node

// Debug script to understand what's happening during startup
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('=== DEBUG STARTUP INFORMATION ===');
console.log('Current directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('HOSTNAME:', process.env.HOSTNAME);

console.log('\n=== CHECKING FILE EXISTENCE ===');
const filesToCheck = [
  'server.js',
  '.next/standalone/server.js',
  '.next/server.js',
  '.next',
  'node_modules/next/dist/bin/next',
  'package.json',
  '.next/BUILD_ID',
  '.next/server',
  '.next/static',
];

filesToCheck.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✓' : '✗'} ${file}`);

  if (exists && fs.statSync(file).isDirectory()) {
    console.log(`  Contents of ${file}:`, fs.readdirSync(file).slice(0, 5).join(', '), '...');
  }
});

console.log('\n=== PACKAGE.JSON SCRIPTS ===');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('Available scripts:', Object.keys(packageJson.scripts));
  console.log('Start script:', packageJson.scripts.start);
} catch (error) {
  console.error('Error reading package.json:', error.message);
}

console.log('\n=== ATTEMPTING TO START SERVER ===');

// Try express server if available
if (fs.existsSync('server-express.js')) {
  console.log('Express server found, trying: node server-express.js');
  const server = spawn('node', ['server-express.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: process.env.PORT || '3000',
      HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
    },
    shell: true
  });

  server.on('error', (error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });

  server.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code);
  });
} else {
  // Fallback to npm start
  console.log('Running: npm start');
  const server = spawn('npm', ['start'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: process.env.PORT || '3000',
      HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
    },
    shell: true
  });

  server.on('error', (error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });

  server.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code);
  });
}