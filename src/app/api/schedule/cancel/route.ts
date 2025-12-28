import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth, ROLE_GROUPS } from '@/lib/auth/api-auth'
import { getTenantId } from '@/lib/tenant'
import { calcomFetchJson, getCalcomConfigFromEnv } from '@/scheduler/calcomServerClient'

/**
 * POST /api/schedule/cancel
 * Cancel a booking
 * Body: { bookingUid, reason? }
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
    const { bookingUid, reason } = body

    if (!bookingUid) {
      return NextResponse.json(
        { error: 'Missing required field: bookingUid' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Verify booking belongs to this tenant and user can cancel it
    const { data: booking, error: bookingError } = await supabase
      .from('nx_scheduler_booking')
      .select('id, attendee_user_id, status')
      .eq('tenant_id', tenantId)
      .eq('booking_uid', bookingUid)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check authorization: user must be the attendee or an admin
    const isAttendee = booking.attendee_user_id === user.id
    const isAdmin = ROLE_GROUPS.ADMIN_ROLES.includes(user.role)

    if (!isAttendee && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to cancel this booking' },
        { status: 403 }
      )
    }

    if (booking.status === 'canceled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      )
    }

    // Cancel in Cal.com
    const cfg = getCalcomConfigFromEnv()
    await calcomFetchJson<any>(cfg, {
      method: 'POST',
      path: `/v2/bookings/${encodeURIComponent(bookingUid)}/cancel`,
      body: {
        cancellationReason: reason || 'User requested cancellation',
      },
    })

    // Update local mirror
    const { error: updateError } = await supabase
      .from('nx_scheduler_booking')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Failed to update booking status:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      bookingUid,
    })
  } catch (error) {
    console.error('Schedule cancel error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
