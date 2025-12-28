import { NextRequest, NextResponse } from 'next/server'
import { syncAllDueSubscriptions } from '@/lib/ical/webcalSync'

/**
 * POST /api/cron/webcal-refresh
 * Cron endpoint to refresh all webcal subscriptions
 *
 * Secured via secret header or Vercel cron signature
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.WEBCAL_REFRESH_SECRET || process.env.CRON_SECRET

    // Check for Vercel cron authorization
    const vercelCronAuth = request.headers.get('x-vercel-cron-auth')
    const isVercelCron = vercelCronAuth === process.env.CRON_SECRET

    // Check for manual invocation with secret
    const isManualAuth = authHeader === `Bearer ${cronSecret}` && cronSecret

    if (!isVercelCron && !isManualAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Sync all due subscriptions
    const results = await syncAllDueSubscriptions()

    // Summarize results
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      eventsAdded: results.reduce((sum, r) => sum + r.added, 0),
      eventsUpdated: results.reduce((sum, r) => sum + r.updated, 0),
      eventsDeleted: results.reduce((sum, r) => sum + r.deleted, 0),
    }

    console.log('[Webcal Refresh]', summary)

    return NextResponse.json({
      success: true,
      summary,
      results: results.map(r => ({
        subscriptionId: r.subscriptionId,
        success: r.success,
        added: r.added,
        updated: r.updated,
        deleted: r.deleted,
        error: r.error,
      })),
    })
  } catch (error) {
    console.error('Webcal refresh error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refresh failed' },
      { status: 500 }
    )
  }
}

// Also support GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request)
}

export const dynamic = 'force-dynamic'
