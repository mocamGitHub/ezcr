'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTenantId as getEnvironmentTenantId } from '@/lib/tenant'
import type { Order } from '@/components/orders'

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function getTenantId(): Promise<string> {
  return await getEnvironmentTenantId()
}

async function requireStaffMember() {
  const supabase = await createClient()
  const tenantId = await getTenantId()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const serviceClient = createServiceClient()
  const { data: profile, error } = await serviceClient
    .from('user_profiles')
    .select('id, role')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !profile || !['owner', 'admin', 'customer_service'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }

  return { userId: user.id, profile }
}

export interface GetOrdersPaginatedParams {
  page?: number
  pageSize?: number
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  search?: string
  statusFilter?: string
  paymentFilter?: string
  startDate?: string
  endDate?: string
}

export interface GetOrdersPaginatedResult {
  data: Order[]
  totalCount: number
  page: number
  pageSize: number
}

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  pendingCount: number
  processingCount: number
}

// =====================================================
// GET ORDERS PAGINATED (for AdminDataTable)
// =====================================================

export async function getOrdersPaginated(
  params: GetOrdersPaginatedParams = {}
): Promise<GetOrdersPaginatedResult> {
  await requireStaffMember()

  const {
    page = 1,
    pageSize = 20,
    sortColumn = 'created_at',
    sortDirection = 'desc',
    search = '',
    statusFilter = 'all',
    paymentFilter = 'all',
    startDate,
    endDate,
  } = params

  const supabase = createServiceClient()

  // Build base query with count
  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })

  // Apply status filter
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  // Apply payment status filter
  if (paymentFilter && paymentFilter !== 'all') {
    query = query.eq('payment_status', paymentFilter)
  }

  // Apply date range filter
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  // Apply search filter
  if (search.trim()) {
    const searchTerm = `%${search.trim()}%`
    query = query.or(
      `order_number.ilike.${searchTerm},customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm}`
    )
  }

  // Apply sorting
  const columnMapping: Record<string, string> = {
    order_number: 'order_number',
    customer: 'customer_name',
    status: 'status',
    payment: 'payment_status',
    total: 'grand_total',
    date: 'created_at',
  }
  const column = columnMapping[sortColumn] || 'created_at'
  query = query.order(column, { ascending: sortDirection === 'asc', nullsFirst: false })

  // Apply pagination
  const offset = (page - 1) * pageSize
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching paginated orders:', error)
    throw new Error('Failed to fetch orders')
  }

  return {
    data: (data || []) as Order[],
    totalCount: count || 0,
    page,
    pageSize,
  }
}

// =====================================================
// GET ORDER STATS (for stats cards)
// =====================================================

export async function getOrderStats(): Promise<OrderStats> {
  await requireStaffMember()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('orders')
    .select('status, payment_status, grand_total')

  if (error) {
    console.error('Error fetching order stats:', error)
    throw new Error('Failed to fetch order stats')
  }

  const orders = data || []

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid' || o.payment_status === 'succeeded')
    .reduce((sum, o) => sum + (o.grand_total ?? 0), 0)

  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const processingCount = orders.filter((o) => o.status === 'processing').length

  return {
    totalOrders: orders.length,
    totalRevenue,
    pendingCount,
    processingCount,
  }
}

// =====================================================
// UPDATE ORDER STATUS
// =====================================================

export async function updateOrderStatus(
  orderId: string,
  newStatus: string
): Promise<void> {
  await requireStaffMember()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) {
    console.error('Error updating order status:', error)
    throw new Error('Failed to update order status')
  }
}

// =====================================================
// BULK UPDATE ORDER STATUS
// =====================================================

export async function bulkUpdateOrderStatus(
  orderIds: string[],
  newStatus: string
): Promise<void> {
  await requireStaffMember()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .in('id', orderIds)

  if (error) {
    console.error('Error bulk updating order status:', error)
    throw new Error('Failed to update orders')
  }
}

// =====================================================
// SAVE PRO NUMBER
// =====================================================

export async function saveProNumber(
  orderId: string,
  proNumber: string
): Promise<void> {
  await requireStaffMember()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('orders')
    .update({
      pro_number: proNumber,
      carrier: 'tforce',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    console.error('Error saving PRO number:', error)
    throw new Error('Failed to save PRO number')
  }
}

// =====================================================
// SAVE BOL NUMBER
// =====================================================

export async function saveBolNumber(
  orderId: string,
  bolNumber: string
): Promise<void> {
  await requireStaffMember()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('orders')
    .update({
      bol_number: bolNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    console.error('Error saving BOL number:', error)
    throw new Error('Failed to save BOL number')
  }
}

// =====================================================
// GET ORDER DETAILS (fetch items, phone, config)
// =====================================================

export async function getOrderDetails(orderId: string): Promise<Order> {
  await requireStaffMember()
  const supabase = createServiceClient()

  // Fetch the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('Error fetching order:', orderError)
    throw new Error('Order not found')
  }

  let enhancedOrder: Order = order as Order

  // Fetch order_items
  const { data: items } = await supabase
    .from('order_items')
    .select('id, product_name, product_sku, quantity, unit_price, total_price')
    .eq('order_id', orderId)

  if (items && items.length > 0) {
    enhancedOrder = { ...enhancedOrder, order_items: items }
  }

  // Fetch phone from contacts if missing
  if (!order.customer_phone && order.customer_email) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('phone')
      .ilike('email', order.customer_email)
      .limit(1)

    if (contacts && contacts.length > 0 && contacts[0].phone) {
      enhancedOrder = { ...enhancedOrder, customer_phone: contacts[0].phone }
    }
  }

  // Fetch configuration
  if (!order.configuration && order.customer_email) {
    if (order.configuration_id) {
      const { data: config } = await supabase
        .from('product_configurations')
        .select('configuration')
        .eq('id', order.configuration_id)
        .single()

      if (config?.configuration) {
        enhancedOrder = { ...enhancedOrder, configuration: config.configuration }
      }
    } else {
      // Fall back to email matching for legacy orders
      const { data: configs } = await supabase
        .from('product_configurations')
        .select('configuration')
        .limit(100)

      if (configs) {
        const matchingConfig = configs.find(
          (c: { configuration?: { contact?: { email?: string } } }) =>
            c.configuration?.contact?.email?.toLowerCase() === order.customer_email?.toLowerCase()
        )
        if (matchingConfig) {
          enhancedOrder = { ...enhancedOrder, configuration: matchingConfig.configuration }
        }
      }
    }
  }

  return enhancedOrder
}

// =====================================================
// SAVE TRACKING DATA
// =====================================================

export async function saveTrackingData(
  orderId: string,
  trackingData: {
    tracking_events?: unknown[]
    tracking_synced_at?: string
    delivery_signature?: string | null
    pro_number?: string
    bol_number?: string
    carrier?: string
  }
): Promise<void> {
  await requireStaffMember()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('orders')
    .update({
      ...trackingData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    console.error('Error saving tracking data:', error)
    throw new Error('Failed to save tracking data')
  }
}

// =====================================================
// GET ORDERS FOR EXPORT
// =====================================================

export async function getOrdersForExport(
  statusFilter: string = 'all'
): Promise<Order[]> {
  await requireStaffMember()
  const supabase = createServiceClient()

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching orders for export:', error)
    throw new Error('Failed to fetch orders for export')
  }

  return (data || []) as Order[]
}
