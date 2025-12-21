/**
 * Transform QBO invoice data to app orders format
 *
 * Note: Also creates order_items for all line items
 */

export interface QboInvoice {
  qbo_entity_id: string
  doc_number: string | null
  txn_date: string | null
  customer_name: string | null
  customer_ref: string | null
  total_amount: number | null
  currency: string | null
  status: string | null
  payload: Record<string, unknown> | null
}

export interface QboInvoiceLine {
  qbo_entity_id: string
  line_num: number
  item_ref: string | null
  item_name: string | null
  description: string | null
  quantity: number | null
  unit_price: number | null
  line_amount: number | null
}

export interface AppOrder {
  order_number: string
  customer_email: string
  customer_name: string | null
  customer_phone: string | null
  status: string
  payment_status: string
  // Product info (primary product stored directly on order for quick display)
  product_sku: string
  product_name: string
  product_price: number
  quantity: number
  // Totals
  subtotal: number
  shipping_total: number
  tax_total: number
  discount_total: number
  grand_total: number
  // Addresses
  shipping_address: Record<string, unknown>
  billing_address: Record<string, unknown>
  delivery_method: string
  // QBO link
  qbo_invoice_id: string
  qbo_sync_status: string
  qbo_synced_at: Date
  created_at: Date
  updated_at: Date
}

export interface AppOrderItem {
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  total_price: number
}

/**
 * Extract email from QBO invoice payload
 */
function extractEmail(payload: Record<string, unknown> | null, customerName: string | null): string {
  if (!payload) {
    return customerName
      ? `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@imported.local`
      : 'unknown@imported.local'
  }

  // Try BillEmail.Address
  const billEmail = payload.BillEmail as { Address?: string } | undefined
  if (billEmail?.Address) {
    return billEmail.Address
  }

  // Try PrimaryEmailAddr
  const primaryEmail = payload.PrimaryEmailAddr as { Address?: string } | undefined
  if (primaryEmail?.Address) {
    return primaryEmail.Address
  }

  // Fallback to generated email
  return customerName
    ? `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@imported.local`
    : 'unknown@imported.local'
}

/**
 * Extract phone from QBO invoice payload
 */
function extractPhone(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null

  // Try PrimaryPhone
  const primaryPhone = payload.PrimaryPhone as { FreeFormNumber?: string } | undefined
  if (primaryPhone?.FreeFormNumber) {
    return primaryPhone.FreeFormNumber
  }

  // Try BillAddr phone
  const billAddr = payload.BillAddr as Record<string, unknown> | undefined
  if (billAddr?.FreeFormNumber) {
    return billAddr.FreeFormNumber as string
  }

  return null
}

/**
 * Extract and transform address from QBO payload
 */
function extractAddress(addrPayload: unknown): Record<string, unknown> {
  if (!addrPayload || typeof addrPayload !== 'object') {
    return {
      line1: '',
      line2: null,
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    }
  }

  const addr = addrPayload as Record<string, unknown>

  return {
    line1: addr.Line1 || '',
    line2: addr.Line2 || null,
    city: addr.City || '',
    state: addr.CountrySubDivisionCode || '',
    postalCode: addr.PostalCode || '',
    country: addr.Country || 'US',
  }
}

/**
 * Map QBO invoice status to app order status
 */
function mapStatus(payload: Record<string, unknown> | null): { status: string; paymentStatus: string } {
  if (!payload) {
    return { status: 'pending', paymentStatus: 'pending' }
  }

  const eInvoiceStatus = payload.EInvoiceStatus as string | undefined
  const balance = payload.Balance as number | undefined

  // Check if paid
  if (eInvoiceStatus === 'Paid' || (balance !== undefined && balance === 0)) {
    return { status: 'delivered', paymentStatus: 'succeeded' }
  }

  // Default to pending
  return { status: 'pending', paymentStatus: 'pending' }
}

/**
 * Extract primary product info from line items
 * Returns the line item with the highest amount (likely the main product)
 */
function extractPrimaryProduct(lines: QboInvoiceLine[]): { sku: string; name: string; price: number; quantity: number } {
  // Filter to actual product lines (not shipping, etc.)
  const productLines = lines.filter(line =>
    line.line_amount &&
    line.line_amount > 0 &&
    line.item_name &&
    !line.item_name.toLowerCase().includes('shipping')
  )

  if (productLines.length === 0) {
    // Fallback if no product lines
    return {
      sku: 'QBO-IMPORT',
      name: 'QBO Imported Item',
      price: 0,
      quantity: 1,
    }
  }

  // Find the highest value line item (likely the main product)
  const primaryLine = productLines.reduce((max, line) =>
    (line.line_amount || 0) > (max.line_amount || 0) ? line : max
  )

  // Extract SKU from item_name (format: "Inventory:AUN200 - Standard Ramp")
  let sku = 'QBO-IMPORT'
  const itemName = primaryLine.item_name || ''

  // Try to extract SKU from common patterns
  const skuMatch = itemName.match(/([A-Z]{2,3}\d{3})/i)
  if (skuMatch) {
    sku = skuMatch[1].toUpperCase()
  } else if (primaryLine.item_ref) {
    sku = `QBO-${primaryLine.item_ref}`
  }

  // Clean up product name (remove "Inventory:" prefix, etc.)
  let name = itemName
    .replace(/^(Inventory|Non-Inventory|Services|Labor):/, '')
    .trim()

  if (!name) {
    name = 'QBO Imported Item'
  }

  return {
    sku,
    name,
    price: Number(primaryLine.unit_price) || Number(primaryLine.line_amount) || 0,
    quantity: Math.floor(Number(primaryLine.quantity) || 1),
  }
}

/**
 * Transform QBO line items to app order items
 * Filters out non-product lines (shipping, discounts, etc.)
 */
export function transformLinesToOrderItems(lines: QboInvoiceLine[]): AppOrderItem[] {
  // Filter to actual product lines
  const productLines = lines.filter(line =>
    line.line_amount &&
    line.line_amount > 0 &&
    line.item_name &&
    !line.item_name.toLowerCase().includes('shipping') &&
    !line.item_name.toLowerCase().includes('discount')
  )

  return productLines.map(line => {
    const itemName = line.item_name || ''

    // Extract SKU from item_name (format: "Inventory:AUN200 - Standard Ramp")
    let sku = 'QBO-IMPORT'
    const skuMatch = itemName.match(/([A-Z]{2,3}\d{3})/i)
    if (skuMatch) {
      sku = skuMatch[1].toUpperCase()
    } else if (line.item_ref) {
      sku = `QBO-${line.item_ref}`
    }

    // Clean up product name
    const name = itemName
      .replace(/^(Inventory|Non-Inventory|Services|Labor):/, '')
      .trim() || 'QBO Imported Item'

    const quantity = Math.floor(Number(line.quantity) || 1)
    const unitPrice = Number(line.unit_price) || Number(line.line_amount) || 0
    const totalPrice = Number(line.line_amount) || (unitPrice * quantity)

    return {
      product_name: name,
      product_sku: sku,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
    }
  })
}

/**
 * Transform QBO invoice to app order
 */
export function transformInvoiceToOrder(invoice: QboInvoice, lines: QboInvoiceLine[]): AppOrder {
  const { status, paymentStatus } = mapStatus(invoice.payload)
  const product = extractPrimaryProduct(lines)

  // Convert to number (PostgreSQL NUMERIC comes as string)
  const totalAmount = Number(invoice.total_amount) || 0
  const txnDate = invoice.txn_date ? new Date(invoice.txn_date) : new Date()

  // Extract addresses from payload
  const shippingAddress = extractAddress(invoice.payload?.ShipAddr)
  const billingAddress = extractAddress(invoice.payload?.BillAddr)

  // If no shipping address, use billing address
  const finalShippingAddress = shippingAddress.line1
    ? shippingAddress
    : billingAddress

  // Calculate subtotal from product
  const subtotal = product.price * product.quantity

  return {
    order_number: invoice.doc_number || `QBO-${invoice.qbo_entity_id}`,
    customer_email: extractEmail(invoice.payload, invoice.customer_name),
    customer_name: invoice.customer_name,
    customer_phone: extractPhone(invoice.payload),
    status,
    payment_status: paymentStatus,
    // Product info
    product_sku: product.sku,
    product_name: product.name,
    product_price: product.price,
    quantity: product.quantity,
    // Totals
    subtotal: subtotal,
    shipping_total: Math.max(0, totalAmount - subtotal), // Approximate shipping
    tax_total: 0,
    discount_total: 0,
    grand_total: totalAmount,
    // Addresses
    shipping_address: finalShippingAddress,
    billing_address: billingAddress,
    delivery_method: 'shipping', // Default for historical imports
    // QBO link
    qbo_invoice_id: invoice.qbo_entity_id,
    qbo_sync_status: 'imported',
    qbo_synced_at: new Date(),
    created_at: txnDate,
    updated_at: new Date(),
  }
}
