import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all FOMO banners for admin management
export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch ALL banners for admin (no filtering by enabled/dates)
    const { data, error } = await supabase
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
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('fomo_banners')
      .insert({
        enabled: body.enabled ?? true,
        type: body.type,
        message: body.message,
        end_date: body.endDate,
        stock_count: body.stockCount,
        stock_threshold: body.stockThreshold,
        recent_purchases: body.recentPurchases,
        visitor_count: body.visitorCount,
        background_color: body.backgroundColor,
        text_color: body.textColor,
        accent_color: body.accentColor,
        position: body.position || 'top',
        dismissible: body.dismissible ?? true,
        show_icon: body.showIcon ?? true,
        start_date: body.startDate || new Date().toISOString(),
        priority: body.priority || 1,
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
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('fomo_banners')
      .update({
        enabled: body.enabled,
        type: body.type,
        message: body.message,
        end_date: body.endDate,
        stock_count: body.stockCount,
        stock_threshold: body.stockThreshold,
        recent_purchases: body.recentPurchases,
        visitor_count: body.visitorCount,
        background_color: body.backgroundColor,
        text_color: body.textColor,
        accent_color: body.accentColor,
        position: body.position,
        dismissible: body.dismissible,
        show_icon: body.showIcon,
        start_date: body.startDate,
        priority: body.priority,
      })
      .eq('id', body.id)
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
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    const { error } = await supabase
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
