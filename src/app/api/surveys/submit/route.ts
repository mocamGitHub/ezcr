import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get tenant from headers or use default
    const tenantSlug = request.headers.get('x-tenant-slug') || 'ezcr-dev'

    // Get tenant_id
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      survey_type,
      session_id,
      order_id,
      customer_id,
      customer_email,
      rating,
      nps_score,
      feedback_text,
      response_data,
    } = body

    // Validate required fields
    if (!survey_type) {
      return NextResponse.json(
        { error: 'survey_type is required' },
        { status: 400 }
      )
    }

    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || undefined
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip') || undefined

    // Insert survey response
    const { data: surveyResponse, error } = await supabase
      .from('survey_responses')
      .insert({
        tenant_id: tenant.id,
        survey_type,
        session_id: session_id || null,
        order_id: order_id || null,
        customer_id: customer_id || null,
        customer_email: customer_email || null,
        rating: rating || null,
        nps_score: nps_score || null,
        feedback_text: feedback_text || null,
        response_data: response_data || null,
        user_agent: userAgent,
        ip_address: ipAddress,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting survey response:', error)
      return NextResponse.json(
        { error: 'Failed to submit survey' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: surveyResponse })
  } catch (error) {
    console.error('Error in survey submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
