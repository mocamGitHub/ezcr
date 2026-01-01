'use server'

import { createServiceClient } from '@/lib/supabase/server'

// Types
export interface Dashboard {
  id: string
  tenant_id: string
  key: string
  name: string
  description: string | null
  is_default: boolean
  icon: string | null
  position: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Widget {
  id: string
  tenant_id: string
  dashboard_id: string
  key: string
  widget_type: 'kpi' | 'timeseries' | 'table' | 'bar' | 'donut'
  title: string
  subtitle: string | null
  rpc_name: string | null
  rpc_args: Record<string, unknown>
  display_config: Record<string, unknown>
  position: number
  grid_config: {
    col: number
    row: number
    width: number
    height: number
  }
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export interface SavedView {
  id: string
  tenant_id: string
  dashboard_id: string
  owner_id: string
  name: string
  filters: {
    date_from?: string
    date_to?: string
    preset?: string
  }
  is_shared: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface DateRange {
  from: Date
  to: Date
  preset?: string
}

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
export async function executeWidgetRpc(
  rpcName: string,
  dateRange: DateRange,
  filters: Record<string, unknown> = {}
): Promise<unknown> {
  const supabase = await createServiceClient()
  const tenantId = getTenantId()

  // Format dates
  const dateFrom = dateRange.from.toISOString().split('T')[0]
  const dateTo = dateRange.to.toISOString().split('T')[0]

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

// Date preset helpers
export function getDatePreset(preset: string): DateRange {
  const now = new Date()
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case '7d':
      return {
        from: new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000),
        to,
        preset,
      }
    case '30d':
      return {
        from: new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000),
        to,
        preset,
      }
    case 'mtd':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to,
        preset,
      }
    case 'qtd':
      const quarter = Math.floor(now.getMonth() / 3)
      return {
        from: new Date(now.getFullYear(), quarter * 3, 1),
        to,
        preset,
      }
    case 'ytd':
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to,
        preset,
      }
    default:
      return {
        from: new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000),
        to,
        preset: '30d',
      }
  }
}
