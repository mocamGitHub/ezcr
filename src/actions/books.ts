'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { getTenantId as getEnvironmentTenantId } from '@/lib/tenant'

// Types for Books module
export interface BooksKPISummary {
  tenant_id: string
  receipts_total: number
  receipts_matched: number
  receipts_unmatched: number
  receipts_unmatched_with_suggestions: number
  receipts_exceptions: number
  bank_txns_total: number
  bank_txns_cleared: number
  bank_txns_uncleared: number
  matches_suggested: number
  matches_auto_linked: number
  matches_confirmed: number
  matches_rejected: number
}

export interface MatchSuggestion {
  match_id: string
  bank_transaction_id: string
  status: 'suggested' | 'auto_linked' | 'confirmed' | 'rejected'
  score: number
  reasons: Record<string, unknown>
  txn: {
    posted_at: string
    amount: number
    currency: string
    merchant: string
    merchant_norm: string
    description: string
    external_id: string
    cleared: boolean
  }
}

export interface ReceiptQueueItem {
  document_id: string
  tenant_id: string
  vendor_guess: string | null
  total_amount: number | null
  currency: string | null
  document_date: string | null
  confidence_overall: number | null
  is_matched: boolean
  suggested_count: number
  document_type: 'receipt' | 'invoice' | 'bank_statement' | 'other'
  created_at: string
  updated_at: string
  top_suggestions: MatchSuggestion[]
}

export interface BankTransaction {
  id: string
  tenant_id: string
  posted_at: string
  amount: number
  currency: string
  merchant: string
  merchant_norm: string
  description: string | null
  external_id: string | null
  bank_source: 'csv' | 'ofx' | 'manual' | 'statement_extraction'
  cleared: boolean
  created_at: string
}

export interface BooksSettings {
  id: string
  tenant_id: string
  enabled: boolean
  auto_link_threshold: number
  amount_tolerance: number
  date_window_days: number
  min_receipt_confidence: number
  created_at: string
  updated_at: string
}

async function getTenantId(): Promise<string> {
  return await getEnvironmentTenantId()
}

/**
 * Get tenant ID for client-side use (e.g., uploads)
 */
export async function getClientTenantId(): Promise<string> {
  return await getEnvironmentTenantId()
}

/**
 * Get Books KPI summary
 */
export async function getBooksKPIs(): Promise<BooksKPISummary | null> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('books_kpi_summary')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - return zeros
        return {
          tenant_id: tenantId,
          receipts_total: 0,
          receipts_matched: 0,
          receipts_unmatched: 0,
          receipts_unmatched_with_suggestions: 0,
          receipts_exceptions: 0,
          bank_txns_total: 0,
          bank_txns_cleared: 0,
          bank_txns_uncleared: 0,
          matches_suggested: 0,
          matches_auto_linked: 0,
          matches_confirmed: 0,
          matches_rejected: 0,
        }
      }
      throw error
    }

    return data as BooksKPISummary
  } catch (error) {
    console.error('Error fetching Books KPIs:', error)
    return null
  }
}

/**
 * Get receipt review queue with match suggestions
 */
export async function getReceiptQueue(
  filters?: {
    search?: string
    status?: 'all' | 'matched' | 'unmatched' | 'exceptions'
  },
  sort?: {
    field: 'created_at' | 'document_date' | 'total_amount' | 'confidence_overall'
    direction: 'asc' | 'desc'
  },
  page: number = 1,
  pageSize: number = 50
): Promise<{ receipts: ReceiptQueueItem[]; total: number; totalPages: number }> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    let query = supabase
      .from('books_receipt_review_queue_with_suggestions_v1')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Apply filters
    if (filters?.search) {
      query = query.ilike('vendor_guess', `%${filters.search}%`)
    }

    if (filters?.status === 'matched') {
      query = query.eq('is_matched', true)
    } else if (filters?.status === 'unmatched') {
      query = query.eq('is_matched', false)
    } else if (filters?.status === 'exceptions') {
      // Low confidence or missing data
      query = query.or('confidence_overall.lt.0.6,vendor_guess.is.null,total_amount.is.null')
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      receipts: (data || []) as ReceiptQueueItem[],
      total: count || 0,
      totalPages: count ? Math.ceil(count / pageSize) : 0,
    }
  } catch (error) {
    console.error('Error fetching receipt queue:', error)
    return { receipts: [], total: 0, totalPages: 0 }
  }
}

/**
 * Get bank transactions list
 */
export async function getBankTransactions(
  filters?: {
    search?: string
    cleared?: 'all' | 'cleared' | 'uncleared'
  },
  sort?: {
    field: 'posted_at' | 'amount' | 'merchant'
    direction: 'asc' | 'desc'
  },
  page: number = 1,
  pageSize: number = 50
): Promise<{ transactions: BankTransaction[]; total: number; totalPages: number }> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    let query = supabase
      .from('books_bank_transactions')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Apply filters
    if (filters?.search) {
      query = query.or(`merchant.ilike.%${filters.search}%,merchant_norm.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.cleared === 'cleared') {
      query = query.eq('cleared', true)
    } else if (filters?.cleared === 'uncleared') {
      query = query.eq('cleared', false)
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })
    } else {
      query = query.order('posted_at', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      transactions: (data || []) as BankTransaction[],
      total: count || 0,
      totalPages: count ? Math.ceil(count / pageSize) : 0,
    }
  } catch (error) {
    console.error('Error fetching bank transactions:', error)
    return { transactions: [], total: 0, totalPages: 0 }
  }
}

/**
 * Get Books settings for tenant
 */
export async function getBooksSettings(): Promise<BooksSettings | null> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('books_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No settings found
      }
      throw error
    }

    return data as BooksSettings
  } catch (error) {
    console.error('Error fetching Books settings:', error)
    return null
  }
}

/**
 * Update Books settings
 */
export async function updateBooksSettings(settings: {
  auto_link_threshold?: number
  amount_tolerance?: number
  date_window_days?: number
  min_receipt_confidence?: number
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { error } = await supabase
      .from('books_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)

    if (error) throw error

    return { ok: true }
  } catch (error) {
    console.error('Error updating Books settings:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Confirm a match (wrapper around existing action)
 */
export async function confirmMatch(matchId: string, clearTxn: boolean = true): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { error } = await supabase.rpc('books_confirm_match', {
      p_tenant_id: tenantId,
      p_match_id: matchId,
      p_clear_txn: clearTxn,
    })

    if (error) throw error

    return { ok: true }
  } catch (error) {
    console.error('Error confirming match:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Reject a match (wrapper around existing action)
 */
export async function rejectMatch(matchId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { error } = await supabase.rpc('books_reject_match', {
      p_tenant_id: tenantId,
      p_match_id: matchId,
    })

    if (error) throw error

    return { ok: true }
  } catch (error) {
    console.error('Error rejecting match:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Bulk confirm matches
 */
export async function bulkConfirmMatches(matchIds: string[]): Promise<{ ok: boolean; confirmed: number; errors: string[] }> {
  const tenantId = await getTenantId()
  const supabase = createServiceClient()
  let confirmed = 0
  const errors: string[] = []

  for (const matchId of matchIds) {
    try {
      const { error } = await supabase.rpc('books_confirm_match', {
        p_tenant_id: tenantId,
        p_match_id: matchId,
        p_clear_txn: true,
      })

      if (error) {
        errors.push(`${matchId}: ${error.message}`)
      } else {
        confirmed++
      }
    } catch (err) {
      errors.push(`${matchId}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return { ok: errors.length === 0, confirmed, errors }
}

/**
 * Bulk reject matches
 */
export async function bulkRejectMatches(matchIds: string[]): Promise<{ ok: boolean; rejected: number; errors: string[] }> {
  const tenantId = await getTenantId()
  const supabase = createServiceClient()
  let rejected = 0
  const errors: string[] = []

  for (const matchId of matchIds) {
    try {
      const { error } = await supabase.rpc('books_reject_match', {
        p_tenant_id: tenantId,
        p_match_id: matchId,
      })

      if (error) {
        errors.push(`${matchId}: ${error.message}`)
      } else {
        rejected++
      }
    } catch (err) {
      errors.push(`${matchId}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return { ok: errors.length === 0, rejected, errors }
}
