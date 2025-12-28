/**
 * Audit Logger - Records all scheduler actions for compliance and debugging
 */

import { createServiceClient } from '@/lib/supabase/server'

export type ActorType = 'user' | 'shortcut' | 'system' | 'webhook'

export interface AuditLogEntry {
  tenantId: string
  userId?: string
  actorType: ActorType
  actorId?: string
  action: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an action to the audit trail
 * Uses service client to bypass RLS
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createServiceClient()

    await supabase.from('nx_audit_log').insert({
      tenant_id: entry.tenantId,
      user_id: entry.userId || null,
      actor_type: entry.actorType,
      actor_id: entry.actorId || null,
      action: entry.action,
      resource_type: entry.resourceType || null,
      resource_id: entry.resourceId || null,
      metadata: entry.metadata || {},
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
    })
  } catch (error) {
    // Log to console but don't throw - audit should never break main flow
    console.error('[Audit] Failed to log event:', error, entry)
  }
}

/**
 * Convenience wrapper for user actions
 */
export async function logUserAction(
  tenantId: string,
  userId: string,
  action: string,
  options?: {
    resourceType?: string
    resourceId?: string
    metadata?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  return logAuditEvent({
    tenantId,
    userId,
    actorType: 'user',
    action,
    ...options,
  })
}

/**
 * Convenience wrapper for shortcut actions
 */
export async function logShortcutAction(
  tenantId: string,
  tokenId: string,
  userId: string,
  action: string,
  options?: {
    resourceType?: string
    resourceId?: string
    metadata?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  return logAuditEvent({
    tenantId,
    userId,
    actorType: 'shortcut',
    actorId: tokenId,
    action,
    ...options,
  })
}

/**
 * Convenience wrapper for system actions
 */
export async function logSystemAction(
  tenantId: string,
  action: string,
  options?: {
    resourceType?: string
    resourceId?: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  return logAuditEvent({
    tenantId,
    actorType: 'system',
    action,
    ...options,
  })
}

/**
 * Common audit actions
 */
export const AuditActions = {
  // Booking actions
  BOOKING_CREATED: 'booking.created',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_RESCHEDULED: 'booking.rescheduled',

  // Calendar actions
  CALENDAR_SUBSCRIPTION_ADDED: 'calendar.subscription.added',
  CALENDAR_SUBSCRIPTION_REMOVED: 'calendar.subscription.removed',
  CALENDAR_EVENTS_SYNCED: 'calendar.events.synced',
  CALENDAR_ICS_IMPORTED: 'calendar.ics.imported',

  // Shortcuts actions
  SHORTCUT_TOKEN_CREATED: 'shortcut.token.created',
  SHORTCUT_TOKEN_REVOKED: 'shortcut.token.revoked',
  SHORTCUT_BLOCK_TIME: 'shortcut.block_time',
  SHORTCUT_CREATE_LINK: 'shortcut.create_link',
  SHORTCUT_RESCHEDULE: 'shortcut.reschedule',

  // Preferences
  PREFS_UPDATED: 'prefs.updated',
} as const

export type AuditAction = typeof AuditActions[keyof typeof AuditActions]
