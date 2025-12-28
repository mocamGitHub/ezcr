import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { getTenantId } from '@/lib/tenant'
import {
  createShortcutsToken,
  listUserTokens,
  revokeShortcutsToken,
  type ShortcutScope,
} from '@/lib/shortcuts/tokenAuth'

const VALID_SCOPES: ShortcutScope[] = ['today', 'block-time', 'create-link', 'reschedule', '*']

/**
 * GET /api/shortcuts/tokens
 * List user's shortcut tokens
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    const tokens = await listUserTokens(user.id)

    // Never expose token hashes, just metadata
    const safeTokens = tokens.map(t => ({
      id: t.id,
      name: t.name,
      scopes: t.scopes,
      lastUsedAt: t.lastUsedAt?.toISOString() || null,
      revokedAt: t.revokedAt?.toISOString() || null,
      createdAt: t.createdAt.toISOString(),
      isActive: !t.revokedAt,
    }))

    return NextResponse.json({
      success: true,
      tokens: safeTokens,
    })
  } catch (error) {
    console.error('Get tokens error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tokens' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/shortcuts/tokens
 * Create a new shortcut token
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    const tenantId = await getTenantId()
    const body = await request.json()
    const { name, scopes } = body

    if (!name || typeof name !== 'string' || name.length < 1) {
      return NextResponse.json(
        { error: 'Token name is required' },
        { status: 400 }
      )
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        { error: 'At least one scope is required' },
        { status: 400 }
      )
    }

    // Validate scopes
    const invalidScopes = scopes.filter(s => !VALID_SCOPES.includes(s))
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { error: `Invalid scopes: ${invalidScopes.join(', ')}. Valid: ${VALID_SCOPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Create token
    const { token, record } = await createShortcutsToken(
      tenantId,
      user.id,
      name,
      scopes as ShortcutScope[]
    )

    return NextResponse.json({
      success: true,
      // IMPORTANT: This is the only time the plaintext token is returned
      token,
      tokenInfo: {
        id: record.id,
        name: record.name,
        scopes: record.scopes,
        createdAt: record.createdAt.toISOString(),
      },
      message: 'Token created. Save it now - it will not be shown again.',
    })
  } catch (error) {
    console.error('Create token error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create token' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shortcuts/tokens
 * Revoke a token
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    const tenantId = await getTenantId()
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('id')

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      )
    }

    const success = await revokeShortcutsToken(tokenId, user.id, tenantId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to revoke token or token not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Token revoked',
    })
  } catch (error) {
    console.error('Revoke token error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to revoke token' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
