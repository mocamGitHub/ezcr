'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { requireStaffMember, getTenantId } from '@/actions/auth-utils'

// =====================================================
// TYPES
// =====================================================

export interface Product {
  id: string
  name: string
  sku: string
  inventory_count: number
  low_stock_threshold: number
  category_id: string | null
  base_price: number
  is_active: boolean
  has_configurator_rules?: boolean
  suppress_low_stock_alert?: boolean
  suppress_out_of_stock_alert?: boolean
  product_categories?: {
    name: string
  } | null
}

export interface GetInventoryPaginatedParams {
  page?: number
  pageSize?: number
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  search?: string
  showLowStockOnly?: boolean
}

export interface GetInventoryPaginatedResult {
  data: Product[]
  totalCount: number
  page: number
  pageSize: number
}

export interface InventoryStats {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalValue: number
  suppressedCount: number
}

// =====================================================
// GET INVENTORY PAGINATED (for AdminDataTable)
// =====================================================

export async function getInventoryPaginated(
  params: GetInventoryPaginatedParams = {}
): Promise<GetInventoryPaginatedResult> {
  await requireStaffMember()
  const tenantId = await getTenantId()

  const {
    page = 1,
    pageSize = 20,
    sortColumn = 'name',
    sortDirection = 'asc',
    search = '',
    showLowStockOnly = false,
  } = params

  const supabase = createServiceClient()

  // Build base query with count
  let query = supabase
    .from('products')
    .select(
      `
      id,
      name,
      sku,
      inventory_count,
      low_stock_threshold,
      category_id,
      base_price,
      is_active,
      has_configurator_rules,
      suppress_low_stock_alert,
      suppress_out_of_stock_alert,
      product_categories (
        name
      )
    `,
      { count: 'exact' }
    )
    .eq('tenant_id', tenantId)

  // Apply search filter
  if (search.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`)
  }

  // Apply low stock filter - products at or below threshold
  if (showLowStockOnly) {
    // This uses a raw filter since we need to compare two columns
    query = query.filter('inventory_count', 'lte', 'low_stock_threshold')
  }

  // Apply sorting
  const validSortColumns = ['name', 'sku', 'inventory_count', 'low_stock_threshold', 'base_price']
  const column = validSortColumns.includes(sortColumn) ? sortColumn : 'name'
  query = query.order(column, { ascending: sortDirection === 'asc', nullsFirst: false })

  // Apply pagination
  const offset = (page - 1) * pageSize
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching paginated inventory:', error)
    throw new Error('Failed to fetch inventory')
  }

  return {
    data: (data || []) as Product[],
    totalCount: count || 0,
    page,
    pageSize,
  }
}

// =====================================================
// GET INVENTORY STATS (for stats cards and alerts)
// =====================================================

export async function getInventoryStats(): Promise<InventoryStats> {
  await requireStaffMember()
  const tenantId = await getTenantId()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('products')
    .select('inventory_count, low_stock_threshold, base_price, suppress_low_stock_alert, suppress_out_of_stock_alert')
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error fetching inventory stats:', error)
    throw new Error('Failed to fetch inventory stats')
  }

  const products = data || []

  const outOfStockCount = products.filter((p) => p.inventory_count === 0).length
  const lowStockCount = products.filter(
    (p) => p.inventory_count > 0 && p.inventory_count <= p.low_stock_threshold
  ).length
  const totalValue = products.reduce((sum, p) => sum + p.base_price * p.inventory_count, 0)
  const suppressedCount = products.filter(
    (p) =>
      (p.inventory_count <= 0 && p.suppress_out_of_stock_alert) ||
      (p.inventory_count > 0 &&
        p.inventory_count <= p.low_stock_threshold &&
        p.suppress_low_stock_alert)
  ).length

  return {
    totalProducts: products.length,
    lowStockCount,
    outOfStockCount,
    totalValue,
    suppressedCount,
  }
}

// =====================================================
// GET ALL PRODUCTS FOR ALERTS (lightweight)
// =====================================================

export async function getProductsForAlerts(): Promise<Product[]> {
  await requireStaffMember()
  const tenantId = await getTenantId()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      sku,
      inventory_count,
      low_stock_threshold,
      suppress_low_stock_alert,
      suppress_out_of_stock_alert
    `
    )
    .eq('tenant_id', tenantId)
    .or('inventory_count.eq.0,inventory_count.lte.low_stock_threshold')

  if (error) {
    console.error('Error fetching products for alerts:', error)
    return []
  }

  // Filter to only products that are actually low/out of stock
  return (data || []).filter(
    (p) => p.inventory_count === 0 || p.inventory_count <= p.low_stock_threshold
  ) as Product[]
}

// =====================================================
// TOGGLE CONFIGURATOR RULES
// =====================================================

export async function toggleConfiguratorRules(
  productId: string,
  hasRules: boolean
): Promise<void> {
  await requireStaffMember()
  const tenantId = await getTenantId()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('products')
    .update({ has_configurator_rules: hasRules })
    .eq('id', productId)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error toggling configurator rules:', error)
    throw new Error('Failed to update configurator rules')
  }
}

// =====================================================
// TOGGLE ALERT SUPPRESSION
// =====================================================

export async function toggleAlertSuppression(
  productId: string,
  alertType: 'low_stock' | 'out_of_stock',
  suppress: boolean
): Promise<void> {
  await requireStaffMember()
  const tenantId = await getTenantId()
  const supabase = createServiceClient()

  const updateData =
    alertType === 'low_stock'
      ? { suppress_low_stock_alert: suppress }
      : { suppress_out_of_stock_alert: suppress }

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error toggling alert suppression:', error)
    throw new Error('Failed to update alert settings')
  }
}

// =====================================================
// GET ALL PRODUCTS FOR EXPORT
// =====================================================

export async function getProductsForExport(): Promise<Product[]> {
  await requireStaffMember()
  const tenantId = await getTenantId()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      sku,
      inventory_count,
      low_stock_threshold,
      category_id,
      base_price,
      is_active,
      has_configurator_rules,
      suppress_low_stock_alert,
      suppress_out_of_stock_alert,
      product_categories (
        name
      )
    `
    )
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching products for export:', error)
    throw new Error('Failed to fetch products for export')
  }

  return (data || []) as Product[]
}
