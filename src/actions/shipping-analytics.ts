'use server'

import { createServiceClient } from '@/lib/supabase/server'

// ============================================
// SHIPPING ANALYTICS DATA TYPES
// ============================================

export interface OrdersOverview {
  orders_today: number
  revenue_today: number
  orders_this_week: number
  revenue_this_week: number
  orders_this_month: number
  revenue_this_month: number
  orders_all_time: number
  revenue_all_time: number
  avg_order_value: number
}

export interface ShippingPerformance {
  week_start: string
  total_orders: number
  orders_shipped: number
  orders_delivered: number
  avg_days_to_ship: number | null
  avg_transit_days: number | null
  avg_estimated_transit: number | null
  on_time_delivery_pct: number | null
}

export interface AdminActionItem {
  item_type: string
  title: string
  count: number
  description: string
}

export interface QuoteAnalytics {
  zip_prefix: string
  destination_state: string
  quote_count: number
  unique_zips: number
  avg_rate: number
  min_rate: number
  max_rate: number
  residential_quotes: number
  avg_transit_days: number
  converted_orders: number
  conversion_rate_pct: number
}

export interface ErrorSummary {
  error_type: string
  total_errors: number
  unresolved_errors: number
  errors_last_7_days: number
  errors_last_24h: number
  most_recent_error: string
}

export interface DailyRevenue {
  date: string
  order_count: number
  aun200_count: number
  aun250_count: number
  product_revenue: number
  shipping_revenue: number
  total_revenue: number
  avg_order_value: number
}

export interface CustomerGeography {
  state: string
  order_count: number
  total_revenue: number
  avg_order_value: number
  shipping_orders: number
  pickup_orders: number
  pickup_pct: number
}

export interface ProductPerformance {
  product_sku: string
  product_name: string
  order_count: number
  units_sold: number
  product_revenue: number
  total_revenue: number
  avg_order_value: number
  shipping_orders: number
  pickup_orders: number
  pickup_pct: number
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

/**
 * Get orders overview (today, week, month, all-time)
 */
export async function getOrdersOverview(): Promise<OrdersOverview | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('v_orders_overview')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching orders overview:', error)
    return null
  }

  return data
}

/**
 * Get shipping performance metrics by week
 */
export async function getShippingPerformance(weeks: number = 12): Promise<ShippingPerformance[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('v_shipping_performance_detailed')
    .select('*')
    .limit(weeks)

  if (error) {
    console.error('Error fetching shipping performance:', error)
    return []
  }

  return data || []
}

/**
 * Get admin action items (pending tasks)
 */
export async function getAdminActionItems(): Promise<AdminActionItem[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('v_admin_action_items')
    .select('*')

  if (error) {
    console.error('Error fetching admin action items:', error)
    return []
  }

  return data || []
}

/**
 * Get shipping quote analytics by region
 */
export async function getQuoteAnalytics(limit: number = 20): Promise<QuoteAnalytics[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('v_shipping_quotes_analytics')
    .select('*')
    .limit(limit)

  if (error) {
    console.error('Error fetching quote analytics:', error)
    return []
  }

  return data || []
}

/**
 * Get error log summary
 */
export async function getErrorSummary(): Promise<ErrorSummary[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('v_error_log_summary')
    .select('*')

  if (error) {
    console.error('Error fetching error summary:', error)
    return []
  }

  return data || []
}

/**
 * Get daily revenue data
 */
export async function getDailyRevenueData(days: number = 30): Promise<DailyRevenue[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('v_daily_revenue')
    .select('*')
    .limit(days)

  if (error) {
    console.error('Error fetching daily revenue:', error)
    return []
  }

  return (data || []).reverse()
}

/**
 * Get customer geography data
 */
export async function getCustomerGeography(): Promise<CustomerGeography[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('v_customer_geography')
    .select('*')
    .limit(15)

  if (error) {
    console.error('Error fetching customer geography:', error)
    return []
  }

  return data || []
}

/**
 * Get product performance data
 */
export async function getProductPerformance(): Promise<ProductPerformance[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('v_product_performance')
    .select('*')

  if (error) {
    console.error('Error fetching product performance:', error)
    return []
  }

  return data || []
}
