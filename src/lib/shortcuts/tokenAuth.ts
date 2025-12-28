/**
 * Shortcuts Token Authentication
 * Handles token creation, validation, and revocation for iOS Shortcuts API
 */

import { createHash, randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { logShortcutAction, AuditActions } from '@/lib/audit/logger'

export type ShortcutScope = 'today' | 'block-time' | 'create-link' | 'reschedule' | '*'

export interface ShortcutsToken {
  id: string
  tenantId: string
  userId: string
  name: string
  scopes: ShortcutScope[]
  lastUsedAt: Date | null
  revokedAt: Date | null
  createdAt: Date
}

export interface TokenValidationResult {
  valid: boolean
  token?: ShortcutsToken
  error?: string
}

/**
 * Generate a new shortcuts token
 * Returns the plaintext token (only shown once) and the token record
 */
export async function createShortcutsToken(
  tenantId: string,
  userId: string,
  name: string,
  scopes: ShortcutScope[]
): Promise<{ token: string; record: ShortcutsToken }> {
  const supabase = createServiceClient()

  // Generate secure random token (32 bytes = 64 hex chars)
  const plainToken = randomBytes(32).toString('hex')
  const tokenHash = hashToken(plainToken)

  const { data, error } = await supabase
    .from('nx_shortcuts_token')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      token_hash: tokenHash,
      name,
      scopes,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create token: ${error?.message || 'Unknown error'}`)
  }

  const record: ShortcutsToken = {
    id: data.id,
    tenantId: data.tenant_id,
    userId: data.user_id,
    name: data.name,
    scopes: data.scopes,
    lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : null,
    revokedAt: data.revoked_at ? new Date(data.revoked_at) : null,
    createdAt: new Date(data.created_at),
  }

  // Log token creation
  await logShortcutAction(tenantId, record.id, userId, AuditActions.SHORTCUT_TOKEN_CREATED, {
    resourceType: 'token',
    resourceId: record.id,
    metadata: { name, scopes },
  })

  return { token: plainToken, record }
}

/**
 * Validate a token from request header
 */
export async function validateShortcutsToken(
  authHeader: string | null
): Promise<TokenValidationResult> {
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' }
  }

  // Extract token from "Bearer <token>" format
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { valid: false, error: 'Invalid Authorization format. Use: Bearer <token>' }
  }

  const plainToken = parts[1]
  if (!plainToken || plainToken.length < 32) {
    return { valid: false, error: 'Invalid token format' }
  }

  const tokenHash = hashToken(plainToken)
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('nx_shortcuts_token')
    .select('*')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .single()

  if (error || !data) {
    return { valid: false, error: 'Invalid or revoked token' }
  }

  // Update last used timestamp
  await supabase
    .from('nx_shortcuts_token')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  const token: ShortcutsToken = {
    id: data.id,
    tenantId: data.tenant_id,
    userId: data.user_id,
    name: data.name,
    scopes: data.scopes,
    lastUsedAt: new Date(),
    revokedAt: null,
    createdAt: new Date(data.created_at),
  }

  return { valid: true, token }
}

/**
 * Check if token has required scope
 */
export function hasScope(token: ShortcutsToken, requiredScope: ShortcutScope): boolean {
  // Wildcard scope grants all access
  if (token.scopes.includes('*')) {
    return true
  }
  return token.scopes.includes(requiredScope)
}

/**
 * Revoke a token
 */
export async function revokeShortcutsToken(
  tokenId: string,
  userId: string,
  tenantId: string
): Promise<boolean> {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('nx_shortcuts_token')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', tokenId)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to revoke token:', error)
    return false
  }

  // Log token revocation
  await logShortcutAction(tenantId, tokenId, userId, AuditActions.SHORTCUT_TOKEN_REVOKED, {
    resourceType: 'token',
    resourceId: tokenId,
  })

  return true
}

/**
 * List all tokens for a user
 */
export async function listUserTokens(userId: string): Promise<ShortcutsToken[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('nx_shortcuts_token')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    name: row.name,
    scopes: row.scopes,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
    createdAt: new Date(row.created_at),
  }))
}

/**
 * Hash token using SHA256
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Extract request metadata for audit logging
 */
export function extractRequestMetadata(request: Request): {
  ipAddress?: string
  userAgent?: string
} {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    undefined

  const userAgent = request.headers.get('user-agent') || undefined

  return { ipAddress, userAgent }
}
