/**
 * Create placeholder product and variant for QBO imports
 */
import { config } from 'dotenv'
import pg from 'pg'

config({ path: '.env.local' })

const { Pool } = pg

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is required')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    // Check if placeholder exists (using new ID that doesn't conflict with tenant)
    const placeholderProductId = '00000000-0000-0000-0001-000000000001'
    const placeholderVariantId = '00000000-0000-0000-0001-000000000002'

    const check = await pool.query(
      "SELECT id, name FROM products WHERE id = $1::uuid",
      [placeholderProductId]
    )
    console.log('Existing placeholder product:', check.rows)

    if (check.rows.length === 0) {
      console.log('Creating placeholder product...')

      // Get tenant ID
      const tenant = await pool.query("SELECT id, slug FROM tenants LIMIT 5")
      console.log('Available tenants:', tenant.rows)
      if (tenant.rows.length === 0) {
        console.log('No tenants found in database')
        return
      }
      const tenantId = tenant.rows[0].id
      console.log('Tenant ID:', tenantId)

      // First, check the products table columns
      const colsResult = await pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'products'
        ORDER BY ordinal_position
      `)
      console.log('Products columns:', colsResult.rows.map(r => r.column_name).join(', '))

      // Create placeholder product with minimal required columns
      await pool.query(`
        INSERT INTO products (id, tenant_id, name, slug, sku, base_price, is_active)
        VALUES ($1::uuid, $2, 'QBO Imported Item', 'qbo-imported-item', 'QBO-IMPORT', 0, false)
        ON CONFLICT (id) DO NOTHING
      `, [placeholderProductId, tenantId])
      console.log('Placeholder product created with ID:', placeholderProductId)

      // Check product_variants columns
      const varColsResult = await pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'product_variants'
        ORDER BY ordinal_position
      `)
      console.log('Product_variants columns:', varColsResult.rows.map(r => r.column_name).join(', '))

      // Create placeholder variant with minimal required columns
      await pool.query(`
        INSERT INTO product_variants (id, tenant_id, product_id, name, sku, price_modifier)
        VALUES ($1::uuid, $2, $3::uuid, 'Default', 'QBO-IMPORT-DEFAULT', 0)
        ON CONFLICT (id) DO NOTHING
      `, [placeholderVariantId, tenantId, placeholderProductId])
      console.log('Placeholder variant created with ID:', placeholderVariantId)
    } else {
      console.log('Placeholder product already exists')
    }

    // Also check/create the variant
    const variantCheck = await pool.query(
      "SELECT id, name FROM product_variants WHERE id = $1::uuid",
      [placeholderVariantId]
    )
    console.log('Existing placeholder variant:', variantCheck.rows)

    if (variantCheck.rows.length === 0) {
      // Get tenant ID
      const tenant = await pool.query("SELECT id, slug FROM tenants LIMIT 1")
      if (tenant.rows.length === 0) {
        console.log('No tenants found in database')
        return
      }
      const tenantId = tenant.rows[0].id

      console.log('Creating placeholder variant...')
      await pool.query(`
        INSERT INTO product_variants (id, tenant_id, product_id, name, sku, price_modifier)
        VALUES ($1::uuid, $2, $3::uuid, 'Default', 'QBO-IMPORT-DEFAULT', 0)
        ON CONFLICT (id) DO NOTHING
      `, [placeholderVariantId, tenantId, placeholderProductId])
      console.log('Placeholder variant created with ID:', placeholderVariantId)
    } else {
      console.log('Placeholder variant already exists')
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await pool.end()
  }
}

main()
