import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // Test 1: Simple select all
    const { data: allTenants, error: allError } = await supabaseAdmin
      .from('tenants')
      .select('*')

    // Test 2: Select by slug
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', 'ezcr')
      .single()

    return NextResponse.json({
      test1_all_tenants: {
        data: allTenants,
        error: allError,
      },
      test2_by_slug: {
        data: tenant,
        error: tenantError,
      },
      env_check: {
        has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_service_key: !!process.env.SUPABASE_SERVICE_KEY,
        service_key_prefix: process.env.SUPABASE_SERVICE_KEY?.substring(0, 20),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
