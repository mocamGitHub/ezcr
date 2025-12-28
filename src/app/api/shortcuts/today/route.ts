import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateShortcutsToken, hasScope, extractRequestMetadata } from '@/lib/shortcuts/tokenAuth'
import { logShortcutAction } from '@/lib/audit/logger'

/**
 * GET /api/shortcuts/today
 * Get today's bookings for the authenticated user
 * Scope required: 'today' or '*'
 */
export async function GET(request: NextRequest) {
  try {
    // Validate token
    const authHeader = request.headers.get('Authorization')
    const validation = await validateShortcutsToken(authHeader)

    if (!validation.valid || !validation.token) {
      return NextResponse.json(
        { error: validation.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = validation.token

    // Check scope
    if (!hasScope(token, 'today')) {
      return NextResponse.json(
        { error: 'Token does not have "today" scope' },
        { status: 403 }
      )
    }

    const supabase = createServiceClient()

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Fetch user's bookings for today
    const { data: bookings, error } = await supabase
      .from('nx_scheduler_booking')
      .select('id, booking_uid, title, start_at, end_at, status, location')
      .eq('tenant_id', token.tenantId)
      .eq('attendee_user_id', token.userId)
      .gte('start_at', startOfDay.toISOString())
      .lt('start_at', endOfDay.toISOString())
      .order('start_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Also get external calendar events
    const { data: externalEvents } = await supabase
      .from('nx_external_calendar_event')
      .select(`
        id,
        title,
        start_at,
        end_at,
        all_day,
        location,
        nx_external_calendar_subscription!inner(user_id)
      `)
      .eq('tenant_id', token.tenantId)
      .eq('nx_external_calendar_subscription.user_id', token.userId)
      .gte('start_at', startOfDay.toISOString())
      .lt('start_at', endOfDay.toISOString())
      .order('start_at', { ascending: true })

    // Log action
    const { ipAddress, userAgent } = extractRequestMetadata(request)
    await logShortcutAction(token.tenantId, token.id, token.userId, 'shortcuts.today', {
      metadata: { bookingCount: bookings?.length || 0, externalCount: externalEvents?.length || 0 },
      ipAddress,
      userAgent,
    })

    // Format response for Shortcuts
    const formattedBookings = (bookings || []).map(b => ({
      id: b.id,
      uid: b.booking_uid,
      title: b.title || 'Booking',
      startTime: b.start_at,
      endTime: b.end_at,
      status: b.status,
      location: b.location,
      type: 'booking',
    }))

    const formattedExternal = (externalEvents || []).map(e => ({
      id: e.id,
      title: e.title || 'Event',
      startTime: e.start_at,
      endTime: e.end_at,
      allDay: e.all_day,
      location: e.location,
      type: 'external',
    }))

    // Merge and sort by start time
    const allEvents = [...formattedBookings, ...formattedExternal].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

    return NextResponse.json({
      success: true,
      date: startOfDay.toISOString().split('T')[0],
      events: allEvents,
      count: allEvents.length,
    })
  } catch (error) {
    console.error('Shortcuts today error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch today' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
