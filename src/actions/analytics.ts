'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { getTenantId as getEnvironmentTenantId } from '@/lib/tenant'
import { startOfDay, subDays, format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

async function getTenantId(): Promise<string> {
  return await getEnvironmentTenantId()
}

export interface DashboardStats {
  totalRevenue: number
  revenueChange: number
  totalOrders: number
  ordersChange: number
  averageOrderValue: number
  aovChange: number
  totalCustomers: number
  customersChange: number
  conversionRate: number
  conversionChange: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

export interface TopProduct {
  id: string
  name: string
  revenue: number
  quantity: number
  image?: string
}

export interface OrderStatusBreakdown {
  status: string
  count: number
  percentage: number
}

export interface CustomerAcquisition {
  date: string
  newCustomers: number
  returningCustomers: number
}

/**
 * Get dashboard KPI statistics with period comparison
 */
export async function getDashboardStats(days: number = 30): Promise<DashboardStats> {
  const supabase = createServiceClient()
  const tenantId = await getTenantId()

  const now = new Date()
  const periodStart = subDays(now, days)
  const previousPeriodStart = subDays(periodStart, days)

  // Current period orders
  const { data: currentOrders } = await supabase
    .from('orders')
    .select('grand_total, customer_email, payment_status')
    .gte('created_at', periodStart.toISOString())
    .eq('payment_status', 'succeeded')

  // Previous period orders for comparison
  const { data: previousOrders } = await supabase
    .from('orders')
    .select('grand_total, customer_email, payment_status')
    .gte('created_at', previousPeriodStart.toISOString())
    .lt('created_at', periodStart.toISOString())
    .eq('payment_status', 'succeeded')

  // Current period customers
  const { data: currentCustomers } = await supabase
    .from('customer_profiles_unified')
    .select('customer_email, first_order_date')
    .eq('tenant_id', tenantId)
    .gte('first_order_date', periodStart.toISOString())

  // Previous period customers
  const { data: previousCustomers } = await supabase
    .from('customer_profiles_unified')
    .select('customer_email, first_order_date')
    .eq('tenant_id', tenantId)
    .gte('first_order_date', previousPeriodStart.toISOString())
    .lt('first_order_date', periodStart.toISOString())

  const currentRevenue = currentOrders?.reduce((sum, o) => sum + (o.grand_total || 0), 0) || 0
  const previousRevenue = previousOrders?.reduce((sum, o) => sum + (o.grand_total || 0), 0) || 0

  const currentOrderCount = currentOrders?.length || 0
  const previousOrderCount = previousOrders?.length || 0

  const currentAOV = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0
  const previousAOV = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0

  const currentCustomerCount = currentCustomers?.length || 0
  const previousCustomerCount = previousCustomers?.length || 0

  // Calculate percentage changes
  const calcChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return {
    totalRevenue: currentRevenue,
    revenueChange: calcChange(currentRevenue, previousRevenue),
    totalOrders: currentOrderCount,
    ordersChange: calcChange(currentOrderCount, previousOrderCount),
    averageOrderValue: currentAOV,
    aovChange: calcChange(currentAOV, previousAOV),
    totalCustomers: currentCustomerCount,
    customersChange: calcChange(currentCustomerCount, previousCustomerCount),
    conversionRate: 0, // Would need session data to calculate
    conversionChange: 0,
  }
}

/**
 * Get revenue trend data for charts
 */
export async function getRevenueTrend(days: number = 30): Promise<RevenueDataPoint[]> {
  const supabase = createServiceClient()

  const endDate = new Date()
  const startDate = subDays(endDate, days)

  const { data: orders } = await supabase
    .from('orders')
    .select('created_at, grand_total, payment_status')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('payment_status', 'succeeded')
    .order('created_at', { ascending: true })

  // Group by date
  const dateMap = new Map<string, { revenue: number; orders: number }>()

  // Initialize all dates
  const allDates = eachDayOfInterval({ start: startDate, end: endDate })
  allDates.forEach(date => {
    dateMap.set(format(date, 'yyyy-MM-dd'), { revenue: 0, orders: 0 })
  })

  // Aggregate order data
  orders?.forEach(order => {
    const date = format(new Date(order.created_at), 'yyyy-MM-dd')
    const existing = dateMap.get(date) || { revenue: 0, orders: 0 }
    dateMap.set(date, {
      revenue: existing.revenue + (order.grand_total || 0),
      orders: existing.orders + 1,
    })
  })

  return Array.from(dateMap.entries()).map(([date, data]) => ({
    date: format(new Date(date), 'MMM dd'),
    revenue: data.revenue,
    orders: data.orders,
  }))
}

/**
 * Get top performing products
 */
export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
  const supabase = createServiceClient()

  const thirtyDaysAgo = subDays(new Date(), 30)

  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      product_id,
      product_name,
      quantity,
      total_price,
      orders!inner (
        created_at,
        payment_status
      )
    `)
    .gte('orders.created_at', thirtyDaysAgo.toISOString())
    .eq('orders.payment_status', 'succeeded')

  // Aggregate by product
  const productMap = new Map<string, { name: string; revenue: number; quantity: number }>()

  orderItems?.forEach(item => {
    const existing = productMap.get(item.product_id) || { name: item.product_name, revenue: 0, quantity: 0 }
    productMap.set(item.product_id, {
      name: item.product_name,
      revenue: existing.revenue + (item.total_price || 0),
      quantity: existing.quantity + (item.quantity || 0),
    })
  })

  return Array.from(productMap.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      revenue: data.revenue,
      quantity: data.quantity,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

/**
 * Get order status breakdown
 */
export async function getOrderStatusBreakdown(): Promise<OrderStatusBreakdown[]> {
  const supabase = createServiceClient()

  const thirtyDaysAgo = subDays(new Date(), 30)

  const { data: orders } = await supabase
    .from('orders')
    .select('status')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const statusCounts = new Map<string, number>()
  orders?.forEach(order => {
    const count = statusCounts.get(order.status) || 0
    statusCounts.set(order.status, count + 1)
  })

  const total = orders?.length || 1

  return Array.from(statusCounts.entries()).map(([status, count]) => ({
    status,
    count,
    percentage: (count / total) * 100,
  }))
}

/**
 * Get customer acquisition trend
 */
export async function getCustomerAcquisition(days: number = 30): Promise<CustomerAcquisition[]> {
  const supabase = createServiceClient()
  const tenantId = await getTenantId()

  const endDate = new Date()
  const startDate = subDays(endDate, days)

  // Get orders with customer data
  const { data: orders } = await supabase
    .from('orders')
    .select('customer_email, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('payment_status', 'succeeded')
    .order('created_at', { ascending: true })

  // Get customer first order dates
  const { data: customers } = await supabase
    .from('customer_profiles_unified')
    .select('customer_email, first_order_date')
    .eq('tenant_id', tenantId)

  const customerFirstOrders = new Map(
    customers?.map(c => [c.customer_email, c.first_order_date]) || []
  )

  // Group by date
  const dateMap = new Map<string, { newCustomers: number; returningCustomers: number }>()

  // Initialize all dates
  const allDates = eachDayOfInterval({ start: startDate, end: endDate })
  allDates.forEach(date => {
    dateMap.set(format(date, 'yyyy-MM-dd'), { newCustomers: 0, returningCustomers: 0 })
  })

  // Count new vs returning
  orders?.forEach(order => {
    const orderDate = format(new Date(order.created_at), 'yyyy-MM-dd')
    const firstOrderDate = customerFirstOrders.get(order.customer_email)
    const existing = dateMap.get(orderDate) || { newCustomers: 0, returningCustomers: 0 }

    if (firstOrderDate && format(new Date(firstOrderDate), 'yyyy-MM-dd') === orderDate) {
      dateMap.set(orderDate, { ...existing, newCustomers: existing.newCustomers + 1 })
    } else {
      dateMap.set(orderDate, { ...existing, returningCustomers: existing.returningCustomers + 1 })
    }
  })

  return Array.from(dateMap.entries()).map(([date, data]) => ({
    date: format(new Date(date), 'MMM dd'),
    newCustomers: data.newCustomers,
    returningCustomers: data.returningCustomers,
  }))
}

/**
 * Get inventory status summary
 */
export async function getInventoryStatus() {
  const supabase = createServiceClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, inventory_count, low_stock_threshold, is_active')
    .eq('is_active', true)

  const totalProducts = products?.length || 0
  const lowStock = products?.filter(p =>
    p.inventory_count <= (p.low_stock_threshold || 5) && p.inventory_count > 0
  ).length || 0
  const outOfStock = products?.filter(p => p.inventory_count <= 0).length || 0
  const healthy = totalProducts - lowStock - outOfStock

  return {
    total: totalProducts,
    healthy,
    lowStock,
    outOfStock,
    lowStockProducts: products?.filter(p =>
      p.inventory_count <= (p.low_stock_threshold || 5)
    ).slice(0, 5) || [],
  }
}
