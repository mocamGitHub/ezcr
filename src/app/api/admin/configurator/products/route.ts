import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/configurator/products
 * Fetches all products/services available for rule configuration
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const tenantId = await getTenantId()

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { data: products, error } = await supabase
      .from('configurator_pricing')
      .select('category, item_key, item_name, price, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('category')
      .order('display_order')

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group products by category
    const grouped = (products || []).reduce(
      (acc, product) => {
        if (!acc[product.category]) {
          acc[product.category] = []
        }
        acc[product.category].push({
          key: product.item_key,
          name: product.item_name,
          price: product.price,
        })
        return acc
      },
      {} as Record<string, { key: string; name: string; price: number }[]>
    )

    return NextResponse.json({
      products: grouped,
      categories: Object.keys(grouped),
    })
  } catch (error) {
    console.error('Error in products API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
