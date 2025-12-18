/**
 * Seed Sample Orders
 * Run: npx tsx scripts/seed-orders.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const tenantId = process.env.EZCR_TENANT_ID!

if (!supabaseUrl || !supabaseKey || !tenantId) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Product SKUs that we'll look up dynamically
const PRODUCT_SKUS = {
  AUN250: 'AUN250',
  AUN210: 'AUN210',
  AUN200: 'AUN200',
  STRAPS: 'STRAPS-001',
  CHOCK: 'CHOCK-001',
}

// Products map will be populated at runtime
let PRODUCTS: Record<string, string> = {}

// Helper to generate order number
const generateOrderNumber = (index: number) => {
  const date = new Date()
  return `EZCR-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(1000 + index).padStart(5, '0')}`
}

// Helper to get date X days ago
const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

// Sample customers
const customers = [
  {
    email: 'mike.reynolds@example.com',
    name: 'Mike Reynolds',
    phone: '(404) 555-0101',
    address: {
      street: '1234 Harley Lane',
      city: 'Atlanta',
      state: 'GA',
      zip: '30301',
      country: 'US',
    },
  },
  {
    email: 'sarah.thompson@example.com',
    name: 'Sarah Thompson',
    phone: '(214) 555-0202',
    address: {
      street: '5678 Motorcycle Way',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
      country: 'US',
    },
  },
  {
    email: 'james.kimball@example.com',
    name: 'James Kimball',
    phone: '(303) 555-0303',
    address: {
      street: '910 Rider Ave',
      city: 'Denver',
      state: 'CO',
      zip: '80201',
      country: 'US',
    },
  },
  {
    email: 'david.martinez@example.com',
    name: 'David Martinez',
    phone: '(602) 555-0404',
    address: {
      street: '2468 Cruiser Blvd',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85001',
      country: 'US',
    },
  },
  {
    email: 'jennifer.parker@example.com',
    name: 'Jennifer Parker',
    phone: '(206) 555-0505',
    address: {
      street: '1357 Touring Drive',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      country: 'US',
    },
  },
  {
    email: 'robert.hughes@example.com',
    name: 'Robert Hughes',
    phone: '(305) 555-0606',
    address: {
      street: '8642 Biker Street',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
      country: 'US',
    },
  },
  {
    email: 'tom.wilson@example.com',
    name: 'Tom Wilson',
    phone: '(312) 555-0707',
    address: {
      street: '9753 Chrome Court',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'US',
    },
  },
  {
    email: 'chris.larson@example.com',
    name: 'Chris Larson',
    phone: '(503) 555-0808',
    address: {
      street: '3141 Leather Lane',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      country: 'US',
    },
  },
]

// Sample orders - use productKey to reference PRODUCTS map at runtime
const sampleOrders = [
  // Completed orders (delivered)
  {
    customer: customers[0],
    status: 'delivered',
    payment_status: 'paid',
    items: [
      { productKey: 'AUN250', name: 'AUN250 Folding Ramp', sku: 'AUN250', quantity: 1, price: 2000.00 },
      { productKey: 'STRAPS', name: 'Heavy Duty Tie-Down Straps (Set of 4)', sku: 'STRAPS-001', quantity: 1, price: 45.00 },
    ],
    shipping_method: 'LTL Freight',
    shipping_amount: 199.00,
    tracking_number: 'PRO123456789',
    daysAgo: 30,
  },
  {
    customer: customers[1],
    status: 'delivered',
    payment_status: 'paid',
    items: [
      { productKey: 'AUN210', name: 'AUN210 Standard Ramp', sku: 'AUN210', quantity: 1, price: 1800.00 },
    ],
    shipping_method: 'LTL Freight',
    shipping_amount: 175.00,
    tracking_number: 'PRO234567890',
    daysAgo: 25,
  },
  {
    customer: customers[2],
    status: 'delivered',
    payment_status: 'paid',
    items: [
      { productKey: 'AUN200', name: 'AUN200 Basic Ramp', sku: 'AUN200', quantity: 1, price: 1500.00 },
      { productKey: 'CHOCK', name: 'Adjustable Wheel Chock', sku: 'CHOCK-001', quantity: 1, price: 100.00 },
      { productKey: 'STRAPS', name: 'Heavy Duty Tie-Down Straps (Set of 4)', sku: 'STRAPS-001', quantity: 2, price: 45.00 },
    ],
    shipping_method: 'LTL Freight',
    shipping_amount: 185.00,
    tracking_number: 'PRO345678901',
    daysAgo: 20,
  },

  // Shipped orders (in transit)
  {
    customer: customers[3],
    status: 'shipped',
    payment_status: 'paid',
    items: [
      { productKey: 'AUN250', name: 'AUN250 Folding Ramp', sku: 'AUN250', quantity: 1, price: 2000.00 },
      { productKey: 'CHOCK', name: 'Adjustable Wheel Chock', sku: 'CHOCK-001', quantity: 1, price: 100.00 },
    ],
    shipping_method: 'LTL Freight',
    shipping_amount: 210.00,
    tracking_number: 'PRO456789012',
    daysAgo: 5,
  },
  {
    customer: customers[4],
    status: 'shipped',
    payment_status: 'paid',
    items: [
      { productKey: 'AUN210', name: 'AUN210 Standard Ramp', sku: 'AUN210', quantity: 1, price: 1800.00 },
      { productKey: 'STRAPS', name: 'Heavy Duty Tie-Down Straps (Set of 4)', sku: 'STRAPS-001', quantity: 1, price: 45.00 },
    ],
    shipping_method: 'LTL Freight',
    shipping_amount: 175.00,
    tracking_number: 'PRO567890123',
    daysAgo: 3,
  },

  // Processing orders (payment confirmed, preparing)
  {
    customer: customers[5],
    status: 'processing',
    payment_status: 'paid',
    items: [
      { productKey: 'AUN250', name: 'AUN250 Folding Ramp', sku: 'AUN250', quantity: 1, price: 2000.00 },
    ],
    shipping_method: 'LTL Freight',
    shipping_amount: 199.00,
    daysAgo: 1,
  },
  {
    customer: customers[6],
    status: 'processing',
    payment_status: 'paid',
    items: [
      { productKey: 'AUN200', name: 'AUN200 Basic Ramp', sku: 'AUN200', quantity: 1, price: 1500.00 },
      { productKey: 'STRAPS', name: 'Heavy Duty Tie-Down Straps (Set of 4)', sku: 'STRAPS-001', quantity: 2, price: 45.00 },
    ],
    shipping_method: 'Ground Shipping',
    shipping_amount: 150.00,
    daysAgo: 0,
  },

  // Pending order (awaiting payment)
  {
    customer: customers[7],
    status: 'pending',
    payment_status: 'pending',
    items: [
      { productKey: 'AUN210', name: 'AUN210 Standard Ramp', sku: 'AUN210', quantity: 1, price: 1800.00 },
      { productKey: 'CHOCK', name: 'Adjustable Wheel Chock', sku: 'CHOCK-001', quantity: 1, price: 100.00 },
    ],
    shipping_method: 'LTL Freight',
    shipping_amount: 175.00,
    daysAgo: 0,
  },

  // Accessories-only orders
  {
    customer: customers[0],
    status: 'delivered',
    payment_status: 'paid',
    items: [
      { productKey: 'STRAPS', name: 'Heavy Duty Tie-Down Straps (Set of 4)', sku: 'STRAPS-001', quantity: 3, price: 45.00 },
      { productKey: 'CHOCK', name: 'Adjustable Wheel Chock', sku: 'CHOCK-001', quantity: 2, price: 100.00 },
    ],
    shipping_method: 'Ground Shipping',
    shipping_amount: 25.00,
    tracking_number: 'UPS1Z999AA10123456784',
    daysAgo: 15,
  },
  {
    customer: customers[3],
    status: 'delivered',
    payment_status: 'paid',
    items: [
      { productKey: 'STRAPS', name: 'Heavy Duty Tie-Down Straps (Set of 4)', sku: 'STRAPS-001', quantity: 2, price: 45.00 },
    ],
    shipping_method: 'Ground Shipping',
    shipping_amount: 15.00,
    tracking_number: 'UPS1Z999AA10123456785',
    daysAgo: 45,
  },
]

async function seedOrders() {
  console.log('🌱 Seeding sample orders...\n')

  // First, look up products by SKU (try with tenant_id first, then without)
  let { data: products, error: productError } = await supabase
    .from('products')
    .select('id, sku, name, tenant_id')
    .eq('tenant_id', tenantId)

  // If no products found with tenant_id, try to find products from any tenant
  if (!products?.length) {
    console.log(`No products found for tenant ${tenantId}, searching all products...`)
    const result = await supabase
      .from('products')
      .select('id, sku, name, tenant_id')
      .in('sku', Object.values(PRODUCT_SKUS))

    products = result.data
    productError = result.error
  }

  if (productError || !products?.length) {
    console.error('❌ Error: No products found. Run product seed first.')
    console.error('   Ensure products are seeded via SQL migration.')
    return
  }

  console.log(`Found ${products.length} products in database.`)

  // Build products map by SKU
  for (const product of products) {
    const skuKey = Object.keys(PRODUCT_SKUS).find(
      k => PRODUCT_SKUS[k as keyof typeof PRODUCT_SKUS] === product.sku
    )
    if (skuKey) {
      PRODUCTS[skuKey] = product.id
      console.log(`  • ${product.sku} -> ${product.id}`)
    }
  }

  // Verify we have all required products
  const missingProducts = Object.keys(PRODUCT_SKUS).filter(k => !PRODUCTS[k])
  if (missingProducts.length > 0) {
    console.warn(`\n⚠️  Missing products: ${missingProducts.join(', ')}`)
    console.warn('   Orders using these products will be skipped.')
  }

  console.log('')

  // Check if orders already exist (orders table may or may not have tenant_id column)
  const { data: existingOrders, error: checkError } = await supabase
    .from('orders')
    .select('id')
    .limit(1)

  if (checkError) {
    console.error('❌ Error checking existing orders:', checkError.message)
    return
  }

  if (existingOrders && existingOrders.length > 0) {
    console.log('⚠️  Orders already exist. Skipping seed.')
    console.log('   To re-seed, delete existing orders first.')
    return
  }

  let orderIndex = 0
  for (const order of sampleOrders) {
    orderIndex++
    const orderNumber = generateOrderNumber(orderIndex)

    // Calculate totals
    let subtotal = 0
    for (const item of order.items) {
      subtotal += item.price * item.quantity
    }
    const taxAmount = Math.round(subtotal * 0.07 * 100) / 100 // 7% tax
    const totalAmount = subtotal + taxAmount + order.shipping_amount

    // Create order (orders table doesn't have tenant_id in this schema)
    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: order.customer.email,
        customer_name: order.customer.name,
        customer_phone: order.customer.phone,
        status: order.status,
        payment_status: order.payment_status,
        stripe_payment_intent_id: order.payment_status === 'paid' ? `pi_sample_${orderIndex}` : null,
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: order.shipping_amount,
        discount_amount: 0,
        total_amount: totalAmount,
        shipping_address: order.customer.address,
        billing_address: order.customer.address,
        shipping_method: order.shipping_method,
        tracking_number: order.tracking_number || null,
        notes: order.status === 'delivered' ? 'Customer confirmed receipt.' : null,
        metadata: {
          source: 'seed_script',
          seeded_at: new Date().toISOString(),
        },
        created_at: daysAgo(order.daysAgo),
        updated_at: daysAgo(Math.max(0, order.daysAgo - 1)),
      })
      .select()
      .single()

    if (orderError) {
      console.error(`❌ Failed to create order ${orderNumber}:`, orderError.message)
      continue
    }

    // Create order items (order_items table doesn't have tenant_id in this schema)
    for (const item of order.items) {
      const productId = PRODUCTS[item.productKey]
      if (!productId) {
        console.warn(`  ⚠️  Skipping item ${item.sku} - product not found`)
        continue
      }

      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: createdOrder.id,
          product_id: productId,
          product_name: item.name,
          product_sku: item.sku,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          configuration: {},
        })

      if (itemError) {
        console.error(`  ❌ Failed to create order item:`, itemError.message)
      }
    }

    const itemsList = order.items.map(i => `${i.quantity}x ${i.sku}`).join(', ')
    console.log(`✅ Created: ${orderNumber} (${order.status}) - $${totalAmount.toFixed(2)} - ${itemsList}`)
  }

  console.log('\n✨ Done! Created', sampleOrders.length, 'sample orders.')
}

seedOrders().catch(console.error)
