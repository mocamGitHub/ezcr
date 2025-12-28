/**
 * Search Sync Service
 * Syncs data from Supabase to local search index
 */

import { createClient } from '@/lib/supabase/client'
import {
  getSearchIndex,
  bookingToSearchable,
  eventTypeToSearchable,
  templateToSearchable,
  type SearchableItem,
} from './searchIndex'

/**
 * Sync all searchable data from Supabase
 */
export async function syncSearchIndex(tenantId: string): Promise<{
  success: boolean
  counts: { bookings: number; eventTypes: number; templates: number }
  error?: string
}> {
  const supabase = createClient()
  const index = getSearchIndex()
  const items: SearchableItem[] = []

  try {
    // Fetch bookings (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: bookings, error: bookingsError } = await supabase
      .from('nx_scheduler_booking')
      .select('id, title, attendee_email, start_at, status')
      .eq('tenant_id', tenantId)
      .gte('start_at', thirtyDaysAgo.toISOString())
      .order('start_at', { ascending: false })

    if (bookingsError) {
      console.warn('Failed to fetch bookings for search:', bookingsError)
    } else if (bookings) {
      for (const booking of bookings) {
        items.push(bookingToSearchable(booking))
      }
    }

    // Fetch event types
    const { data: eventTypes, error: eventTypesError } = await supabase
      .from('nx_scheduler_event_type_map')
      .select('id, purpose, cal_event_type_id')
      .eq('tenant_id', tenantId)
      .eq('is_enabled', true)

    if (eventTypesError) {
      console.warn('Failed to fetch event types for search:', eventTypesError)
    } else if (eventTypes) {
      for (const eventType of eventTypes) {
        items.push(eventTypeToSearchable(eventType))
      }
    }

    // Fetch notification templates
    const { data: templates, error: templatesError } = await supabase
      .from('nx_notification_template')
      .select('id, name, event_type, channel')
      .eq('tenant_id', tenantId)

    if (templatesError) {
      console.warn('Failed to fetch templates for search:', templatesError)
    } else if (templates) {
      for (const template of templates) {
        items.push(templateToSearchable(template))
      }
    }

    // Add all items to the index
    index.addItems(items)
    index.setLastSyncTime(new Date())

    return {
      success: true,
      counts: {
        bookings: bookings?.length || 0,
        eventTypes: eventTypes?.length || 0,
        templates: templates?.length || 0,
      },
    }
  } catch (error) {
    return {
      success: false,
      counts: { bookings: 0, eventTypes: 0, templates: 0 },
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if sync is needed (older than 15 minutes)
 */
export function isSyncNeeded(): boolean {
  const index = getSearchIndex()
  const lastSync = index.lastSync

  if (!lastSync) {
    return true
  }

  const fifteenMinutesAgo = new Date()
  fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15)

  return lastSync < fifteenMinutesAgo
}

/**
 * Clear the search index
 */
export function clearSearchIndex(): void {
  const index = getSearchIndex()
  index.clear()
}
