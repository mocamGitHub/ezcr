import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const result = await pool.query(`
    SELECT DISTINCT customer_email, customer_name
    FROM orders
    WHERE qbo_sync_status = 'imported'
      AND customer_email IS NOT NULL
    LIMIT 5
  `)
  console.log('Sample customers:')
  for (const row of result.rows) {
    console.log(`  ${row.customer_name}: ${row.customer_email}`)
  }
  await pool.end()
}

main().catch(console.error)
