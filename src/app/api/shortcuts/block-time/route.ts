import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateShortcutsToken, hasScope, extractRequestMetadata } from '@/lib/shortcuts/tokenAuth'
import { logShortcutAction, AuditActions } from '@/lib/audit/logger'

/**
 * POST /api/shortcuts/block-time
 * Create a time block (external event) to mark time as busy
 * Scope required: 'block-time' or '*'
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
    if (!hasScope(token, 'block-time')) {
      return NextResponse.json(
        { error: 'Token does not have "block-time" scope' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, startTime, endTime, description } = body

    // Validate required fields
    if (!startTime) {
      return NextResponse.json(
        { error: 'Missing required field: startTime' },
        { status: 400 }
      )
    }

    const startAt = new Date(startTime)
    const endAt = endTime ? new Date(endTime) : new Date(startAt.getTime() + 60 * 60 * 1000) // Default 1 hour

    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // First, ensure user has a "manual blocks" subscription
    let { data: subscription } = await supabase
      .from('nx_external_calendar_subscription')
      .select('id')
      .eq('tenant_id', token.tenantId)
      .eq('user_id', token.userId)
      .eq('name', 'Manual Time Blocks')
      .single()

    if (!subscription) {
      // Create the subscription
      const { data: newSub, error: subError } = await supabase
        .from('nx_external_calendar_subscription')
        .insert({
          tenant_id: token.tenantId,
          user_id: token.userId,
          name: 'Manual Time Blocks',
          webcal_url: 'manual://blocks',
          is_active: false, // Not a real subscription
        })
        .select()
        .single()

      if (subError) {
        return NextResponse.json(
          { error: `Failed to create block container: ${subError.message}` },
          { status: 500 }
        )
      }
      subscription = newSub
    }

    // Create the time block as an external event
    const blockId = crypto.randomUUID()
    const { data: block, error: blockError } = await supabase
      .from('nx_external_calendar_event')
      .insert({
        subscription_id: subscription.id,
        tenant_id: token.tenantId,
        external_uid: `block-${blockId}`,
        title: title || 'Blocked Time',
        description: description || 'Created via iOS Shortcut',
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        all_day: false,
      })
      .select()
      .single()

    if (blockError) {
      return NextResponse.json(
        { error: `Failed to create block: ${blockError.message}` },
        { status: 500 }
      )
    }

    // Log action
    const { ipAddress, userAgent } = extractRequestMetadata(request)
    await logShortcutAction(token.tenantId, token.id, token.userId, AuditActions.SHORTCUT_BLOCK_TIME, {
      resourceType: 'time_block',
      resourceId: block.id,
      metadata: { title, startTime: startAt.toISOString(), endTime: endAt.toISOString() },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      block: {
        id: block.id,
        title: block.title,
        startTime: block.start_at,
        endTime: block.end_at,
      },
    })
  } catch (error) {
    console.error('Shortcuts block-time error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create block' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
