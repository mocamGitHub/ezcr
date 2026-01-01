'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTenantId as getEnvironmentTenantId } from '@/lib/tenant'

/**
 * Type definitions for scheduler admin
 */
export interface SchedulerBooking {
  id: string
  tenant_id: string
  booking_uid: string
  cal_booking_id: number | null
  cal_event_type_id: number
  status: 'scheduled' | 'cancelled' | 'rescheduled'
  start_at: string
  end_at: string | null
  host_email: string | null
  attendee_user_id: string | null
  attendee_email: string
  title: string | null
  location: Record<string, unknown> | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface GetAdminBookingsParams {
  page?: number
  pageSize?: number
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  search?: string
  statusFilter?: 'all' | 'scheduled' | 'cancelled' | 'rescheduled'
  startDate?: string
  endDate?: string
}

export interface GetAdminBookingsResult {
  data: SchedulerBooking[]
  totalCount: number
  page: number
  pageSize: number
}

/**
 * Get tenant ID using environment-aware configuration
 */
async function getTenantId(): Promise<string> {
  return await getEnvironmentTenantId()
}

/**
 * Check if current user is an owner or admin
 */
async function requireOwnerOrAdmin() {
  const supabase = await createClient()
  const tenantId = await getTenantId()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const serviceClient = createServiceClient()
  const { data: profile, error } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !profile || !['owner', 'admin'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }

  return user.id
}

/**
 * Get paginated list of bookings for admin view
 */
export async function getAdminBookings(
  params: GetAdminBookingsParams = {}
): Promise<GetAdminBookingsResult> {
  const {
    page = 1,
    pageSize = 20,
    sortColumn = 'start_at',
    sortDirection = 'desc',
    search = '',
    statusFilter = 'all',
    startDate,
    endDate,
  } = params

  try {
    await requireOwnerOrAdmin()

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Build query
    let query = supabase
      .from('nx_scheduler_booking')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    // Apply date range filter
    if (startDate) {
      query = query.gte('start_at', startDate)
    }
    if (endDate) {
      query = query.lte('start_at', endDate)
    }

    // Apply search
    if (search) {
      query = query.or(`attendee_email.ilike.%${search}%,title.ilike.%${search}%,host_email.ilike.%${search}%`)
    }

    // Apply sorting
    const ascending = sortDirection === 'asc'
    switch (sortColumn) {
      case 'start_at':
        query = query.order('start_at', { ascending })
        break
      case 'status':
        query = query.order('status', { ascending })
        break
      case 'attendee_email':
        query = query.order('attendee_email', { ascending })
        break
      case 'created_at':
        query = query.order('created_at', { ascending })
        break
      default:
        query = query.order('start_at', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: (data || []) as SchedulerBooking[],
      totalCount: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    console.error('Error fetching admin bookings:', error)
    throw error
  }
}

/**
 * Cancel a booking (admin action)
 */
export async function cancelBooking(bookingId: string): Promise<{ success: boolean }> {
  try {
    await requireOwnerOrAdmin()

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { error } = await supabase
      .from('nx_scheduler_booking')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('tenant_id', tenantId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error cancelling booking:', error)
    throw error
  }
}

/**
 * Bulk cancel multiple bookings (admin action)
 */
export async function bulkCancelBookings(
  bookingIds: string[]
): Promise<{ success: boolean; cancelledCount: number }> {
  try {
    await requireOwnerOrAdmin()

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('nx_scheduler_booking')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .in('id', bookingIds)
      .eq('tenant_id', tenantId)
      .eq('status', 'scheduled') // Only cancel scheduled bookings
      .select('id')

    if (error) throw error

    return { success: true, cancelledCount: data?.length || 0 }
  } catch (error) {
    console.error('Error bulk cancelling bookings:', error)
    throw error
  }
}

/**
 * Get a single booking by ID (admin)
 */
export async function getAdminBooking(bookingId: string): Promise<SchedulerBooking | null> {
  try {
    await requireOwnerOrAdmin()

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('nx_scheduler_booking')
      .select('*')
      .eq('id', bookingId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data as SchedulerBooking
  } catch (error) {
    console.error('Error fetching booking:', error)
    throw error
  }
}
