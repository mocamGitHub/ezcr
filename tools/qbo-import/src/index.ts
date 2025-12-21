/**
 * QBO Invoice Import Tool
 *
 * Imports QuickBooks Online invoices from web_transactions into the app's orders table.
 *
 * Usage:
 *   npm run import           # Run the import
 *   npm run import:dry-run   # Preview without making changes
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string
 */

import { config } from 'dotenv'
import pg from 'pg'
import {
  transformInvoiceToOrder,
  transformLinesToOrderItems,
  type QboInvoice,
  type QboInvoiceLine,
} from './transform.js'

// Placeholder product/variant IDs for QBO imports (created in migration 00028)
const QBO_PLACEHOLDER_PRODUCT_ID = '00000000-0000-0000-0000-000000000001'
const QBO_PLACEHOLDER_VARIANT_ID = '00000000-0000-0000-0000-000000000002'

// Load environment variables
config({ path: '.env.local' })

const { Pool } = pg

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run')

async function main() {
  console.log('='.repeat(60))
  console.log('QBO Invoice Import Tool')
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

    // Fetch all QBO invoices
    console.log('Fetching QBO invoices...')
    const invoicesResult = await pool.query<QboInvoice>(`
      SELECT
        qbo_entity_id,
        doc_number,
        txn_date,
        customer_name,
        customer_ref,
        total_amount,
        currency,
        status,
        payload
      FROM web_transactions
      WHERE qbo_entity_type = 'Invoice'
      ORDER BY txn_date ASC
    `)

    const invoices = invoicesResult.rows
    console.log(`Found ${invoices.length} invoices to process`)
    console.log('')

    // Check for existing imported orders
    console.log('Checking for existing imported orders...')
    const existingResult = await pool.query<{ qbo_invoice_id: string }>(`
      SELECT qbo_invoice_id
      FROM orders
      WHERE qbo_invoice_id IS NOT NULL
    `)

    const existingQboIds = new Set(existingResult.rows.map(r => r.qbo_invoice_id))
    console.log(`Found ${existingQboIds.size} existing imported orders`)
    console.log('')

    // Fetch all line items at once for efficiency
    console.log('Fetching invoice line items...')
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

    // Group lines by invoice
    const linesByInvoice = new Map<string, QboInvoiceLine[]>()
    for (const line of linesResult.rows) {
      const existing = linesByInvoice.get(line.qbo_entity_id) || []
      existing.push(line)
      linesByInvoice.set(line.qbo_entity_id, existing)
    }
    console.log(`Loaded ${linesResult.rows.length} line items`)
    console.log('')

    // Process invoices
    let imported = 0
    let skipped = 0
    let errors = 0

    for (const invoice of invoices) {
      // Skip if already imported
      if (existingQboIds.has(invoice.qbo_entity_id)) {
        skipped++
        continue
      }

      try {
        // Get lines for this invoice
        const lines = linesByInvoice.get(invoice.qbo_entity_id) || []

        // Transform invoice to order
        const order = transformInvoiceToOrder(invoice, lines)

        if (isDryRun) {
          console.log(`[DRY RUN] Would import: ${order.order_number} - ${order.customer_name || 'Unknown'} - $${order.grand_total.toFixed(2)} - ${order.product_sku}`)
          imported++
          continue
        }

        // Insert order and get back the ID and tenant_id
        const orderResult = await pool.query<{ id: string; tenant_id: string }>(`
          INSERT INTO orders (
            order_number,
            customer_email,
            customer_name,
            customer_phone,
            status,
            payment_status,
            product_sku,
            product_name,
            product_price,
            quantity,
            subtotal,
            shipping_total,
            tax_total,
            discount_total,
            grand_total,
            shipping_address,
            billing_address,
            delivery_method,
            qbo_invoice_id,
            qbo_sync_status,
            qbo_synced_at,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
          )
          RETURNING id, tenant_id
        `, [
          order.order_number,
          order.customer_email,
          order.customer_name,
          order.customer_phone,
          order.status,
          order.payment_status,
          order.product_sku,
          order.product_name,
          order.product_price,
          order.quantity,
          order.subtotal,
          order.shipping_total,
          order.tax_total,
          order.discount_total,
          order.grand_total,
          JSON.stringify(order.shipping_address),
          JSON.stringify(order.billing_address),
          order.delivery_method,
          order.qbo_invoice_id,
          order.qbo_sync_status,
          order.qbo_synced_at,
          order.created_at,
          order.updated_at,
        ])

        const { id: orderId, tenant_id: tenantId } = orderResult.rows[0]

        // Transform line items and insert order_items
        const orderItems = transformLinesToOrderItems(lines)
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
            tenantId,
            orderId,
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

        const itemsCount = orderItems.length
        console.log(`Imported: ${order.order_number} - ${order.customer_name || 'Unknown'} - $${order.grand_total.toFixed(2)} - ${itemsCount} item${itemsCount !== 1 ? 's' : ''}`)
        imported++
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`Error importing ${invoice.doc_number || invoice.qbo_entity_id}: ${errorMessage}`)
        errors++
      }
    }

    // Summary
    console.log('')
    console.log('='.repeat(60))
    console.log('Import Summary')
    console.log('='.repeat(60))
    console.log(`Total invoices:  ${invoices.length}`)
    console.log(`Imported:        ${imported}`)
    console.log(`Skipped (dups):  ${skipped}`)
    console.log(`Errors:          ${errors}`)
    console.log('')

    if (isDryRun) {
      console.log('*** DRY RUN - No changes were made ***')
    } else {
      console.log('Import complete!')
    }
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
