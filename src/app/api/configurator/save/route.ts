import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import type { ConfigData } from '@/types/configurator-v2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { configuration, total, userId } = body as {
      configuration: ConfigData
      total: number
      userId?: string
    }

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    // Generate a unique session ID
    const sessionId = `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Build configuration name
    const configName = `${configuration.selectedModel.name} - ${configuration.vehicle || 'Unknown'} - ${
      configuration.contact.firstName || 'Guest'
    } ${configuration.contact.lastName || ''}`

    // Save configuration to database
    const { data: savedConfig, error: configError } = await supabase
      .from('product_configurations')
      .insert({
        tenant_id: tenantId,
        session_id: sessionId,
        user_id: userId || null,
        product_id: null, // v2 configurator creates custom bundles
        name: configName.trim(),
        configuration: configuration,
        calculated_price: total,
        is_saved: true,
      })
      .select()
      .single()

    if (configError) {
      console.error('Error saving configuration:', configError)
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      configuration: savedConfig,
      message: 'Configuration saved successfully',
    })
  } catch (error) {
    console.error('Configuration save error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve saved configurations for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')

    const supabase = createServiceClient()
    const tenantId = await getTenantId()

    let query = supabase
      .from('product_configurations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_saved', true)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data: configurations, error: configError } = await query

    if (configError) {
      console.error('Error fetching configurations:', configError)
      return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 })
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
