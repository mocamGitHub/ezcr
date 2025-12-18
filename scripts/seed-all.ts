/**
 * Master Seed Script - Seeds all data for dev/staging environments
 *
 * Run: npx tsx scripts/seed-all.ts
 *
 * This script runs all individual seed scripts in the correct order
 * to ensure dependencies are satisfied (e.g., products before orders).
 *
 * Seed Order:
 * 1. FOMO Banners (no dependencies)
 * 2. Sample Tools (no dependencies)
 * 3. Sample Contacts (no dependencies)
 * 4. Testimonials (no dependencies)
 * 5. Order Templates (no dependencies)
 * 6. Orders (requires products - seeded via SQL)
 * 7. CRM Data (requires orders for customer emails)
 *
 * For individual seeds, run them directly:
 *   npx tsx scripts/seed-fomo-banners.ts
 *   npx tsx scripts/seed-orders.ts
 *   etc.
 */

import { execSync } from 'child_process'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SCRIPTS_DIR = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]):/, '$1:')

interface SeedScript {
  name: string
  file: string
  description: string
}

const seedScripts: SeedScript[] = [
  {
    name: 'FOMO Banners',
    file: 'seed-fomo-banners.ts',
    description: 'Urgency banners for the storefront',
  },
  {
    name: 'Sample Tools',
    file: 'seed-sample-tools.ts',
    description: 'Software subscriptions and services',
  },
  {
    name: 'Sample Contacts',
    file: 'seed-sample-contacts.ts',
    description: 'Business contacts (vendors, partners)',
  },
  {
    name: 'Testimonials',
    file: 'seed-testimonials.ts',
    description: 'Customer testimonials and reviews',
  },
  {
    name: 'Order Templates',
    file: 'seed-order-templates.ts',
    description: 'Email/SMS templates for order lifecycle',
  },
  {
    name: 'Comms Full',
    file: 'seed-comms-full.ts',
    description: 'Communications setup (contacts, templates)',
  },
  {
    name: 'Sample Orders',
    file: 'seed-orders.ts',
    description: 'Sample orders with various statuses',
  },
  {
    name: 'CRM Data',
    file: 'seed-crm.ts',
    description: 'Customer tags, notes, tasks, activities',
  },
]

async function runSeed(script: SeedScript): Promise<boolean> {
  const scriptPath = path.join(SCRIPTS_DIR, script.file)

  try {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🌱 Running: ${script.name}`)
    console.log(`   File: ${script.file}`)
    console.log(`   Description: ${script.description}`)
    console.log('='.repeat(60))

    execSync(`npx tsx "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })

    return true
  } catch (error) {
    console.error(`\n❌ Failed to run ${script.name}`)
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`)
    }
    return false
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║           EZCR Master Seed Script                          ║')
  console.log('║                                                            ║')
  console.log('║   This script seeds all data for dev/staging environments  ║')
  console.log('╚════════════════════════════════════════════════════════════╝')

  console.log('\nEnvironment check:')
  console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`)
  console.log(`  SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log(`  EZCR_TENANT_ID: ${process.env.EZCR_TENANT_ID ? '✅ Set' : '❌ Missing'}`)

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.EZCR_TENANT_ID) {
    console.error('\n❌ Missing required environment variables!')
    console.error('   Ensure .env.local is configured correctly.')
    process.exit(1)
  }

  console.log(`\nSeeds to run (${seedScripts.length}):`)
  seedScripts.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name}`)
  })

  const results: { script: SeedScript; success: boolean }[] = []

  for (const script of seedScripts) {
    const success = await runSeed(script)
    results.push({ script, success })
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 SEED SUMMARY')
  console.log('='.repeat(60))

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`\n✅ Successful: ${successful.length}/${results.length}`)
  successful.forEach(r => console.log(`   • ${r.script.name}`))

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`)
    failed.forEach(r => console.log(`   • ${r.script.name}`))
  }

  console.log('\n' + '='.repeat(60))
  if (failed.length === 0) {
    console.log('✨ All seeds completed successfully!')
  } else {
    console.log('⚠️  Some seeds failed. Check the logs above for details.')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
