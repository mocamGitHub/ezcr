// src/lib/supabase/types.ts
// Type definitions for Supabase client usage

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Type alias for Supabase client
 * Use this instead of `any` when passing Supabase client to functions
 */
export type SupabaseClientType = SupabaseClient

/**
 * Common order data structure used across webhooks
 */
export interface OrderData {
  customerId?: string
  customerEmail: string
  customerName?: string
  customerPhone?: string
  shippingAddress?: {
    firstName?: string
    lastName?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  billingAddress?: {
    firstName?: string
    lastName?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  items?: Array<{
    productId?: string
    productName?: string
    sku?: string
    quantity?: number
    unitPrice?: number
    totalPrice?: number
    configuration?: Record<string, unknown>
  }>
  subtotal?: number
  shippingCost?: number
  taxAmount?: number
  totalAmount?: number
  paymentIntentId?: string
  shippingQuoteId?: string
  destinationTerminal?: string
  estimatedTransitDays?: number
  configurationId?: string
  metadata?: Record<string, unknown>
}

/**
 * Database order record (after insertion)
 */
export interface OrderRecord {
  id: string
  order_number: string
  tenant_id: string
  customer_email: string
  customer_name: string | null
  customer_phone: string | null
  status: string
  payment_status: string
  subtotal: number
  shipping_cost: number
  tax_amount: number
  total_amount: number
  created_at: string
  updated_at: string
}
