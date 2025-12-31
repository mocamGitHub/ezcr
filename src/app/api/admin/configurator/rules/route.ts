import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/api-auth'
import type { RuleType, CreateRuleRequest } from '@/types/configurator-rules'

// =====================================================
// GET: Fetch All Configurator Rules (Admin Only)
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await authenticateAdmin(request)

    if (authError || !supabase || !user) {
      return NextResponse.json(
        { error: authError?.message || 'Authentication failed' },
        { status: authError?.status || 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const ruleType = searchParams.get('rule_type') as RuleType | null
    const isActive = searchParams.get('is_active')
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('configurator_rules')
      .select('*', { count: 'exact' })
      .eq('tenant_id', user.tenantId)

    // Apply rule_type filter
    if (ruleType) {
      query = query.eq('rule_type', ruleType)
    }

    // Apply is_active filter
    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true')
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `rule_key.ilike.%${search}%,message.ilike.%${search}%`
      )
    }

    // Sort by rule_type, then priority
    query = query
      .order('rule_type', { ascending: true })
      .order('priority', { ascending: true })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: rules, count, error } = await query

    if (error) {
      console.error('Error fetching configurator rules:', error)
      return NextResponse.json(
        { error: 'Failed to fetch rules' },
        { status: 500 }
      )
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0

    return NextResponse.json({
      rules: rules || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    })
  } catch (error) {
    console.error('Unexpected error in fetch configurator rules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// POST: Create New Configurator Rule (Admin Only)
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await authenticateAdmin(request)

    if (authError || !supabase || !user) {
      return NextResponse.json(
        { error: authError?.message || 'Authentication failed' },
        { status: authError?.status || 401 }
      )
    }

    // Parse request body
    const body: CreateRuleRequest = await request.json()

    // Validate required fields
    if (!body.rule_type || !body.rule_key || !body.condition || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: rule_type, rule_key, condition, action' },
        { status: 400 }
      )
    }

    // Validate rule_type
    const validRuleTypes: RuleType[] = ['ac001_extension', 'cargo_extension', 'incompatibility', 'recommendation']
    if (!validRuleTypes.includes(body.rule_type)) {
      return NextResponse.json(
        { error: `Invalid rule_type. Must be one of: ${validRuleTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate condition and action are objects
    if (typeof body.condition !== 'object' || typeof body.action !== 'object') {
      return NextResponse.json(
        { error: 'condition and action must be valid JSON objects' },
        { status: 400 }
      )
    }

    // Check for duplicate rule_key
    const { data: existing } = await supabase
      .from('configurator_rules')
      .select('id')
      .eq('tenant_id', user.tenantId)
      .eq('rule_type', body.rule_type)
      .eq('rule_key', body.rule_key)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `Rule with key "${body.rule_key}" already exists for rule_type "${body.rule_type}"` },
        { status: 409 }
      )
    }

    // Insert new rule
    const { data: newRule, error: insertError } = await supabase
      .from('configurator_rules')
      .insert({
        tenant_id: user.tenantId,
        rule_type: body.rule_type,
        rule_key: body.rule_key,
        condition: body.condition,
        action: body.action,
        message: body.message || null,
        priority: body.priority ?? 0,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating configurator rule:', insertError)
      return NextResponse.json(
        { error: 'Failed to create rule' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Rule created successfully',
      rule: newRule,
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in create configurator rule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
