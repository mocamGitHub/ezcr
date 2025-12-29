import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/api-auth'
import { fomoBannerCreateSchema, fomoBannerUpdateSchema, validateRequest } from '@/lib/validations/api-schemas'

// GET all FOMO banners for admin management
export async function GET(request: NextRequest) {
  try {
    const { supabase, error: authError } = await authenticateAdmin(request)

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status })
    }

    // Fetch ALL banners for admin (no filtering by enabled/dates)
    const { data, error } = await supabase!
      .from('fomo_banners')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching FOMO banners:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Transform database records to FOMOBannerConfig format
    const banners = (data || []).map((record) => ({
      id: record.id,
      enabled: record.enabled,
      type: record.type,
      message: record.message,
      endDate: record.end_date,
      stockCount: record.stock_count,
      stockThreshold: record.stock_threshold,
      recentPurchases: record.recent_purchases,
      visitorCount: record.visitor_count,
      backgroundColor: record.background_color,
      textColor: record.text_color,
      accentColor: record.accent_color,
      position: record.position,
      dismissible: record.dismissible,
      showIcon: record.show_icon,
      startDate: record.start_date,
      priority: record.priority,
    }))

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Error in FOMO banners API:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

// POST - Create new banner
export async function POST(request: NextRequest) {
  try {
    const { supabase, error: authError } = await authenticateAdmin(request)

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateRequest(fomoBannerCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message, details: validation.error.details },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    const { data, error } = await supabase!
      .from('fomo_banners')
      .insert({
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
        priority: validatedData.priority,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating FOMO banner:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in FOMO banners POST:', error)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}

// PUT - Update existing banner
export async function PUT(request: NextRequest) {
  try {
    const { supabase, error: authError } = await authenticateAdmin(request)

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateRequest(fomoBannerUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message, details: validation.error.details },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    const { data, error } = await supabase!
      .from('fomo_banners')
      .update({
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
        start_date: validatedData.startDate,
        priority: validatedData.priority,
      })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating FOMO banner:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in FOMO banners PUT:', error)
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
  }
}

// DELETE - Remove banner
export async function DELETE(request: NextRequest) {
  try {
    const { supabase, error: authError } = await authenticateAdmin(request)

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: authError.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    const { error } = await supabase!
      .from('fomo_banners')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting FOMO banner:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in FOMO banners DELETE:', error)
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}
