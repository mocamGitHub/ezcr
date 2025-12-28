import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { getTenantId } from '@/lib/tenant'

/**
 * GET /api/calendar/subscriptions/[id]/events
 * Get events for a specific subscription
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    const { id: subscriptionId } = await params
    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Verify subscription belongs to user
    const { data: subscription, error: subError } = await supabase
      .from('nx_external_calendar_subscription')
      .select('id')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Get query params for pagination and filtering
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')
    const upcoming = searchParams.get('upcoming') === 'true'

    let query = supabase
      .from('nx_external_calendar_event')
      .select('id, external_uid, title, description, start_at, end_at, all_day, location', { count: 'exact' })
      .eq('subscription_id', subscriptionId)
      .eq('tenant_id', tenantId)
      .order('start_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (upcoming) {
      query = query.gte('start_at', new Date().toISOString())
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      events: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Get subscription events error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
