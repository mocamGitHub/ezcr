import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentTenant } from '@/lib/tenant'
import { requireRole, ROLE_GROUPS } from '@/lib/auth/api-auth'

/**
 * Manual Inventory Adjustment API
 * POST /api/inventory/adjust
 *
 * Authentication: Required
 * Authorization: Admin or Inventory Manager roles only
 *
 * Body:
 * {
 *   productId: string,
 *   variantId?: string,
 *   quantityChange: number (positive = add, negative = remove),
 *   transactionType: 'adjustment' | 'restock' | 'damage' | 'initial',
 *   reason: string,
 *   referenceId?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin or inventory_manager role
    const authResult = await requireRole(request, ROLE_GROUPS.INVENTORY_ROLES)

    if ('error' in authResult) {
      return NextResponse.json(authResult.error, { status: authResult.status })
    }

    const { user } = authResult

    const body = await request.json()
    const {
      productId,
      variantId,
      quantityChange,
      transactionType = 'adjustment',
      reason,
      referenceId,
    } = body

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

    // Validate required fields
    if (!productId || quantityChange === undefined || quantityChange === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, quantityChange' },
        { status: 400 }
      )
    }

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Reason is required for inventory adjustments' },
        { status: 400 }
      )
    }

    // Validate transaction type
    const validTypes = ['adjustment', 'restock', 'damage', 'initial']
    if (!validTypes.includes(transactionType)) {
      return NextResponse.json(
        { error: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Use the database function to adjust inventory atomically
    // User ID is tracked for audit trail
    const { data: transactionId, error: adjustError } = await supabaseAdmin.rpc(
      'log_inventory_transaction',
      {
        p_tenant_id: TENANT_ID,
        p_product_id: productId,
        p_variant_id: variantId || null,
        p_order_id: null,
        p_transaction_type: transactionType,
        p_quantity_change: quantityChange,
        p_reason: reason,
        p_reference_id: referenceId || null,
        p_created_by: user.id, // Track who made the adjustment
      }
    )

    if (adjustError) {
      console.error('Inventory adjustment error:', adjustError)
      return NextResponse.json(
        { error: adjustError.message || 'Failed to adjust inventory' },
        { status: 500 }
      )
    }

    // Get updated product inventory
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, inventory_count')
      .eq('id', productId)
      .single()

    if (productError) {
      return NextResponse.json(
        { error: 'Failed to fetch updated product' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transactionId,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        newInventoryCount: product.inventory_count,
      },
      adjustment: {
        quantityChange,
        transactionType,
        reason,
        adjustedBy: user.email,
      },
    })
  } catch (error) {
    console.error('Inventory adjustment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
