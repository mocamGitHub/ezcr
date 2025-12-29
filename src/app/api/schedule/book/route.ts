import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { getTenantId } from '@/lib/tenant'
import { calcomFetchJson, getCalcomConfigFromEnv } from '@/scheduler/calcomServerClient'
import { scheduleBookingSchema, validateRequest } from '@/lib/validations/api-schemas'

/**
 * POST /api/schedule/book
 * Book an appointment
 * Body: { purpose, start, timeZone, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    // Parse and validate request body
    const body = await request.json().catch(() => ({}))
    const validation = validateRequest(scheduleBookingSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message, details: validation.error.details },
        { status: 400 }
      )
    }

    const { purpose, start, timeZone, notes } = validation.data

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Get scheduler settings
    const { data: settings, error: settingsError } = await supabase
      .from('nx_scheduler_settings')
      .select('organization_slug, is_enabled')
      .eq('tenant_id', tenantId)
      .single()

    if (settingsError || !settings?.organization_slug) {
      return NextResponse.json(
        { error: 'Scheduler not configured for this tenant' },
        { status: 400 }
      )
    }

    // Get Cal.com event type ID
    const { data: eventMap, error: eventMapError } = await supabase
      .from('nx_scheduler_event_type_map')
      .select('cal_event_type_id')
      .eq('tenant_id', tenantId)
      .eq('purpose', purpose)
      .single()

    if (eventMapError || !eventMap?.cal_event_type_id) {
      return NextResponse.json(
        { error: `Event type not found for purpose: ${purpose}` },
        { status: 400 }
      )
    }

    // Get user profile for attendee info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', user.id)
      .single()

    const attendeeName = profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email
      : user.email

    // Create booking in Cal.com
    // Note: Cal.com metadata has strict limits (50 keys, 40 char keys, 500 char values)
    // Keep Cal.com metadata minimal - we store full details locally
    const cfg = getCalcomConfigFromEnv()
    const booking = await calcomFetchJson<any>(cfg, {
      method: 'POST',
      path: '/v2/bookings',
      body: {
        eventTypeId: eventMap.cal_event_type_id,
        start,
        attendee: {
          name: attendeeName,
          email: user.email,
          timeZone,
          language: 'en',
        },
        metadata: {
          purpose,
          notes: notes ? notes.slice(0, 500) : undefined,
        },
      },
    })

    // Mirror booking to local database
    const bookingUid = booking.uid || booking.id || `local-${Date.now()}`
    const { error: insertError } = await supabase
      .from('nx_scheduler_booking')
      .insert({
        tenant_id: tenantId,
        attendee_user_id: user.id,
        booking_uid: bookingUid,
        cal_event_type_id: eventMap.cal_event_type_id,
        start_at: start,
        end_at: booking.endTime || null,
        status: 'scheduled',
        attendee_email: user.email,
        title: `${purpose} - ${attendeeName}`,
        metadata: {
          purpose,
          notes: notes || null,
          attendee_name: attendeeName,
          attendee_phone: profile?.phone || null,
        },
      })

    if (insertError) {
      console.error('Failed to mirror booking:', insertError)
      // Don't fail the request - Cal.com booking succeeded
    }

    return NextResponse.json({
      success: true,
      booking: {
        uid: bookingUid,
        start,
        purpose,
        status: 'scheduled',
      },
    })
  } catch (error) {
    console.error('Schedule book error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to book appointment' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
