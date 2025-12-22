/**
 * Backfill Activities for Orders
 *
 * Adds "order_placed" activities for existing orders that don't have
 * corresponding CRM activity records.
 *
 * Usage:
 *   npx tsx src/backfill-activities.ts           # Run the backfill
 *   npx tsx src/backfill-activities.ts --dry-run # Preview without changes
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string
 */

import { config } from 'dotenv'
import pg from 'pg'
import { randomUUID } from 'crypto'

// Load environment variables
config({ path: '.env.local' })

const { Pool } = pg

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run')

// EZCR Tenant ID (from .env.local)
const TENANT_ID = process.env.EZCR_TENANT_ID || '174bed32-89ff-4920-94d7-4527a3aba352'

interface Order {
  id: string
  order_number: string
  customer_email: string
  customer_name: string | null
  grand_total: number | null
  created_at: string
}

async function main() {
  console.log('='.repeat(60))
  console.log('Backfill Activities for Orders')
  console.log('='.repeat(60))

  if (isDryRun) {
    console.log('\n*** DRY RUN MODE - No changes will be made ***\n')
  }

  // Validate environment
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is required')
    process.exit(1)
  }

  console.log(`Database: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}`)
  console.log('')

  // Connect to database
  const pool = new Pool({ connectionString: databaseUrl })

  try {
    // Test connection
    const testResult = await pool.query('SELECT NOW() as now')
    console.log(`Connected at: ${testResult.rows[0].now}`)
    console.log('')

    // Find orders without corresponding "order_placed" activities
    console.log('Finding orders without "order_placed" activities...')
    const ordersResult = await pool.query<Order>(`
      SELECT o.id, o.order_number, o.customer_email, o.customer_name,
             o.grand_total, o.created_at
      FROM orders o
      WHERE o.customer_email IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM crm_activities a
          WHERE a.customer_email = o.customer_email
            AND a.tenant_id = $1
            AND a.activity_type = 'order_placed'
            AND a.related_entity_id::uuid = o.id
        )
      ORDER BY o.created_at ASC
    `, [TENANT_ID])

    const orders = ordersResult.rows
    console.log(`Found ${orders.length} orders without activities`)
    console.log('')

    if (orders.length === 0) {
      console.log('No orders need activity backfilling!')
      return
    }

    // Process orders
    let created = 0
    let errors = 0

    for (const order of orders) {
      try {
        const amount = order.grand_total ?? 0
        const activityData = {
          order_id: order.id,
          order_number: order.order_number,
          amount: amount,
        }

        if (isDryRun) {
          console.log(`[DRY RUN] Would create: order_placed for ${order.customer_email} - ${order.order_number}`)
          created++
          continue
        }

        // Insert activity
        await pool.query(`
          INSERT INTO crm_activities (
            id,
            tenant_id,
            customer_email,
            activity_type,
            activity_data,
            related_entity_type,
            related_entity_id,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          randomUUID(),
          TENANT_ID,
          order.customer_email,
          'order_placed',
          JSON.stringify(activityData),
          'order',
          order.id,
          order.created_at, // Use order's created_at so activity appears at the right time
        ])

        console.log(`Created: order_placed for ${order.customer_email} - ${order.order_number}`)
        created++
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`Error creating activity for ${order.order_number}: ${errorMessage}`)
        errors++
      }
    }

    // Summary
    console.log('')
    console.log('='.repeat(60))
    console.log('Backfill Summary')
    console.log('='.repeat(60))
    console.log(`Orders found:    ${orders.length}`)
    console.log(`Activities created: ${created}`)
    console.log(`Errors:          ${errors}`)
    console.log('')

    if (isDryRun) {
      console.log('*** DRY RUN - No changes were made ***')
    } else {
      console.log('Backfill complete!')
    }
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
