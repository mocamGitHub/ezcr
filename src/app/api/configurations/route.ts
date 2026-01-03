import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentTenant } from '@/lib/tenant'
import type { ConfiguratorData } from '@/types/configurator'

/**
 * Get or generate a session ID for the configurator
 * Priority: 1) From request body, 2) From authenticated user, 3) Generate new UUID
 */
async function getSessionId(body: { sessionId?: string }): Promise<string> {
  // 1. Check if client sent a session ID
  if (body.sessionId && typeof body.sessionId === 'string') {
    return body.sessionId
  }

  // 2. Try to get authenticated user's ID
  try {
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

    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
      return `user-${user.id}`
    }
  } catch {
    // Not authenticated, continue to generate
  }

  // 3. Generate a new UUID as fallback
  return crypto.randomUUID()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { configuration, calculatedPrice, sessionId: clientSessionId } = body as {
      configuration: ConfiguratorData
      calculatedPrice: number
      sessionId?: string
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

    // Get session ID from client, authenticated user, or generate new one
    const session_id = await getSessionId({ sessionId: clientSessionId })

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
