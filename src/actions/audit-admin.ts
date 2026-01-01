'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'

export interface AuditLogEntry {
  id: string
  tenant_id: string
  user_id: string | null
  actor_type: 'user' | 'shortcut' | 'system' | 'webhook'
  actor_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
  // Joined fields
  user_email?: string
}

export interface GetAuditLogsParams {
  page?: number
  pageSize?: number
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  search?: string
  actorTypeFilter?: 'all' | 'user' | 'shortcut' | 'system' | 'webhook'
  actionFilter?: string
  startDate?: string
  endDate?: string
}

export interface GetAuditLogsResult {
  data: AuditLogEntry[]
  totalCount: number
}

/**
 * Require the current user to be a staff member (admin or team_member)
 */
async function requireStaffMember() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'team_member'].includes(profile.role)) {
    throw new Error('Staff access required')
  }

  return user
}

/**
 * Get paginated audit log entries
 */
export async function getAuditLogs(
  params: GetAuditLogsParams = {}
): Promise<GetAuditLogsResult> {
  await requireStaffMember()

  const tenantId = await getTenantId()
  const supabase = createServiceClient()

  const {
    page = 1,
    pageSize = 50,
    sortColumn = 'created_at',
    sortDirection = 'desc',
    search = '',
    actorTypeFilter = 'all',
    actionFilter = '',
    startDate,
    endDate,
  } = params

  // Build query
  let query = supabase
    .from('nx_audit_log')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)

  // Apply actor type filter
  if (actorTypeFilter !== 'all') {
    query = query.eq('actor_type', actorTypeFilter)
  }

  // Apply action filter
  if (actionFilter) {
    query = query.ilike('action', `%${actionFilter}%`)
  }

  // Apply date filters
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  // Apply search
  if (search) {
    query = query.or(
      `action.ilike.%${search}%,resource_type.ilike.%${search}%,resource_id.ilike.%${search}%`
    )
  }

  // Apply sorting
  const validSortColumns = ['created_at', 'action', 'actor_type', 'resource_type']
  const safeColumn = validSortColumns.includes(sortColumn) ? sortColumn : 'created_at'
  query = query.order(safeColumn, { ascending: sortDirection === 'asc' })

  // Apply pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching audit logs:', error)
    throw new Error('Failed to fetch audit logs')
  }

  // Enrich with user emails where available
  const entries = data || []
  const userIds = [...new Set(entries.filter(e => e.user_id).map(e => e.user_id))]

  let userEmails: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds)

    if (users) {
      userEmails = Object.fromEntries(users.map(u => [u.id, u.email]))
    }
  }

  const enrichedEntries = entries.map(entry => ({
    ...entry,
    user_email: entry.user_id ? userEmails[entry.user_id] : undefined,
  }))

  return {
    data: enrichedEntries,
    totalCount: count || 0,
  }
}

/**
 * Get distinct action types for filtering
 */
export async function getAuditActionTypes(): Promise<string[]> {
  await requireStaffMember()

  const tenantId = await getTenantId()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('nx_audit_log')
    .select('action')
    .eq('tenant_id', tenantId)
    .order('action')

  if (error) {
    console.error('Error fetching action types:', error)
    return []
  }

  // Get unique action types
  const actions = [...new Set((data || []).map(d => d.action))]
  return actions.sort()
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(): Promise<{
  totalLogs: number
  last24Hours: number
  last7Days: number
  byActorType: Record<string, number>
}> {
  await requireStaffMember()

  const tenantId = await getTenantId()
  const supabase = createServiceClient()

  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get total count
  const { count: totalLogs } = await supabase
    .from('nx_audit_log')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  // Get last 24 hours count
  const { count: last24HoursCount } = await supabase
    .from('nx_audit_log')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', last24Hours)

  // Get last 7 days count
  const { count: last7DaysCount } = await supabase
    .from('nx_audit_log')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', last7Days)

  // Get counts by actor type
  const { data: actorData } = await supabase
    .from('nx_audit_log')
    .select('actor_type')
    .eq('tenant_id', tenantId)

  const byActorType: Record<string, number> = {}
  for (const row of actorData || []) {
    byActorType[row.actor_type] = (byActorType[row.actor_type] || 0) + 1
  }

  return {
    totalLogs: totalLogs || 0,
    last24Hours: last24HoursCount || 0,
    last7Days: last7DaysCount || 0,
    byActorType,
  }
}
