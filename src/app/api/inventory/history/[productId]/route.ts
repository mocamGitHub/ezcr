import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentTenant } from '@/lib/tenant'
import { requireRole, ROLE_GROUPS } from '@/lib/auth/api-auth'

/**
 * Get Inventory Transaction History
 * GET /api/inventory/history/[productId]
 *
 * Authentication: Required
 * Authorization: Admin, Inventory Manager, or Customer Service roles
 *
 * Query params:
 * - limit: number (default 50, max 500)
 * - transactionType: string (optional filter)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    // Require staff role (admin, inventory_manager, or customer_service)
    const authResult = await requireRole(request, ROLE_GROUPS.STAFF_ROLES)

    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: (authResult as { error: unknown; status: number }).status })
    }

    const { user } = authResult

    const { productId } = await params
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
    const transactionType = searchParams.get('transactionType')

    // Get tenant ID
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

    // Verify user belongs to this tenant
    if (user.tenantId !== TENANT_ID) {
      return NextResponse.json(
        { error: 'Unauthorized: User does not belong to this tenant' },
        { status: 403 }
      )
    }

    // Build query - include user who made the change
    let query = supabaseAdmin
      .from('inventory_transactions')
      .select(`
        id,
        transaction_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        reason,
        reference_id,
        created_at,
        created_by,
        orders (
          order_number,
          customer_email
        ),
        user_profiles!inventory_transactions_created_by_fkey (
          email,
          first_name,
          last_name
        )
      `)
      .eq('tenant_id', TENANT_ID)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply transaction type filter if provided
    if (transactionType) {
      query = query.eq('transaction_type', transactionType)
    }

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error('Error fetching inventory history:', transactionsError)
      return NextResponse.json(
        { error: 'Failed to fetch inventory history' },
        { status: 500 }
      )
    }

    // Get current product info
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, inventory_count, low_stock_threshold')
      .eq('id', productId)
      .single()

    if (productError) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate summary statistics
    const summary = {
      totalSales: transactions
        .filter((t) => t.transaction_type === 'sale')
        .reduce((sum, t) => sum + Math.abs(t.quantity_change), 0),
      totalRefunds: transactions
        .filter((t) => t.transaction_type === 'refund')
        .reduce((sum, t) => sum + t.quantity_change, 0),
      totalAdjustments: transactions
        .filter((t) => ['adjustment', 'restock', 'damage'].includes(t.transaction_type))
        .reduce((sum, t) => sum + t.quantity_change, 0),
      currentStock: product.inventory_count,
      lowStockThreshold: product.low_stock_threshold,
      isLowStock: product.inventory_count <= product.low_stock_threshold,
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
      },
      summary,
      transactions,
      pagination: {
        limit,
        count: transactions.length,
      },
    })
  } catch (error) {
    console.error('Inventory history error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
