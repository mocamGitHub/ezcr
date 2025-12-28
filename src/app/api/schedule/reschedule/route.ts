import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth, ROLE_GROUPS } from '@/lib/auth/api-auth'
import { getTenantId } from '@/lib/tenant'
import { calcomFetchJson, getCalcomConfigFromEnv } from '@/scheduler/calcomServerClient'

/**
 * POST /api/schedule/reschedule
 * Reschedule a booking to a new time
 * Body: { bookingUid, newStart, reason? }
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { bookingUid, newStart, reason } = body

    if (!bookingUid || !newStart) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingUid, newStart' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Verify booking belongs to this tenant and user can reschedule it
    const { data: booking, error: bookingError } = await supabase
      .from('nx_scheduler_booking')
      .select('id, attendee_user_id, status, metadata')
      .eq('tenant_id', tenantId)
      .eq('booking_uid', bookingUid)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check authorization
    const isAttendee = booking.attendee_user_id === user.id
    const isAdmin = ROLE_GROUPS.ADMIN_ROLES.includes(user.role)

    if (!isAttendee && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to reschedule this booking' },
        { status: 403 }
      )
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot reschedule a cancelled booking' },
        { status: 400 }
      )
    }

    // Reschedule in Cal.com
    const cfg = getCalcomConfigFromEnv()
    const result = await calcomFetchJson<any>(cfg, {
      method: 'POST',
      path: `/v2/bookings/${encodeURIComponent(bookingUid)}/reschedule`,
      body: {
        start: newStart,
        reschedulingReason: reason || 'User requested reschedule',
      },
    })

    // Update local mirror - mark old booking as rescheduled
    const newBookingUid = result.uid || result.id || bookingUid
    const { error: updateError } = await supabase
      .from('nx_scheduler_booking')
      .update({
        status: 'rescheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Failed to update booking status:', updateError)
    }

    // If Cal.com returns a new booking, insert it
    if (newBookingUid !== bookingUid) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email, phone')
        .eq('id', user.id)
        .single()

      const attendeeName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email
        : user.email

      const purpose = (booking.metadata as any)?.purpose || 'rescheduled'

      await supabase
        .from('nx_scheduler_booking')
        .insert({
          tenant_id: tenantId,
          attendee_user_id: user.id,
          booking_uid: newBookingUid,
          cal_event_type_id: result.eventTypeId || null,
          start_at: newStart,
          end_at: result.endTime || null,
          status: 'scheduled',
          attendee_email: user.email,
          title: `${purpose} - ${attendeeName}`,
          metadata: {
            purpose,
            attendee_name: attendeeName,
            attendee_phone: profile?.phone || null,
            rescheduled_from: bookingUid,
          },
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Booking rescheduled successfully',
      oldBookingUid: bookingUid,
      newBookingUid,
      newStart,
    })
  } catch (error) {
    console.error('Schedule reschedule error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reschedule booking' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
