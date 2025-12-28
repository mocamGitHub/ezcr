/**
 * Webcal Sync Service
 * Fetches and syncs external calendar subscriptions
 */

import { createServiceClient } from '@/lib/supabase/server'
import { fetchICS, parseICS, diffEvents, type ParsedEvent } from './icsParser'
import { logSystemAction, AuditActions } from '@/lib/audit/logger'

export interface Subscription {
  id: string
  tenantId: string
  userId: string | null
  name: string
  webcalUrl: string
  syncFrequencyMinutes: number
  lastSyncedAt: Date | null
  lastError: string | null
  isActive: boolean
}

export interface SyncResult {
  subscriptionId: string
  success: boolean
  added: number
  updated: number
  deleted: number
  error?: string
}

/**
 * Get all active subscriptions that need syncing
 */
export async function getSubscriptionsDueForSync(): Promise<Subscription[]> {
  const supabase = createServiceClient()

  // Get subscriptions where:
  // - is_active = true
  // - last_synced_at is null OR last_synced_at + sync_frequency < now
  const { data, error } = await supabase
    .from('nx_external_calendar_subscription')
    .select('*')
    .eq('is_active', true)
    .or(`last_synced_at.is.null,last_synced_at.lt.${new Date(Date.now() - 60 * 60 * 1000).toISOString()}`)

  if (error || !data) {
    console.error('Failed to fetch subscriptions:', error)
    return []
  }

  return data.map(mapSubscription)
}

/**
 * Sync a single subscription
 */
export async function syncSubscription(subscription: Subscription): Promise<SyncResult> {
  const supabase = createServiceClient()

  try {
    // Fetch ICS content
    const { content, error: fetchError } = await fetchICS(subscription.webcalUrl)
    if (!content || fetchError) {
      await updateSubscriptionError(subscription.id, fetchError || 'Failed to fetch')
      return {
        subscriptionId: subscription.id,
        success: false,
        added: 0,
        updated: 0,
        deleted: 0,
        error: fetchError,
      }
    }

    // Parse ICS content
    const parseResult = parseICS(content)
    if (!parseResult.success) {
      const errorMsg = parseResult.errors.join('; ')
      await updateSubscriptionError(subscription.id, errorMsg)
      return {
        subscriptionId: subscription.id,
        success: false,
        added: 0,
        updated: 0,
        deleted: 0,
        error: errorMsg,
      }
    }

    // Get existing events for this subscription
    const { data: existingRows } = await supabase
      .from('nx_external_calendar_event')
      .select('external_uid, title, description, start_at, end_at, all_day, location, raw_ical')
      .eq('subscription_id', subscription.id)

    const existingEvents: ParsedEvent[] = (existingRows || []).map((row) => ({
      uid: row.external_uid,
      title: row.title || '',
      description: row.description,
      startAt: new Date(row.start_at),
      endAt: row.end_at ? new Date(row.end_at) : null,
      allDay: row.all_day,
      location: row.location,
      rawIcal: row.raw_ical || '',
    }))

    // Diff events
    const { added, updated, deleted } = diffEvents(existingEvents, parseResult.events)

    // Apply additions
    if (added.length > 0) {
      await supabase.from('nx_external_calendar_event').insert(
        added.map((e) => ({
          subscription_id: subscription.id,
          tenant_id: subscription.tenantId,
          external_uid: e.uid,
          title: e.title,
          description: e.description,
          start_at: e.startAt.toISOString(),
          end_at: e.endAt?.toISOString() || null,
          all_day: e.allDay,
          location: e.location,
          raw_ical: e.rawIcal,
        }))
      )
    }

    // Apply updates
    for (const event of updated) {
      await supabase
        .from('nx_external_calendar_event')
        .update({
          title: event.title,
          description: event.description,
          start_at: event.startAt.toISOString(),
          end_at: event.endAt?.toISOString() || null,
          all_day: event.allDay,
          location: event.location,
          raw_ical: event.rawIcal,
        })
        .eq('subscription_id', subscription.id)
        .eq('external_uid', event.uid)
    }

    // Apply deletions
    if (deleted.length > 0) {
      const deletedUids = deleted.map((e) => e.uid)
      await supabase
        .from('nx_external_calendar_event')
        .delete()
        .eq('subscription_id', subscription.id)
        .in('external_uid', deletedUids)
    }

    // Update subscription status
    await supabase
      .from('nx_external_calendar_subscription')
      .update({
        last_synced_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', subscription.id)

    // Log sync action
    await logSystemAction(subscription.tenantId, AuditActions.CALENDAR_EVENTS_SYNCED, {
      resourceType: 'subscription',
      resourceId: subscription.id,
      metadata: { added: added.length, updated: updated.length, deleted: deleted.length },
    })

    return {
      subscriptionId: subscription.id,
      success: true,
      added: added.length,
      updated: updated.length,
      deleted: deleted.length,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    await updateSubscriptionError(subscription.id, errorMsg)
    return {
      subscriptionId: subscription.id,
      success: false,
      added: 0,
      updated: 0,
      deleted: 0,
      error: errorMsg,
    }
  }
}

/**
 * Sync all due subscriptions
 */
export async function syncAllDueSubscriptions(): Promise<SyncResult[]> {
  const subscriptions = await getSubscriptionsDueForSync()
  const results: SyncResult[] = []

  for (const subscription of subscriptions) {
    const result = await syncSubscription(subscription)
    results.push(result)
  }

  return results
}

/**
 * Import ICS file content directly (one-time import)
 */
export async function importICSFile(
  tenantId: string,
  userId: string,
  name: string,
  icsContent: string
): Promise<{ success: boolean; imported: number; error?: string }> {
  const supabase = createServiceClient()

  // Parse ICS content
  const parseResult = parseICS(icsContent)
  if (!parseResult.success) {
    return {
      success: false,
      imported: 0,
      error: parseResult.errors.join('; '),
    }
  }

  // Create a one-time subscription record (inactive, just for tracking)
  const { data: subscription, error: subError } = await supabase
    .from('nx_external_calendar_subscription')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      name: name || parseResult.calendarName || 'Imported Calendar',
      webcal_url: 'file://imported',
      is_active: false, // One-time import, not a recurring subscription
      last_synced_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (subError || !subscription) {
    return {
      success: false,
      imported: 0,
      error: `Failed to create import record: ${subError?.message}`,
    }
  }

  // Insert events
  if (parseResult.events.length > 0) {
    const { error: insertError } = await supabase.from('nx_external_calendar_event').insert(
      parseResult.events.map((e) => ({
        subscription_id: subscription.id,
        tenant_id: tenantId,
        external_uid: e.uid,
        title: e.title,
        description: e.description,
        start_at: e.startAt.toISOString(),
        end_at: e.endAt?.toISOString() || null,
        all_day: e.allDay,
        location: e.location,
        raw_ical: e.rawIcal,
      }))
    )

    if (insertError) {
      return {
        success: false,
        imported: 0,
        error: `Failed to import events: ${insertError.message}`,
      }
    }
  }

  // Log import action
  await logSystemAction(tenantId, AuditActions.CALENDAR_ICS_IMPORTED, {
    resourceType: 'subscription',
    resourceId: subscription.id,
    metadata: { eventCount: parseResult.events.length, calendarName: parseResult.calendarName },
  })

  return {
    success: true,
    imported: parseResult.events.length,
  }
}

/**
 * Get external events for a time range (for availability blocking)
 */
export async function getExternalEventsInRange(
  tenantId: string,
  userId: string | null,
  startDate: Date,
  endDate: Date
): Promise<ParsedEvent[]> {
  const supabase = createServiceClient()

  let query = supabase
    .from('nx_external_calendar_event')
    .select(`
      external_uid,
      title,
      description,
      start_at,
      end_at,
      all_day,
      location,
      raw_ical,
      nx_external_calendar_subscription!inner(tenant_id, user_id)
    `)
    .eq('tenant_id', tenantId)
    .gte('start_at', startDate.toISOString())
    .lte('start_at', endDate.toISOString())

  if (userId) {
    query = query.eq('nx_external_calendar_subscription.user_id', userId)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('Failed to fetch external events:', error)
    return []
  }

  return data.map((row) => ({
    uid: row.external_uid,
    title: row.title || '',
    description: row.description,
    startAt: new Date(row.start_at),
    endAt: row.end_at ? new Date(row.end_at) : null,
    allDay: row.all_day,
    location: row.location,
    rawIcal: row.raw_ical || '',
  }))
}

// Helper functions

async function updateSubscriptionError(subscriptionId: string, error: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('nx_external_calendar_subscription')
    .update({ last_error: error })
    .eq('id', subscriptionId)
}

function mapSubscription(row: Record<string, unknown>): Subscription {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    userId: row.user_id as string | null,
    name: row.name as string,
    webcalUrl: row.webcal_url as string,
    syncFrequencyMinutes: row.sync_frequency_minutes as number,
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at as string) : null,
    lastError: row.last_error as string | null,
    isActive: row.is_active as boolean,
  }
}
