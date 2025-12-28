import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { getTenantId } from '@/lib/tenant'
import { syncSubscription, type Subscription } from '@/lib/ical/webcalSync'

/**
 * POST /api/calendar/subscriptions/[id]/sync
 * Trigger a manual sync for a subscription
 */
export async function POST(
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

    // Get subscription and verify ownership
    const { data: subData, error: subError } = await supabase
      .from('nx_external_calendar_subscription')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .single()

    if (subError || !subData) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Map to Subscription type
    const subscription: Subscription = {
      id: subData.id,
      tenantId: subData.tenant_id,
      userId: subData.user_id,
      name: subData.name,
      webcalUrl: subData.webcal_url,
      syncFrequencyMinutes: subData.sync_frequency_minutes,
      lastSyncedAt: subData.last_synced_at ? new Date(subData.last_synced_at) : null,
      lastError: subData.last_error,
      isActive: subData.is_active,
    }

    // Trigger sync
    const result = await syncSubscription(subscription)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      )
    }

    // Fetch updated subscription data
    const { data: updated } = await supabase
      .from('nx_external_calendar_subscription')
      .select('*')
      .eq('id', subscriptionId)
      .single()

    return NextResponse.json({
      success: true,
      added: result.added,
      updated: result.updated,
      deleted: result.deleted,
      subscription: updated,
    })
  } catch (error) {
    console.error('Sync subscription error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync subscription' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
