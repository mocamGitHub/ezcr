import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentTenant } from '@/lib/tenant'
import type { ConfiguratorData } from '@/types/configurator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { configuration, calculatedPrice } = body as {
      configuration: ConfiguratorData
      calculatedPrice: number
    }

    // Get tenant ID from environment-aware configuration
    const tenantSlug = getCurrentTenant()
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (tenantError || !tenant) {
      console.error('Error fetching tenant:', tenantError)
      return NextResponse.json(
        { error: 'Tenant configuration error' },
        { status: 500 }
      )
    }

    const TENANT_ID = tenant.id

    // See ezcr-e48: Get session_id from cookies instead of temp value
    const session_id = 'temp-session-' + Date.now()

    // Get product ID for the selected ramp model
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('sku', configuration.step4.rampModel)
      .single()

    if (productError) {
      console.error('Error fetching product:', productError)
    }

    const product_id = product?.id || null

    // Save configuration
    const { data: savedConfig, error: configError } = await supabaseAdmin
      .from('product_configurations')
      .insert({
        tenant_id: TENANT_ID,
        session_id: session_id,
        product_id: product_id,
        name: `${configuration.step4.rampModel} Configuration`,
        configuration: configuration,
        calculated_price: calculatedPrice,
        is_saved: true,
      })
      .select()
      .single()

    if (configError) {
      console.error('Error saving configuration:', configError)
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      configuration: savedConfig,
    })
  } catch (error) {
    console.error('Configuration save error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve saved configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const session_id = searchParams.get('session_id')
    const user_id = searchParams.get('user_id')

    // Get tenant ID from environment-aware configuration
    const tenantSlug = getCurrentTenant()
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant configuration error' },
        { status: 500 }
      )
    }

    const TENANT_ID = tenant.id

    let query = supabaseAdmin
      .from('product_configurations')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('is_saved', true)
      .order('created_at', { ascending: false })

    if (session_id) {
      query = query.eq('session_id', session_id)
    }

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: configurations, error: configError } = await query

    if (configError) {
      console.error('Error fetching configurations:', configError)
      return NextResponse.json(
        { error: 'Failed to fetch configurations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      configurations: configurations || [],
    })
  } catch (error) {
    console.error('Configuration fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
