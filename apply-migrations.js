#!/usr/bin/env node
/**
 * Apply migrations 00016 and 00017 to the database
 * This uses the Supabase service role key to bypass RLS
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(filename, description) {
  console.log(`\n📝 Applying ${filename}...`);
  console.log(`   ${description}`);

  const filePath = path.join(__dirname, 'supabase', 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try alternative method - direct SQL execution
      console.log('   Trying direct SQL execution...');
      const { data: data2, error: error2 } = await supabase
        .from('_realtime')
        .select('*')
        .limit(0);

      // If that didn't work, we need to execute via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    }

    console.log('   ✅ Migration applied successfully');
    return true;
  } catch (err) {
    console.error(`   ❌ Failed to apply migration: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting migration process...');
  console.log(`📍 Database: ${supabaseUrl}`);
  console.log(`🏢 Tenant: ${process.env.NEXT_PUBLIC_TENANT_SLUG}`);

  let success = true;

  // Apply migration 00016 - Foreign Keys
  const fk_success = await applyMigration(
    '00016_add_foreign_keys.sql',
    'Adding foreign key constraints to user_profiles table'
  );
  success = success && fk_success;

  // Apply migration 00017 - Configurator Data
  const config_success = await applyMigration(
    '00017_seed_dev_configurator.sql',
    'Seeding configurator data for ezcr-dev tenant'
  );
  success = success && config_success;

  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ All migrations applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Test configurator: http://localhost:3002/configurator');
    console.log('2. Verify in Supabase dashboard');
  } else {
    console.log('❌ Some migrations failed. Check errors above.');
    console.log('\nManual application required via Supabase SQL Editor:');
    console.log('https://supabase.nexcyte.com');
  }
  console.log('='.repeat(50));
}

main().catch(console.error);
