import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole, ROLE_GROUPS } from '@/lib/auth/api-auth'
import { fomoBannerUpdateSchema, validateRequest } from '@/lib/validations/api-schemas'

export async function GET() {
  try {
    const supabase = await createClient()

    // Try to fetch active FOMO banner configuration from database
    const { data, error } = await supabase
      .from('fomo_banners')
      .select('*')
      .eq('enabled', true)
      .gte('end_date', new Date().toISOString())
      .lte('start_date', new Date().toISOString())
      .order('priority', { ascending: true })
      .limit(1)
      .single()

    if (error) {
      // Table might not exist yet or no active banners
      // Return null to use defaults
      return NextResponse.json({ config: null })
    }

    // Transform database record to FOMOBannerConfig format
    const config = {
      id: data.id,
      enabled: data.enabled,
      type: data.type,
      message: data.message,
      endDate: data.end_date,
      stockCount: data.stock_count,
      stockThreshold: data.stock_threshold,
      recentPurchases: data.recent_purchases,
      visitorCount: data.visitor_count,
      backgroundColor: data.background_color,
      textColor: data.text_color,
      accentColor: data.accent_color,
      position: data.position,
      dismissible: data.dismissible,
      showIcon: data.show_icon,
      startDate: data.start_date,
      priority: data.priority,
    }

    return NextResponse.json(
      { config },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  } catch {
    // Return null to use defaults if there's any error
    return NextResponse.json({ config: null })
  }
}

// POST endpoint for admin to create/update FOMO banners
export async function POST(request: NextRequest) {
  // Require admin role
  const authResult = await requireRole(request, ROLE_GROUPS.ADMIN_ROLES)
  if ('error' in authResult) {
    return NextResponse.json(authResult.error, { status: authResult.status })
  }

  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate request body
    const validation = validateRequest(fomoBannerUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message, details: validation.error.details },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    const { data, error } = await supabase
      .from('fomo_banners')
      .upsert({
        id: validatedData.id,
        enabled: validatedData.enabled,
        type: validatedData.type,
        message: validatedData.message,
        end_date: validatedData.endDate,
        stock_count: validatedData.stockCount,
        stock_threshold: validatedData.stockThreshold,
        recent_purchases: validatedData.recentPurchases,
        visitor_count: validatedData.visitorCount,
        background_color: validatedData.backgroundColor,
        text_color: validatedData.textColor,
        accent_color: validatedData.accentColor,
        position: validatedData.position,
        dismissible: validatedData.dismissible,
        show_icon: validatedData.showIcon,
        start_date: validatedData.startDate || new Date().toISOString(),
        priority: validatedData.priority || 1,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save banner' }, { status: 500 })
  }
}
