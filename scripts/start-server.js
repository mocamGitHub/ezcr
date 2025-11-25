#!/usr/bin/env node

// Server startup script with multiple fallback approaches
const { existsSync } = require('fs');
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting server with fallback approaches...');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Function to delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main startup function
async function startServer() {
  // Try different server start approaches
  const startApproaches = [
  {
    name: 'Standalone server.js (root)',
    file: 'server.js',
    command: 'node',
    args: ['server.js']
  },
  {
    name: 'Standalone server.js (.next/standalone)',
    file: '.next/standalone/server.js',
    command: 'node',
    args: ['.next/standalone/server.js']
  },
  {
    name: 'Next.js start command',
    file: 'node_modules/next/dist/bin/next',
    command: 'npx',
    args: ['next', 'start']
  },
  {
    name: 'Direct Next.js server',
    file: '.next/server/app',
    command: 'node',
    args: ['node_modules/next/dist/bin/next', 'start']
  },
  {
    name: 'Express server wrapper',
    file: 'server-express.js',
    command: 'node',
    args: ['server-express.js']
  },
  {
    name: 'Minimal static server (last resort)',
    file: 'server-static.js',
    command: 'node',
    args: ['server-static.js']
  }
  ];

  // Try each approach
  for (const approach of startApproaches) {
    console.log(`\n📋 Trying: ${approach.name}`);

    if (approach.file && !existsSync(approach.file)) {
      console.log(`  ❌ File not found: ${approach.file}`);
      continue;
    }

    console.log(`  ✅ Starting with ${approach.command} ${approach.args.join(' ')}`);

    // Start the server
    const server = spawn(approach.command, approach.args, {
      stdio: 'inherit',
      env: process.env,
      shell: true
    });

    server.on('error', (error) => {
      console.error(`  ❌ Failed to start: ${error.message}`);
    });

    server.on('exit', (code) => {
      if (code !== 0) {
        console.error(`  ❌ Server exited with code ${code}`);
      }
    });

    // Give it time to start
    await delay(3000);

    // If we get here and the process is still running, we're good
    if (!server.killed) {
      console.log(`  ✅ Server started successfully with ${approach.name}!`);

      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\n⏹️ Shutting down server...');
        server.kill('SIGTERM');
        process.exit(0);
      });

      // Prevent the script from exiting
      await new Promise(() => {});
    }
  }

  console.error('\n❌ All server start approaches failed!');
  console.log('\n📁 Checking available files:');
  console.log('  - server.js:', existsSync('server.js'));
  console.log('  - .next/standalone/server.js:', existsSync('.next/standalone/server.js'));
  console.log('  - .next directory:', existsSync('.next'));
  console.log('  - node_modules/next:', existsSync('node_modules/next'));

  process.exit(1);
}

// Start the server
startServer().catch(console.error);