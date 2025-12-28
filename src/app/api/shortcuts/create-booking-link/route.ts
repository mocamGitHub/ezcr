import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateShortcutsToken, hasScope, extractRequestMetadata } from '@/lib/shortcuts/tokenAuth'
import { logShortcutAction, AuditActions } from '@/lib/audit/logger'

/**
 * POST /api/shortcuts/create-booking-link
 * Generate a booking link for a specific event type
 * Scope required: 'create-link' or '*'
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
    if (!hasScope(token, 'create-link')) {
      return NextResponse.json(
        { error: 'Token does not have "create-link" scope' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { purpose, name, email, notes } = body

    if (!purpose) {
      return NextResponse.json(
        { error: 'Missing required field: purpose' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get scheduler settings
    const { data: settings } = await supabase
      .from('nx_scheduler_settings')
      .select('organization_slug')
      .eq('tenant_id', token.tenantId)
      .single()

    if (!settings?.organization_slug) {
      return NextResponse.json(
        { error: 'Scheduler not configured for this tenant' },
        { status: 400 }
      )
    }

    // Get event type mapping
    const { data: eventMap } = await supabase
      .from('nx_scheduler_event_type_map')
      .select('cal_event_type_id, purpose')
      .eq('tenant_id', token.tenantId)
      .eq('purpose', purpose)
      .eq('is_enabled', true)
      .single()

    if (!eventMap) {
      return NextResponse.json(
        { error: `Event type not found for purpose: ${purpose}` },
        { status: 404 }
      )
    }

    // Build Cal.com booking link
    // Format: https://cal.com/{org}/{eventType}?name=...&email=...&notes=...
    const baseUrl = `https://cal.com/${settings.organization_slug}`
    const eventSlug = purpose.toLowerCase().replace(/_/g, '-')

    const params = new URLSearchParams()
    if (name) params.set('name', name)
    if (email) params.set('email', email)
    if (notes) params.set('notes', notes)

    const bookingUrl = params.toString()
      ? `${baseUrl}/${eventSlug}?${params.toString()}`
      : `${baseUrl}/${eventSlug}`

    // Log action
    const { ipAddress, userAgent } = extractRequestMetadata(request)
    await logShortcutAction(token.tenantId, token.id, token.userId, AuditActions.SHORTCUT_CREATE_LINK, {
      metadata: { purpose, name, email },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      bookingUrl,
      purpose,
      eventTypeId: eventMap.cal_event_type_id,
    })
  } catch (error) {
    console.error('Shortcuts create-booking-link error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create link' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
