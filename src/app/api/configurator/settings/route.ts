import { createClient } from '@/lib/supabase/server'
import { getCurrentTenant } from '@/lib/tenant'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/configurator/settings
 * Fetches all configurator settings for the active tenant
 * Returns: measurement ranges, pricing, business rules, and general settings
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get tenant ID from environment-aware configuration
    const tenantSlug = getCurrentTenant()
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

    const tenantId = tenant.id

    // Fetch measurement ranges
    const { data: measurementRanges, error: rangesError } = await supabase
      .from('configurator_measurement_ranges')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    if (rangesError) throw rangesError

    // Fetch pricing
    const { data: pricing, error: pricingError } = await supabase
      .from('configurator_pricing')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('category')
      .order('display_order')

    if (pricingError) throw pricingError

    // Fetch business rules
    const { data: rules, error: rulesError } = await supabase
      .from('configurator_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('rule_type')
      .order('priority')

    if (rulesError) throw rulesError

    // Fetch general settings
    const { data: settings, error: settingsError } = await supabase
      .from('configurator_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    if (settingsError) throw settingsError

    // Transform data into structured format
    const measurementRangesObj = measurementRanges?.reduce(
      (acc, range) => {
        acc[range.setting_key] = range.value_inches
        return acc
      },
      {} as Record<string, number>
    )

    const pricingObj = pricing?.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = {}
        }
        acc[item.category][item.item_key] = {
          name: item.item_name,
          price: parseFloat(item.price),
          description: item.description,
        }
        return acc
      },
      {} as Record<string, Record<string, any>>
    )

    const rulesObj = rules?.reduce(
      (acc, rule) => {
        if (!acc[rule.rule_type]) {
          acc[rule.rule_type] = []
        }
        acc[rule.rule_type].push({
          key: rule.rule_key,
          condition: rule.condition,
          action: rule.action,
          message: rule.message,
          priority: rule.priority,
        })
        return acc
      },
      {} as Record<string, any[]>
    )

    const settingsObj = settings?.reduce(
      (acc, setting) => {
        acc[setting.setting_key] = setting.setting_value
        return acc
      },
      {} as Record<string, any>
    )

    return NextResponse.json(
      {
        measurementRanges: measurementRangesObj,
        pricing: pricingObj,
        rules: rulesObj,
        settings: settingsObj,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching configurator settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configurator settings' },
      { status: 500 }
    )
  }
}
