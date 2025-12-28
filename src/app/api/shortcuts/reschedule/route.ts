import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateShortcutsToken, hasScope, extractRequestMetadata } from '@/lib/shortcuts/tokenAuth'
import { logShortcutAction, AuditActions } from '@/lib/audit/logger'
import { calcomFetchJson, getCalcomConfigFromEnv } from '@/scheduler/calcomServerClient'

/**
 * POST /api/shortcuts/reschedule
 * Reschedule a booking via Cal.com API
 * Scope required: 'reschedule' or '*'
 */
export async function POST(request: NextRequest) {
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
    if (!hasScope(token, 'reschedule')) {
      return NextResponse.json(
        { error: 'Token does not have "reschedule" scope' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { bookingUid, newStartTime, reason } = body

    if (!bookingUid) {
      return NextResponse.json(
        { error: 'Missing required field: bookingUid' },
        { status: 400 }
      )
    }

    if (!newStartTime) {
      return NextResponse.json(
        { error: 'Missing required field: newStartTime' },
        { status: 400 }
      )
    }

    const newStart = new Date(newStartTime)
    if (isNaN(newStart.getTime())) {
      return NextResponse.json(
        { error: 'Invalid newStartTime format' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Verify booking belongs to user
    const { data: booking } = await supabase
      .from('nx_scheduler_booking')
      .select('id, cal_booking_id, booking_uid, status')
      .eq('tenant_id', token.tenantId)
      .eq('booking_uid', bookingUid)
      .eq('attendee_user_id', token.userId)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or not authorized' },
        { status: 404 }
      )
    }

    if (booking.status !== 'scheduled') {
      return NextResponse.json(
        { error: `Cannot reschedule booking with status: ${booking.status}` },
        { status: 400 }
      )
    }

    // Call Cal.com reschedule API
    try {
      const cfg = getCalcomConfigFromEnv()
      await calcomFetchJson(cfg, {
        method: 'POST',
        path: `/v2/bookings/${bookingUid}/reschedule`,
        body: {
          start: newStart.toISOString(),
          rescheduledReason: reason || 'Rescheduled via iOS Shortcut',
        },
      })
    } catch (calError) {
      console.error('Cal.com reschedule error:', calError)
      return NextResponse.json(
        { error: calError instanceof Error ? calError.message : 'Cal.com reschedule failed' },
        { status: 500 }
      )
    }

    // Update local booking record
    await supabase
      .from('nx_scheduler_booking')
      .update({
        status: 'rescheduled',
        start_at: newStart.toISOString(),
        metadata: {
          rescheduled_at: new Date().toISOString(),
          rescheduled_reason: reason,
          rescheduled_via: 'shortcut',
        },
      })
      .eq('id', booking.id)

    // Log action
    const { ipAddress, userAgent } = extractRequestMetadata(request)
    await logShortcutAction(token.tenantId, token.id, token.userId, AuditActions.SHORTCUT_RESCHEDULE, {
      resourceType: 'booking',
      resourceId: booking.id,
      metadata: { bookingUid, newStartTime: newStart.toISOString(), reason },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      bookingUid,
      newStartTime: newStart.toISOString(),
      message: 'Booking rescheduled successfully',
    })
  } catch (error) {
    console.error('Shortcuts reschedule error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reschedule' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
