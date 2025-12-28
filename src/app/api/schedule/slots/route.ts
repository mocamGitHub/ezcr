import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { getTenantId } from '@/lib/tenant'
import { calcomFetchJson, getCalcomConfigFromEnv } from '@/scheduler/calcomServerClient'

/**
 * GET /api/schedule/slots
 * Get available time slots for scheduling
 * Query: purpose, start, end, timeZone
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
    const purpose = searchParams.get('purpose')
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const timeZone = searchParams.get('timeZone') || 'America/New_York'

    if (!purpose || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required parameters: purpose, start, end' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Get scheduler settings for tenant
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

    // Get Cal.com event type ID for this purpose
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

    // Fetch slots from Cal.com
    const cfg = getCalcomConfigFromEnv()
    const data = await calcomFetchJson<{ slots: any[] }>(cfg, {
      path: '/v2/slots/available',
      query: {
        eventTypeId: eventMap.cal_event_type_id,
        startTime: start,
        endTime: end,
        timeZone,
      },
    })

    return NextResponse.json({
      success: true,
      slots: data.slots || data,
      purpose,
      timeZone,
    })
  } catch (error) {
    console.error('Schedule slots error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch slots' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
