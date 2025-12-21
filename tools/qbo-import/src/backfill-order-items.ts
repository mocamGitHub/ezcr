/**
 * Backfill Order Items
 *
 * Adds order_items to existing QBO-imported orders that were imported
 * before order_items support was added.
 *
 * Usage:
 *   npx tsx src/backfill-order-items.ts           # Run the backfill
 *   npx tsx src/backfill-order-items.ts --dry-run # Preview without changes
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string
 */

import { config } from 'dotenv'
import pg from 'pg'
import {
  transformLinesToOrderItems,
  type QboInvoiceLine,
} from './transform.js'

// Placeholder product/variant IDs for QBO imports (created by create-placeholder.ts)
const QBO_PLACEHOLDER_PRODUCT_ID = '00000000-0000-0000-0001-000000000001'
const QBO_PLACEHOLDER_VARIANT_ID = '00000000-0000-0000-0001-000000000002'

// Load environment variables
config({ path: '.env.local' })

const { Pool } = pg

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run')

// EZCR Tenant ID (from .env.local)
const TENANT_ID = process.env.EZCR_TENANT_ID || '174bed32-89ff-4920-94d7-4527a3aba352'

async function main() {
  console.log('='.repeat(60))
  console.log('Backfill Order Items for QBO Imports')
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

    // Find QBO-imported orders that have no order_items
    console.log('Finding QBO orders without order_items...')
    const ordersResult = await pool.query<{ id: string; order_number: string; qbo_invoice_id: string }>(`
      SELECT o.id, o.order_number, o.qbo_invoice_id
      FROM orders o
      WHERE o.qbo_sync_status = 'imported'
        AND o.qbo_invoice_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
        )
      ORDER BY o.created_at ASC
    `)

    const orders = ordersResult.rows
    console.log(`Found ${orders.length} orders to backfill`)
    console.log('')

    if (orders.length === 0) {
      console.log('No orders need backfilling!')
      return
    }

    // Fetch all line items at once for efficiency
    console.log('Fetching QBO invoice line items...')
    const linesResult = await pool.query<QboInvoiceLine>(`
      SELECT
        qbo_entity_id,
        line_num,
        item_ref,
        item_name,
        description,
        quantity,
        unit_price,
        line_amount
      FROM web_transaction_lines
      WHERE qbo_entity_type = 'Invoice'
      ORDER BY qbo_entity_id, line_num ASC
    `)

    // Group lines by QBO entity ID
    const linesByQboId = new Map<string, QboInvoiceLine[]>()
    for (const line of linesResult.rows) {
      const existing = linesByQboId.get(line.qbo_entity_id) || []
      existing.push(line)
      linesByQboId.set(line.qbo_entity_id, existing)
    }
    console.log(`Loaded ${linesResult.rows.length} line items`)
    console.log('')

    // Process orders
    let backfilled = 0
    let skipped = 0
    let errors = 0
    let totalItems = 0

    for (const order of orders) {
      try {
        // Get lines for this order's QBO invoice
        const lines = linesByQboId.get(order.qbo_invoice_id) || []

        if (lines.length === 0) {
          console.log(`Skipped: ${order.order_number} - No line items found`)
          skipped++
          continue
        }

        // Transform line items
        const orderItems = transformLinesToOrderItems(lines)

        if (orderItems.length === 0) {
          console.log(`Skipped: ${order.order_number} - No product lines (shipping only?)`)
          skipped++
          continue
        }

        if (isDryRun) {
          console.log(`[DRY RUN] Would backfill: ${order.order_number} - ${orderItems.length} item(s)`)
          backfilled++
          totalItems += orderItems.length
          continue
        }

        // Insert order_items
        for (const item of orderItems) {
          await pool.query(`
            INSERT INTO order_items (
              tenant_id,
              order_id,
              product_id,
              variant_id,
              product_name,
              product_sku,
              quantity,
              unit_price,
              total_price,
              configuration
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            TENANT_ID,
            order.id,
            QBO_PLACEHOLDER_PRODUCT_ID,
            QBO_PLACEHOLDER_VARIANT_ID,
            item.product_name,
            item.product_sku,
            item.quantity,
            item.unit_price,
            item.total_price,
            JSON.stringify({}),
          ])
        }

        console.log(`Backfilled: ${order.order_number} - ${orderItems.length} item(s)`)
        backfilled++
        totalItems += orderItems.length
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`Error backfilling ${order.order_number}: ${errorMessage}`)
        errors++
      }
    }

    // Summary
    console.log('')
    console.log('='.repeat(60))
    console.log('Backfill Summary')
    console.log('='.repeat(60))
    console.log(`Orders found:    ${orders.length}`)
    console.log(`Backfilled:      ${backfilled}`)
    console.log(`Skipped:         ${skipped}`)
    console.log(`Errors:          ${errors}`)
    console.log(`Total items:     ${totalItems}`)
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
