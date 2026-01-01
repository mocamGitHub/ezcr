import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/api-auth'
import type { RuleType } from '@/types/configurator-rules'
import { RULE_TYPE_CATEGORIES } from '@/types/configurator-rules'

interface BatchRuleRequest {
  ruleType: RuleType
  ruleKey: string
  condition: Record<string, unknown>
  action: Record<string, unknown>
  message: string | null
  priority: number
}

interface BatchCreateRequest {
  rules: BatchRuleRequest[]
  packId?: string // Optional: track which pack created these rules
}

// =====================================================
// POST: Batch Create Configurator Rules (Admin Only)
// Creates multiple rules in a single transaction
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
    const body: BatchCreateRequest = await request.json()

    // Validate rules array
    if (!body.rules || !Array.isArray(body.rules) || body.rules.length === 0) {
      return NextResponse.json(
        { error: 'rules must be a non-empty array' },
        { status: 400 }
      )
    }

    // Limit batch size
    if (body.rules.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 rules per batch' },
        { status: 400 }
      )
    }

    // Valid rule types
    const validRuleTypes: RuleType[] = [
      ...RULE_TYPE_CATEGORIES.models,
      ...RULE_TYPE_CATEGORIES.accessories,
      ...RULE_TYPE_CATEGORIES.tiedowns,
      ...RULE_TYPE_CATEGORIES.services,
      ...RULE_TYPE_CATEGORIES.delivery,
    ]

    // Validate each rule
    const errors: string[] = []
    const rulesToInsert = body.rules.map((rule, index) => {
      // Validate required fields
      if (!rule.ruleType || !rule.ruleKey || !rule.condition || !rule.action) {
        errors.push(`Rule ${index + 1}: Missing required fields (ruleType, ruleKey, condition, action)`)
        return null
      }

      // Validate rule_type
      if (!validRuleTypes.includes(rule.ruleType)) {
        errors.push(`Rule ${index + 1}: Invalid ruleType "${rule.ruleType}"`)
        return null
      }

      // Validate condition and action are objects
      if (typeof rule.condition !== 'object' || typeof rule.action !== 'object') {
        errors.push(`Rule ${index + 1}: condition and action must be valid JSON objects`)
        return null
      }

      return {
        tenant_id: user.tenantId,
        rule_type: rule.ruleType,
        rule_key: rule.ruleKey,
        condition: rule.condition,
        action: rule.action,
        message: rule.message || null,
        priority: rule.priority ?? 0,
        is_active: true,
      }
    })

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    // Filter out nulls
    const validRules = rulesToInsert.filter((r): r is NonNullable<typeof r> => r !== null)

    // Check for duplicate rule_keys within the batch
    const ruleKeys = validRules.map((r) => `${r.rule_type}:${r.rule_key}`)
    const duplicates = ruleKeys.filter((key, i) => ruleKeys.indexOf(key) !== i)
    if (duplicates.length > 0) {
      return NextResponse.json(
        { error: `Duplicate rule keys in batch: ${duplicates.join(', ')}` },
        { status: 400 }
      )
    }

    // Check for existing rules with same keys
    const existingChecks = await Promise.all(
      validRules.map(async (rule) => {
        const { data } = await supabase
          .from('configurator_rules')
          .select('id')
          .eq('tenant_id', user.tenantId)
          .eq('rule_type', rule.rule_type)
          .eq('rule_key', rule.rule_key)
          .single()
        return data ? `${rule.rule_type}:${rule.rule_key}` : null
      })
    )

    const existingKeys = existingChecks.filter((k): k is string => k !== null)
    if (existingKeys.length > 0) {
      return NextResponse.json(
        { error: `Rules already exist: ${existingKeys.join(', ')}` },
        { status: 409 }
      )
    }

    // Insert all rules
    const { data: newRules, error: insertError } = await supabase
      .from('configurator_rules')
      .insert(validRules)
      .select()

    if (insertError) {
      console.error('Error creating batch configurator rules:', insertError)
      return NextResponse.json(
        { error: 'Failed to create rules' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Successfully created ${newRules?.length || 0} rules`,
      rules: newRules,
      packId: body.packId || null,
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in batch create configurator rules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
