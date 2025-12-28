import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { getTenantId } from '@/lib/tenant'

/**
 * GET /api/schedule/my-bookings
 * Get all bookings for the authenticated user
 * Query: status? (filter by status: confirmed, cancelled, rescheduled)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const upcoming = searchParams.get('upcoming') === 'true'

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Build query
    let query = supabase
      .from('nx_scheduler_booking')
      .select(`
        id,
        booking_uid,
        cal_event_type_id,
        start_at,
        end_at,
        status,
        title,
        attendee_email,
        metadata,
        created_at,
        updated_at
      `)
      .eq('tenant_id', tenantId)
      .eq('attendee_user_id', user.id)
      .order('start_at', { ascending: true })

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Filter to upcoming bookings only
    if (upcoming) {
      query = query
        .gte('start_at', new Date().toISOString())
        .neq('status', 'canceled')
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('Failed to fetch bookings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      count: bookings?.length || 0,
    })
  } catch (error) {
    console.error('My bookings error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
