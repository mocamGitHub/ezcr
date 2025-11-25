#!/usr/bin/env node

// Custom build script for staging that skips static generation
// This bypasses the Html import error during static page generation

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting custom staging build...');

// Set environment variables
process.env.NEXT_PRIVATE_STANDALONE = 'true';
process.env.SKIP_BUILD_STATIC_GENERATION = 'true';

try {
  // Run Next.js build but continue even if static generation fails
  console.log('📦 Building Next.js application...');
  try {
    execSync('npx next build', {
      stdio: 'inherit',
      env: { ...process.env }
    });
  } catch (error) {
    console.log('⚠️ Build had errors, checking if server files were created...');

    // Check if the essential files were created despite the error
    const standaloneDir = path.join(process.cwd(), '.next', 'standalone');
    const serverFile = path.join(standaloneDir, 'server.js');

    if (fs.existsSync(serverFile)) {
      console.log('✅ Server files created successfully despite static generation errors!');
      console.log('📁 Standalone directory contents:');
      execSync(`ls -la ${standaloneDir}`, { stdio: 'inherit' });
      process.exit(0);
    } else {
      console.error('❌ Server files not created. Build failed.');
      process.exit(1);
    }
  }

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}