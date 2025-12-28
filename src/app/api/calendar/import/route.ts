import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { getTenantId } from '@/lib/tenant'
import { importICSFile } from '@/lib/ical/webcalSync'
import { validateICS } from '@/lib/ical/icsParser'

/**
 * POST /api/calendar/import
 * Import ICS file content
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }
    const { user } = authResult

    const tenantId = await getTenantId()

    // Parse request body
    const body = await request.json()
    const { name, icsContent } = body

    if (!icsContent || typeof icsContent !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid icsContent' },
        { status: 400 }
      )
    }

    // Validate ICS content
    const validation = validateICS(icsContent)
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid ICS content: ${validation.error}` },
        { status: 400 }
      )
    }

    // Import the ICS file
    const result = await importICSFile(
      tenantId,
      user.id,
      name || 'Imported Calendar',
      icsContent
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Import failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imported: result.imported,
      message: `Successfully imported ${result.imported} events`,
    })
  } catch (error) {
    console.error('Calendar import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
