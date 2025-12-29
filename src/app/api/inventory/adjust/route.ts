import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentTenant } from '@/lib/tenant'
import { requireRole, ROLE_GROUPS } from '@/lib/auth/api-auth'
import { inventoryAdjustSchema, validateRequest } from '@/lib/validations/api-schemas'

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
      return NextResponse.json(authResult.error, { status: (authResult as { error: unknown; status: number }).status })
    }

    const { user } = authResult

    // Parse and validate request body
    const body = await request.json()
    const validation = validateRequest(inventoryAdjustSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.message, details: validation.error.details },
        { status: 400 }
      )
    }

    const {
      productId,
      variantId,
      quantityChange,
      transactionType,
      reason,
      referenceId,
    } = validation.data

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

    // Get current product inventory
    const { data: currentProduct, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, inventory_count')
      .eq('id', productId)
      .single()

    if (fetchError || !currentProduct) {
      console.error('Failed to fetch product:', fetchError)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const currentQuantity = currentProduct.inventory_count || 0
    const newQuantity = currentQuantity + quantityChange

    // Prevent negative inventory
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: `Insufficient inventory. Current: ${currentQuantity}, Requested change: ${quantityChange}` },
        { status: 400 }
      )
    }

    // Update product inventory count
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        inventory_count: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (updateError) {
      console.error('Failed to update inventory:', updateError)
      return NextResponse.json(
        { error: 'Failed to update inventory' },
        { status: 500 }
      )
    }

    // Try to log transaction (table may not exist yet, so don't fail if it doesn't)
    let transactionId = null
    try {
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('inventory_transactions')
        .insert({
          tenant_id: TENANT_ID,
          product_id: productId,
          variant_id: variantId || null,
          order_id: null,
          transaction_type: transactionType,
          quantity_change: quantityChange,
          previous_quantity: currentQuantity,
          new_quantity: newQuantity,
          reason: reason,
          reference_id: referenceId || null,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (!transactionError && transaction) {
        transactionId = transaction.id
      }
    } catch {
      // Transaction logging is optional - continue without it
      console.log('Note: inventory_transactions table may not exist yet')
    }

    // Get updated product
    const product = {
      ...currentProduct,
      inventory_count: newQuantity
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
