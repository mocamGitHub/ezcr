import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { getTenantId } from '@/lib/tenant'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * GET /api/search
 * Server-side search for sync with local index
 * Query: q (search term), type (optional filter), limit (default 50)
 */
export async function GET(request: NextRequest) {
  // Rate limit: 30 requests per minute for search endpoints
  const rateLimit = withRateLimit(request, RATE_LIMITS.search)
  if (rateLimit.limited) {
    return rateLimit.response
  }

  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const since = searchParams.get('since') // ISO date for incremental sync

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const results: {
      bookings: unknown[]
      eventTypes: unknown[]
      templates: unknown[]
    } = {
      bookings: [],
      eventTypes: [],
      templates: [],
    }

    // Build time filter
    const sinceDate = since ? new Date(since) : null
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Search bookings
    if (!type || type === 'booking') {
      let bookingsQuery = supabase
        .from('nx_scheduler_booking')
        .select('id, booking_uid, title, attendee_email, start_at, status')
        .eq('tenant_id', tenantId)
        .gte('start_at', thirtyDaysAgo.toISOString())
        .order('start_at', { ascending: false })
        .limit(limit)

      if (sinceDate) {
        bookingsQuery = bookingsQuery.gt('updated_at', sinceDate.toISOString())
      }

      if (query) {
        bookingsQuery = bookingsQuery.or(`title.ilike.%${query}%,attendee_email.ilike.%${query}%`)
      }

      const { data } = await bookingsQuery
      results.bookings = data || []
    }

    // Search event types
    if (!type || type === 'event_type') {
      let eventTypesQuery = supabase
        .from('nx_scheduler_event_type_map')
        .select('id, purpose, cal_event_type_id, is_enabled')
        .eq('tenant_id', tenantId)
        .eq('is_enabled', true)
        .limit(limit)

      if (sinceDate) {
        eventTypesQuery = eventTypesQuery.gt('updated_at', sinceDate.toISOString())
      }

      if (query) {
        eventTypesQuery = eventTypesQuery.ilike('purpose', `%${query}%`)
      }

      const { data } = await eventTypesQuery
      results.eventTypes = data || []
    }

    // Search templates
    if (!type || type === 'template') {
      let templatesQuery = supabase
        .from('nx_notification_template')
        .select('id, name, event_type, channel')
        .eq('tenant_id', tenantId)
        .limit(limit)

      if (query) {
        templatesQuery = templatesQuery.or(`name.ilike.%${query}%,event_type.ilike.%${query}%`)
      }

      const { data } = await templatesQuery
      results.templates = data || []
    }

    return NextResponse.json({
      success: true,
      query,
      results,
      counts: {
        bookings: results.bookings.length,
        eventTypes: results.eventTypes.length,
        templates: results.templates.length,
        total: results.bookings.length + results.eventTypes.length + results.templates.length,
      },
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
