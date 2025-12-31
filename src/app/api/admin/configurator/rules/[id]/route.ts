import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/api-auth'
import type { RuleType, UpdateRuleRequest } from '@/types/configurator-rules'
import { RULE_TYPE_CATEGORIES } from '@/types/configurator-rules'

// =====================================================
// GET: Fetch Single Configurator Rule (Admin Only)
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, error: authError } = await authenticateAdmin(request)

    if (authError || !supabase || !user) {
      return NextResponse.json(
        { error: authError?.message || 'Authentication failed' },
        { status: authError?.status || 401 }
      )
    }

    const { id: ruleId } = await params

    // Fetch the rule
    const { data: rule, error } = await supabase
      .from('configurator_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('tenant_id', user.tenantId)
      .single()

    if (error || !rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Unexpected error in fetch configurator rule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// PATCH: Update Configurator Rule (Admin Only)
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, error: authError } = await authenticateAdmin(request)

    if (authError || !supabase || !user) {
      return NextResponse.json(
        { error: authError?.message || 'Authentication failed' },
        { status: authError?.status || 401 }
      )
    }

    const { id: ruleId } = await params
    const body: UpdateRuleRequest = await request.json()

    // Verify rule exists and belongs to tenant
    const { data: existingRule, error: fetchError } = await supabase
      .from('configurator_rules')
      .select('id, rule_type, rule_key')
      .eq('id', ruleId)
      .eq('tenant_id', user.tenantId)
      .single()

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      )
    }

    // Validate rule_type if provided
    if (body.rule_type) {
      const validRuleTypes: RuleType[] = [
        ...RULE_TYPE_CATEGORIES.models,
        ...RULE_TYPE_CATEGORIES.accessories,
        ...RULE_TYPE_CATEGORIES.tiedowns,
        ...RULE_TYPE_CATEGORIES.services,
        ...RULE_TYPE_CATEGORIES.delivery,
      ]
      if (!validRuleTypes.includes(body.rule_type)) {
        return NextResponse.json(
          { error: `Invalid rule_type. Must be one of: ${validRuleTypes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate condition and action if provided
    if (body.condition !== undefined && typeof body.condition !== 'object') {
      return NextResponse.json(
        { error: 'condition must be a valid JSON object' },
        { status: 400 }
      )
    }

    if (body.action !== undefined && typeof body.action !== 'object') {
      return NextResponse.json(
        { error: 'action must be a valid JSON object' },
        { status: 400 }
      )
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.rule_type !== undefined) updateData.rule_type = body.rule_type
    if (body.rule_key !== undefined) updateData.rule_key = body.rule_key
    if (body.condition !== undefined) updateData.condition = body.condition
    if (body.action !== undefined) updateData.action = body.action
    if (body.message !== undefined) updateData.message = body.message
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // Check for duplicate rule_key if changing it
    if (body.rule_key || body.rule_type) {
      const { data: duplicate } = await supabase
        .from('configurator_rules')
        .select('id')
        .eq('tenant_id', user.tenantId)
        .eq('rule_type', body.rule_type || existingRule.rule_type)
        .eq('rule_key', body.rule_key || existingRule.rule_key)
        .neq('id', ruleId)
        .single()

      if (duplicate) {
        return NextResponse.json(
          { error: 'A rule with this rule_type and rule_key combination already exists' },
          { status: 409 }
        )
      }
    }

    // Update the rule
    const { data: updatedRule, error: updateError } = await supabase
      .from('configurator_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating configurator rule:', updateError)
      return NextResponse.json(
        { error: 'Failed to update rule' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Rule updated successfully',
      rule: updatedRule,
    })
  } catch (error) {
    console.error('Unexpected error in update configurator rule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE: Delete Configurator Rule (Admin Only)
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, error: authError } = await authenticateAdmin(request)

    if (authError || !supabase || !user) {
      return NextResponse.json(
        { error: authError?.message || 'Authentication failed' },
        { status: authError?.status || 401 }
      )
    }

    const { id: ruleId } = await params

    // Verify rule exists and belongs to tenant
    const { data: existingRule, error: fetchError } = await supabase
      .from('configurator_rules')
      .select('id, rule_key')
      .eq('id', ruleId)
      .eq('tenant_id', user.tenantId)
      .single()

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      )
    }

    // Delete the rule
    const { error: deleteError } = await supabase
      .from('configurator_rules')
      .delete()
      .eq('id', ruleId)

    if (deleteError) {
      console.error('Error deleting configurator rule:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete rule' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Rule deleted successfully',
      deleted_rule_key: existingRule.rule_key,
    })
  } catch (error) {
    console.error('Unexpected error in delete configurator rule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
