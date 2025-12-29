/**
 * Audit Logger - Records all actions for compliance, security, and debugging
 */

import { NextRequest } from 'next/server'
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
  // Authentication actions
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_FAILED_LOGIN: 'auth.failed_login',

  // Order actions
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_CANCELLED: 'order.cancelled',

  // Inventory actions
  INVENTORY_ADJUSTED: 'inventory.adjusted',

  // Admin actions
  ADMIN_SETTINGS_CHANGED: 'admin.settings_changed',
  ADMIN_USER_ROLE_CHANGED: 'admin.user_role_changed',

  // Security actions
  API_RATE_LIMITED: 'api.rate_limited',
  API_UNAUTHORIZED: 'api.unauthorized',
  API_FORBIDDEN: 'api.forbidden',

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

  // Data actions
  DATA_EXPORTED: 'data.exported',
  DATA_IMPORTED: 'data.imported',

  // Preferences
  PREFS_UPDATED: 'prefs.updated',
} as const

export type AuditAction = typeof AuditActions[keyof typeof AuditActions]

// =====================================================
// REQUEST-BASED HELPERS
// =====================================================

/**
 * Extract client IP from request headers
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  return 'unknown'
}

/**
 * Log an audit event with request context
 */
export async function logRequestAudit(
  request: NextRequest,
  tenantId: string,
  action: string,
  options?: {
    userId?: string
    actorType?: ActorType
    resourceType?: string
    resourceId?: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  return logAuditEvent({
    tenantId,
    userId: options?.userId,
    actorType: options?.actorType || 'user',
    action,
    resourceType: options?.resourceType,
    resourceId: options?.resourceId,
    metadata: {
      ...options?.metadata,
      path: request.nextUrl.pathname,
      method: request.method,
    },
    ipAddress: getClientIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  })
}

/**
 * Log a security event (unauthorized access, rate limiting, etc.)
 */
export async function logSecurityEvent(
  request: NextRequest,
  tenantId: string | undefined,
  action: 'api.unauthorized' | 'api.forbidden' | 'api.rate_limited',
  details?: Record<string, unknown>
): Promise<void> {
  const logData = {
    action,
    path: request.nextUrl.pathname,
    method: request.method,
    ip: getClientIp(request),
    userAgent: request.headers.get('user-agent')?.substring(0, 200),
    timestamp: new Date().toISOString(),
    ...details,
  }

  // Always log security events to console for immediate visibility
  console.warn(`[SECURITY] ${action}:`, JSON.stringify(logData))

  // Also log to database if tenant is known
  if (tenantId) {
    try {
      const supabase = createServiceClient()
      await supabase.from('nx_audit_log').insert({
        tenant_id: tenantId,
        actor_type: 'system',
        action,
        metadata: logData,
        ip_address: getClientIp(request),
        user_agent: request.headers.get('user-agent') || null,
      })
    } catch {
      // Don't fail on logging errors
    }
  }
}

/**
 * Create an audit logger bound to a specific request context
 */
export function createRequestLogger(
  request: NextRequest,
  tenantId: string,
  userId?: string
) {
  return {
    log: (action: string, options?: {
      resourceType?: string
      resourceId?: string
      metadata?: Record<string, unknown>
    }) => logRequestAudit(request, tenantId, action, { userId, ...options }),

    security: (action: 'api.unauthorized' | 'api.forbidden' | 'api.rate_limited', details?: Record<string, unknown>) =>
      logSecurityEvent(request, tenantId, action, details),
  }
}
