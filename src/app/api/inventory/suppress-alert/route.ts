import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// ============================================
// API: Toggle Inventory Alert Suppression
// POST /api/inventory/suppress-alert
// ============================================

interface ToggleAlertRequest {
  productId: string
  alertType: 'low_stock' | 'out_of_stock'
  suppress: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: ToggleAlertRequest = await request.json()
    const { productId, alertType, suppress } = body

    // Validate input
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    if (!['low_stock', 'out_of_stock'].includes(alertType)) {
      return NextResponse.json(
        { error: 'Invalid alert type. Use "low_stock" or "out_of_stock"' },
        { status: 400 }
      )
    }

    // Create authenticated Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role (must be admin or inventory manager)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'inventory_manager'].includes(profile.role || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Requires admin or inventory_manager role.' },
        { status: 403 }
      )
    }

    // Update the product
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (alertType === 'low_stock') {
      updateData.suppress_low_stock_alert = suppress
      updateData.low_stock_alert_suppressed_at = suppress ? new Date().toISOString() : null
      updateData.low_stock_alert_suppressed_by = suppress ? user.id : null
    } else {
      updateData.suppress_out_of_stock_alert = suppress
      updateData.out_of_stock_alert_suppressed_at = suppress ? new Date().toISOString() : null
      updateData.out_of_stock_alert_suppressed_by = suppress ? user.id : null
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select('id, name, suppress_low_stock_alert, suppress_out_of_stock_alert')
      .single()

    if (error) {
      console.error('Error updating alert suppression:', error)
      return NextResponse.json({ error: 'Failed to update alert settings' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      product,
      message: `${alertType === 'low_stock' ? 'Low stock' : 'Out of stock'} alert ${suppress ? 'suppressed' : 'enabled'} for ${product.name}`,
    })
  } catch (error: any) {
    console.error('Suppress alert error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to check suppression status for a product
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      suppress_low_stock_alert,
      suppress_out_of_stock_alert,
      low_stock_alert_suppressed_at,
      out_of_stock_alert_suppressed_at
    `)
    .eq('id', productId)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json({ product })
}
