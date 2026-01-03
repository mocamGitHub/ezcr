'use server'

import { createClient } from '@supabase/supabase-js'
import type {
  QboInvoice,
  QboInvoiceWithLines,
  QboInvoiceFilters,
  QboInvoiceStats,
} from '@/types/qbo'

// Server-side client with service role key to bypass RLS
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
}

function getTenantId(): string {
  const tenantId = process.env.EZCR_TENANT_ID
  if (!tenantId) {
    throw new Error('EZCR_TENANT_ID environment variable is not set')
  }
  return tenantId
}

// ============================================
// GET INVOICES (List with filters)
// ============================================

export async function getInvoices(filters: QboInvoiceFilters = {}): Promise<QboInvoice[]> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  // Query web_transactions joined with qbo_entity_raw to get status
  const { data, error } = await supabase
    .from('web_transactions')
    .select(`
      qbo_entity_id,
      doc_number,
      txn_date,
      customer_name,
      customer_ref,
      total_amount,
      currency,
      status,
      payload
    `)
    .eq('tenant_id', tenantId)
    .eq('qbo_entity_type', 'Invoice')
    .order('txn_date', { ascending: false })

  if (error) {
    console.error('Error fetching invoices:', error)
    throw new Error('Failed to fetch invoices')
  }

  // Transform data and extract status from payload
  let invoices: QboInvoice[] = (data || []).map((row) => {
    const payload = row.payload as Record<string, unknown> | null
    return {
      qbo_entity_id: row.qbo_entity_id,
      doc_number: row.doc_number,
      txn_date: row.txn_date,
      customer_name: row.customer_name,
      customer_ref: row.customer_ref,
      total_amount: row.total_amount,
      currency: row.currency,
      status: (payload?.EInvoiceStatus as string) || null,
      balance: (payload?.Balance as number) ?? null,
      bill_email: (payload?.BillEmail as { Address?: string })?.Address || null,
    }
  })

  // Apply filters
  if (filters.search) {
    const search = filters.search.toLowerCase()
    invoices = invoices.filter(
      (inv) =>
        inv.doc_number?.toLowerCase().includes(search) ||
        inv.customer_name?.toLowerCase().includes(search)
    )
  }

  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'Outstanding') {
      // Outstanding is a computed status: all non-Paid invoices
      invoices = invoices.filter((inv) => inv.status !== 'Paid')
    } else {
      invoices = invoices.filter((inv) => inv.status === filters.status)
    }
  }

  if (filters.dateFrom) {
    invoices = invoices.filter(
      (inv) => inv.txn_date && inv.txn_date >= filters.dateFrom!
    )
  }

  if (filters.dateTo) {
    invoices = invoices.filter(
      (inv) => inv.txn_date && inv.txn_date <= filters.dateTo!
    )
  }

  return invoices
}

// ============================================
// GET SINGLE INVOICE WITH LINE ITEMS
// ============================================

export async function getInvoiceWithLines(
  entityId: string
): Promise<QboInvoiceWithLines | null> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  // Get invoice header
  const { data: invoiceData, error: invoiceError } = await supabase
    .from('web_transactions')
    .select(`
      qbo_entity_id,
      doc_number,
      txn_date,
      customer_name,
      customer_ref,
      total_amount,
      currency,
      status,
      payload
    `)
    .eq('tenant_id', tenantId)
    .eq('qbo_entity_type', 'Invoice')
    .eq('qbo_entity_id', entityId)
    .single()

  if (invoiceError) {
    if (invoiceError.code === 'PGRST116') {
      return null // Not found
    }
    console.error('Error fetching invoice:', invoiceError)
    throw new Error('Failed to fetch invoice')
  }

  // Get line items
  const { data: linesData, error: linesError } = await supabase
    .from('web_transaction_lines')
    .select(`
      line_num,
      item_name,
      description,
      quantity,
      unit_price,
      line_amount
    `)
    .eq('tenant_id', tenantId)
    .eq('qbo_entity_type', 'Invoice')
    .eq('qbo_entity_id', entityId)
    .order('line_num', { ascending: true })

  if (linesError) {
    console.error('Error fetching invoice lines:', linesError)
    throw new Error('Failed to fetch invoice lines')
  }

  const payload = invoiceData.payload as Record<string, unknown> | null

  return {
    qbo_entity_id: invoiceData.qbo_entity_id,
    doc_number: invoiceData.doc_number,
    txn_date: invoiceData.txn_date,
    customer_name: invoiceData.customer_name,
    customer_ref: invoiceData.customer_ref,
    total_amount: invoiceData.total_amount,
    currency: invoiceData.currency,
    status: (payload?.EInvoiceStatus as string) || null,
    balance: (payload?.Balance as number) ?? null,
    bill_email: (payload?.BillEmail as { Address?: string })?.Address || null,
    lines: (linesData || []).map((line) => ({
      line_num: line.line_num,
      item_name: line.item_name,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      line_amount: line.line_amount,
    })),
  }
}

// ============================================
// GET INVOICE STATS
// ============================================

export async function getInvoiceStats(): Promise<QboInvoiceStats> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('web_transactions')
    .select('total_amount, payload')
    .eq('tenant_id', tenantId)
    .eq('qbo_entity_type', 'Invoice')

  if (error) {
    console.error('Error fetching invoice stats:', error)
    throw new Error('Failed to fetch invoice stats')
  }

  const invoices = data || []

  let totalRevenue = 0
  let paidCount = 0
  let outstandingCount = 0

  invoices.forEach((inv) => {
    totalRevenue += inv.total_amount || 0
    const payload = inv.payload as Record<string, unknown> | null
    const status = payload?.EInvoiceStatus as string | undefined
    if (status === 'Paid') {
      paidCount++
    } else {
      outstandingCount++
    }
  })

  return {
    totalInvoices: invoices.length,
    totalRevenue,
    paidCount,
    outstandingCount,
  }
}
