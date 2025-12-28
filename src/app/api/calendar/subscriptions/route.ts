import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { getTenantId } from '@/lib/tenant'
import { validateICS, fetchICS } from '@/lib/ical/icsParser'
import { logUserAction, AuditActions } from '@/lib/audit/logger'

/**
 * GET /api/calendar/subscriptions
 * List user's calendar subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { data, error } = await supabase
      .from('nx_external_calendar_subscription')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscriptions: data || [],
    })
  } catch (error) {
    console.error('Get subscriptions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calendar/subscriptions
 * Add a new webcal subscription
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const body = await request.json()
    const { name, webcalUrl, syncFrequencyMinutes = 60 } = body

    if (!webcalUrl || typeof webcalUrl !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid webcalUrl' },
        { status: 400 }
      )
    }

    // Validate the URL is accessible and returns valid ICS
    const { content, error: fetchError } = await fetchICS(webcalUrl)
    if (!content || fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch calendar: ${fetchError}` },
        { status: 400 }
      )
    }

    const validation = validateICS(content)
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid calendar format: ${validation.error}` },
        { status: 400 }
      )
    }

    // Create subscription
    const { data, error } = await supabase
      .from('nx_external_calendar_subscription')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        name: name || 'External Calendar',
        webcal_url: webcalUrl,
        sync_frequency_minutes: Math.max(15, syncFrequencyMinutes), // Minimum 15 minutes
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Log action
    await logUserAction(tenantId, user.id, AuditActions.CALENDAR_SUBSCRIPTION_ADDED, {
      resourceType: 'subscription',
      resourceId: data.id,
      metadata: { name, webcalUrl },
    })

    return NextResponse.json({
      success: true,
      subscription: data,
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/calendar/subscriptions
 * Update a subscription (name, sync frequency)
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const body = await request.json()
    const { id, name, syncFrequencyMinutes } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing subscription id' },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (syncFrequencyMinutes !== undefined) {
      updates.sync_frequency_minutes = Math.max(15, syncFrequencyMinutes)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('nx_external_calendar_subscription')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription: data,
    })
  } catch (error) {
    console.error('Update subscription error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/calendar/subscriptions
 * Remove a subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('id')

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing subscription id' },
        { status: 400 }
      )
    }

    // Delete subscription (cascade deletes events)
    const { error } = await supabase
      .from('nx_external_calendar_subscription')
      .delete()
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Log action
    await logUserAction(tenantId, user.id, AuditActions.CALENDAR_SUBSCRIPTION_REMOVED, {
      resourceType: 'subscription',
      resourceId: subscriptionId,
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Delete subscription error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete subscription' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
