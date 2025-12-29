'use server'

import { createClient } from '@supabase/supabase-js'
import type {
  Tool,
  ToolFilters,
  ToolFormData,
  ToolCategory,
  ToolStatus,
  ToolCostSummary,
  UpcomingRenewal,
} from '@/types/contacts-tools'

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
// GET TOOLS (List with filters)
// ============================================

export async function getTools(filters: ToolFilters = {}): Promise<Tool[]> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  let query = supabase
    .from('tenant_tools')
    .select(`
      *,
      vendor_contact:tenant_contacts!vendor_contact_id (
        id,
        company_name,
        contact_type
      )
    `)
    .eq('tenant_id', tenantId)
    .is('archived_at', null)
    .order('name', { ascending: true })

  // Apply filters
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    )
  }

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.integration_status && filters.integration_status !== 'all') {
    query = query.eq('integration_status', filters.integration_status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching tools:', error)
    throw new Error('Failed to fetch tools')
  }

  return data || []
}

// ============================================
// GET SINGLE TOOL
// ============================================

export async function getTool(id: string): Promise<Tool | null> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('tenant_tools')
    .select(`
      *,
      vendor_contact:tenant_contacts!vendor_contact_id (
        id,
        company_name,
        contact_name,
        email,
        phone,
        contact_type
      )
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    console.error('Error fetching tool:', error)
    throw new Error('Failed to fetch tool')
  }

  return data
}

// ============================================
// CREATE TOOL
// ============================================

export async function createTool(data: ToolFormData): Promise<Tool> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  const { data: tool, error } = await supabase
    .from('tenant_tools')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      description: data.description || null,
      category: data.category,
      vendor_contact_id: data.vendor_contact_id || null,
      website_url: data.website_url || null,
      login_url: data.login_url || null,
      documentation_url: data.documentation_url || null,
      account_email: data.account_email || null,
      account_username: data.account_username || null,
      api_key_name: data.api_key_name || null,
      has_mfa: data.has_mfa ?? false,
      mfa_method: data.mfa_method || null,
      billing_cycle: data.billing_cycle || null,
      cost_amount: data.cost_amount || null,
      cost_currency: data.cost_currency || 'USD',
      renewal_date: data.renewal_date || null,
      auto_renew: data.auto_renew ?? true,
      cancellation_notice_days: data.cancellation_notice_days ?? 30,
      integration_status: data.integration_status || 'not_integrated',
      status: data.status,
      tags: data.tags || [],
      notes: data.notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating tool:', error)
    throw new Error('Failed to create tool')
  }

  return tool
}

// ============================================
// UPDATE TOOL
// ============================================

export async function updateTool(
  id: string,
  data: Partial<ToolFormData>
): Promise<Tool> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  // Build update object, only including defined values
  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.category !== undefined) updateData.category = data.category
  if (data.vendor_contact_id !== undefined) updateData.vendor_contact_id = data.vendor_contact_id || null
  if (data.website_url !== undefined) updateData.website_url = data.website_url || null
  if (data.login_url !== undefined) updateData.login_url = data.login_url || null
  if (data.documentation_url !== undefined) updateData.documentation_url = data.documentation_url || null
  if (data.account_email !== undefined) updateData.account_email = data.account_email || null
  if (data.account_username !== undefined) updateData.account_username = data.account_username || null
  if (data.api_key_name !== undefined) updateData.api_key_name = data.api_key_name || null
  if (data.has_mfa !== undefined) updateData.has_mfa = data.has_mfa
  if (data.mfa_method !== undefined) updateData.mfa_method = data.mfa_method || null
  if (data.billing_cycle !== undefined) updateData.billing_cycle = data.billing_cycle || null
  if (data.cost_amount !== undefined) updateData.cost_amount = data.cost_amount || null
  if (data.cost_currency !== undefined) updateData.cost_currency = data.cost_currency || 'USD'
  if (data.renewal_date !== undefined) updateData.renewal_date = data.renewal_date || null
  if (data.auto_renew !== undefined) updateData.auto_renew = data.auto_renew
  if (data.cancellation_notice_days !== undefined) updateData.cancellation_notice_days = data.cancellation_notice_days
  if (data.integration_status !== undefined) updateData.integration_status = data.integration_status
  if (data.status !== undefined) updateData.status = data.status
  if (data.tags !== undefined) updateData.tags = data.tags || []
  if (data.notes !== undefined) updateData.notes = data.notes || null

  const { data: tool, error } = await supabase
    .from('tenant_tools')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) {
    console.error('Error updating tool:', error)
    throw new Error('Failed to update tool')
  }

  return tool
}

// ============================================
// DELETE TOOL (Soft Delete)
// ============================================

export async function deleteTool(id: string): Promise<void> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  const { error } = await supabase
    .from('tenant_tools')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error deleting tool:', error)
    throw new Error('Failed to delete tool')
  }
}

// ============================================
// GET TOOL COST SUMMARY
// ============================================

export async function getToolCostSummary(): Promise<ToolCostSummary | null> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('tenant_tools_cost_summary')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No data yet, return defaults
      return {
        tenant_id: tenantId,
        total_tools: 0,
        active_tools: 0,
        total_monthly_cost: 0,
        total_annual_cost: 0,
        payment_tools: 0,
        email_tools: 0,
        shipping_tools: 0,
        analytics_tools: 0,
        development_tools: 0,
      }
    }
    console.error('Error fetching tool cost summary:', error)
    throw new Error('Failed to fetch tool cost summary')
  }

  return data
}

// ============================================
// GET UPCOMING RENEWALS
// ============================================

export async function getUpcomingRenewals(
  days: number = 30
): Promise<UpcomingRenewal[]> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('tenant_tools_upcoming_renewals')
    .select('*')
    .eq('tenant_id', tenantId)
    .lte('days_until_renewal', days)
    .order('renewal_date', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming renewals:', error)
    throw new Error('Failed to fetch upcoming renewals')
  }

  return data || []
}

// ============================================
// GET TOOL STATS
// ============================================

export async function getToolStats(): Promise<{
  total: number
  byCategory: Record<ToolCategory, number>
  byStatus: Record<ToolStatus, number>
  totalMonthlyCost: number
  totalAnnualCost: number
}> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  // Get all tools
  const { data: tools, error: toolsError } = await supabase
    .from('tenant_tools')
    .select('category, status, billing_cycle, cost_amount')
    .eq('tenant_id', tenantId)
    .is('archived_at', null)

  if (toolsError) {
    console.error('Error fetching tool stats:', toolsError)
    throw new Error('Failed to fetch tool stats')
  }

  const toolList = tools || []

  const byCategory: Record<ToolCategory, number> = {
    payment: 0,
    email: 0,
    sms: 0,
    analytics: 0,
    crm: 0,
    shipping: 0,
    accounting: 0,
    marketing: 0,
    development: 0,
    infrastructure: 0,
    security: 0,
    storage: 0,
    communication: 0,
    other: 0,
  }

  const byStatus: Record<ToolStatus, number> = {
    active: 0,
    inactive: 0,
    trial: 0,
    cancelled: 0,
    expired: 0,
  }

  let totalMonthlyCost = 0
  let totalAnnualCost = 0

  toolList.forEach((t) => {
    if (t.category in byCategory) {
      byCategory[t.category as ToolCategory]++
    }
    if (t.status in byStatus) {
      byStatus[t.status as ToolStatus]++
    }

    // Calculate costs for active tools
    if (t.status === 'active' && t.cost_amount) {
      const amount = Number(t.cost_amount)
      switch (t.billing_cycle) {
        case 'monthly':
          totalMonthlyCost += amount
          totalAnnualCost += amount * 12
          break
        case 'quarterly':
          totalMonthlyCost += amount / 3
          totalAnnualCost += amount * 4
          break
        case 'semi_annual':
          totalMonthlyCost += amount / 6
          totalAnnualCost += amount * 2
          break
        case 'annual':
          totalMonthlyCost += amount / 12
          totalAnnualCost += amount
          break
      }
    }
  })

  return {
    total: toolList.length,
    byCategory,
    byStatus,
    totalMonthlyCost,
    totalAnnualCost,
  }
}
