'use server'

import { createServiceClient } from '@/lib/supabase/server'
import type { Dashboard, Widget, SavedView } from './dashboard-utils'

function getTenantId(): string {
  const tenantId = process.env.EZCR_TENANT_ID
  if (!tenantId) throw new Error('EZCR_TENANT_ID not set')
  return tenantId
}

// Get all dashboards for tenant
export async function getDashboards(): Promise<Dashboard[]> {
  const supabase = await createServiceClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('nx_dashboards')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching dashboards:', error)
    return []
  }

  return data || []
}

// Get dashboard by key
export async function getDashboard(key: string): Promise<Dashboard | null> {
  const supabase = await createServiceClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('nx_dashboards')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('key', key)
    .single()

  if (error) {
    console.error('Error fetching dashboard:', error)
    return null
  }

  return data
}

// Get default dashboard
export async function getDefaultDashboard(): Promise<Dashboard | null> {
  const supabase = await createServiceClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('nx_dashboards')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .single()

  if (error) {
    // Fall back to first dashboard
    const { data: first } = await supabase
      .from('nx_dashboards')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('position', { ascending: true })
      .limit(1)
      .single()

    return first || null
  }

  return data
}

// Get widgets for dashboard
export async function getWidgets(dashboardId: string): Promise<Widget[]> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('nx_widgets')
    .select('*')
    .eq('dashboard_id', dashboardId)
    .eq('is_enabled', true)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching widgets:', error)
    return []
  }

  return data || []
}

// Get saved views for dashboard
export async function getSavedViews(dashboardId: string, userId: string): Promise<SavedView[]> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('nx_saved_views')
    .select('*')
    .eq('dashboard_id', dashboardId)
    .or(`owner_id.eq.${userId},is_shared.eq.true`)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching saved views:', error)
    return []
  }

  return data || []
}

// Execute widget RPC
// Note: dateRange dates may be serialized to strings when passed through server actions
export async function executeWidgetRpc(
  rpcName: string,
  dateRange: { from: Date | string; to: Date | string; preset?: string },
  filters: Record<string, unknown> = {}
): Promise<unknown> {
  const supabase = await createServiceClient()
  const tenantId = getTenantId()

  // Format dates - handle both Date objects and ISO strings
  const formatDate = (d: Date | string): string => {
    if (typeof d === 'string') {
      return d.split('T')[0]
    }
    return d.toISOString().split('T')[0]
  }

  const dateFrom = formatDate(dateRange.from)
  const dateTo = formatDate(dateRange.to)

  try {
    const { data, error } = await supabase.rpc(rpcName, {
      p_tenant_id: tenantId,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_filters: filters,
    })

    if (error) {
      console.error(`Error executing RPC ${rpcName}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error(`Error executing RPC ${rpcName}:`, error)
    return null
  }
}

// Save view
export async function saveView(
  dashboardId: string,
  userId: string,
  name: string,
  filters: Record<string, unknown>,
  isShared: boolean = false
): Promise<SavedView | null> {
  const supabase = await createServiceClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('nx_saved_views')
    .insert({
      tenant_id: tenantId,
      dashboard_id: dashboardId,
      owner_id: userId,
      name,
      filters,
      is_shared: isShared,
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving view:', error)
    return null
  }

  return data
}

// Delete view
export async function deleteView(viewId: string): Promise<boolean> {
  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('nx_saved_views')
    .delete()
    .eq('id', viewId)

  if (error) {
    console.error('Error deleting view:', error)
    return false
  }

  return true
}

