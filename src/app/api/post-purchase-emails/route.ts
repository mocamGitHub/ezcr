// ============================================
// NEXT.JS API ROUTE: /api/post-purchase-emails
// Manages order lifecycle emails using Resend
// ============================================
//
// This endpoint can be called:
// 1. Via HTTP endpoint for manual triggers
// 2. Via database webhook on order status changes
// 3. Via cron job for scheduled emails (review requests)
//
// Required Environment Variables:
//   RESEND_API_KEY=re_xxx
//   TWILIO_ACCOUNT_SID=xxx (optional, for SMS)
//   TWILIO_AUTH_TOKEN=xxx (optional, for SMS)
//   TWILIO_FROM_NUMBER=+1xxx (optional, for SMS)
//   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
//   SUPABASE_SERVICE_KEY=your_service_role_key

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendShippingNotification,
  sendDeliveryConfirmation,
  sendPickupReadyNotification,
  sendReviewRequest,
  sendInstallationTips,
} from '@/lib/email/resend-service'
import { sendOrderConfirmationEmail } from '@/lib/email/order-confirmation'

// ============================================
// TYPES
// ============================================

interface TriggerRequest {
  type:
    | 'order_confirmation'
    | 'shipping'
    | 'out_for_delivery'
    | 'delivered'
    | 'pickup_ready'
    | 'review_request'
    | 'installation_tips'
    | 'process_scheduled'
  orderId?: string
  orderNumber?: string
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
  estimatedDelivery?: string
}

interface Order {
  id: string
  order_number: string
  customer_email: string
  customer_name?: string
  customer_phone?: string
  product_sku: string
  product_name: string
  product_price: number
  delivery_method: 'shipping' | 'pickup'
  shipping_address?: any
  destination_terminal?: any
  grand_total: number
  tracking_number?: string
  carrier?: string
  estimated_delivery_date?: string
  delivered_at?: string
  order_confirmation_sent_at?: string
  shipping_notification_sent_at?: string
  delivery_notification_sent_at?: string
  review_request_sent_at?: string
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// ============================================
// EMAIL HANDLER FUNCTIONS
// ============================================

async function handleOrderConfirmation(supabase: any, order: Order) {
  if (order.order_confirmation_sent_at) {
    return { skipped: true, reason: 'Already sent' }
  }

  const result = await sendOrderConfirmationEmail({
    orderNumber: order.order_number,
    customerName: order.customer_name || 'Valued Customer',
    customerEmail: order.customer_email,
    items: [
      {
        product_name: order.product_name,
        quantity: 1,
        unit_price: order.product_price,
        total_price: order.product_price,
      },
    ],
    subtotal: order.product_price,
    shipping: order.grand_total - order.product_price,
    tax: 0,
    total: order.grand_total,
    shippingAddress: order.shipping_address
      ? {
          line1: order.shipping_address.line1 || order.shipping_address.street || '',
          line2: order.shipping_address.line2 || '',
          city: order.shipping_address.city || '',
          state: order.shipping_address.state || '',
          postalCode: order.shipping_address.postalCode || order.shipping_address.zip || '',
          country: order.shipping_address.country || 'US',
        }
      : {
          line1: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'US',
        },
  })

  if (result.success) {
    await supabase
      .from('orders')
      .update({ order_confirmation_sent_at: new Date().toISOString() })
      .eq('id', order.id)
  }

  return result
}

async function handleShippingNotification(
  supabase: any,
  order: Order,
  shipping: {
    trackingNumber?: string
    trackingUrl?: string
    carrier?: string
    estimatedDelivery?: string
  }
) {
  // Update order with tracking info first
  await supabase
    .from('orders')
    .update({
      tracking_number: shipping.trackingNumber,
      carrier: shipping.carrier || 'tforce',
      estimated_delivery_date: shipping.estimatedDelivery,
      status: 'shipped',
      shipped_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  // Generate tracking URL if not provided
  const trackingUrl =
    shipping.trackingUrl ||
    `https://www.tforcefreight.com/ltl/apps/Tracking?TrackingNumber=${shipping.trackingNumber}`

  const result = await sendShippingNotification({
    to: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    productName: order.product_name,
    trackingNumber: shipping.trackingNumber || '',
    trackingUrl,
    carrier: shipping.carrier || 'T-Force Freight',
    estimatedDelivery: shipping.estimatedDelivery,
    shippingAddress: order.shipping_address
      ? {
          line1: order.shipping_address.line1 || order.shipping_address.street || '',
          line2: order.shipping_address.line2,
          city: order.shipping_address.city || '',
          state: order.shipping_address.state || '',
          postalCode: order.shipping_address.postalCode || order.shipping_address.zip || '',
          isResidential: order.shipping_address.is_residential,
        }
      : undefined,
    destinationTerminal: order.destination_terminal,
  })

  if (result.success) {
    await supabase
      .from('orders')
      .update({ shipping_notification_sent_at: new Date().toISOString() })
      .eq('id', order.id)
  }

  return result
}

async function handleDeliveryConfirmation(supabase: any, order: Order) {
  // Update order status
  await supabase
    .from('orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  const result = await sendDeliveryConfirmation({
    to: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    productName: order.product_name,
  })

  if (result.success) {
    await supabase
      .from('orders')
      .update({ delivery_notification_sent_at: new Date().toISOString() })
      .eq('id', order.id)

    // Schedule review request for 7 days later
    await supabase.from('scheduled_emails').insert({
      order_id: order.id,
      email_type: 'review_request',
      recipient_email: order.customer_email,
      recipient_name: order.customer_name,
      scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    })

    // Schedule installation tips for 2 days later
    await supabase.from('scheduled_emails').insert({
      order_id: order.id,
      email_type: 'installation_tips',
      recipient_email: order.customer_email,
      recipient_name: order.customer_name,
      scheduled_for: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    })
  }

  return result
}

async function handlePickupReady(supabase: any, order: Order) {
  // Update order
  await supabase
    .from('orders')
    .update({
      pickup_ready_at: new Date().toISOString(),
      pickup_notified_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  const result = await sendPickupReadyNotification({
    to: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    productName: order.product_name,
  })

  // Also send SMS if phone number available
  if (order.customer_phone) {
    await sendPickupReadySMS(order)
  }

  return result
}

async function sendPickupReadySMS(order: Order) {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN
  const twilioFrom = process.env.TWILIO_FROM_NUMBER

  if (!twilioSid || !twilioAuth || !twilioFrom || !order.customer_phone) {
    return { skipped: true }
  }

  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: order.customer_phone,
        From: twilioFrom,
        Body: `Your EZ Cycle Ramp is ready for pickup! Order ${order.order_number}. Location: 2500 Continental Blvd, Woodstock, GA 30188. Hours: Mon-Fri 8am-5pm. Questions? (937) 725-6790`,
      }),
    })
  } catch (error) {
    console.error('SMS send failed:', error)
  }
}

async function handleReviewRequest(supabase: any, order: Order) {
  if (order.review_request_sent_at) {
    return { skipped: true, reason: 'Already sent' }
  }

  const result = await sendReviewRequest({
    to: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    productName: order.product_name,
  })

  if (result.success) {
    await supabase
      .from('orders')
      .update({ review_request_sent_at: new Date().toISOString() })
      .eq('id', order.id)
  }

  return result
}

async function handleInstallationTips(supabase: any, order: Order) {
  const result = await sendInstallationTips({
    to: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    productName: order.product_name,
    productSku: order.product_sku,
  })

  return result
}

// ============================================
// SCHEDULED EMAIL PROCESSOR
// ============================================

async function processScheduledEmails(supabase: any) {
  // Get pending scheduled emails that are due
  const { data: scheduledEmails, error } = await supabase
    .from('scheduled_emails')
    .select(
      `
      *,
      orders (*)
    `
    )
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50)

  if (error || !scheduledEmails) {
    console.error('Error fetching scheduled emails:', error)
    return { processed: 0 }
  }

  let processed = 0

  for (const scheduled of scheduledEmails) {
    try {
      let result

      switch (scheduled.email_type) {
        case 'review_request':
          result = await handleReviewRequest(supabase, scheduled.orders)
          break
        case 'installation_tips':
          result = await handleInstallationTips(supabase, scheduled.orders)
          break
        default:
          console.warn(`Unknown scheduled email type: ${scheduled.email_type}`)
          continue
      }

      // Check if result was skipped or actual email send
      const isSkipped = 'skipped' in result && result.skipped
      const wasSuccess = 'success' in result && result.success

      // Update scheduled email status
      await supabase
        .from('scheduled_emails')
        .update({
          status: wasSuccess ? 'sent' : isSkipped ? 'skipped' : 'failed',
          sent_at: wasSuccess ? new Date().toISOString() : null,
          error: 'error' in result ? result.error : undefined,
          attempts: scheduled.attempts + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', scheduled.id)

      if (wasSuccess) {
        processed++
      }
    } catch (error: any) {
      console.error(`Error processing scheduled email ${scheduled.id}:`, error)

      await supabase
        .from('scheduled_emails')
        .update({
          status: 'failed',
          error: error.message,
          attempts: scheduled.attempts + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', scheduled.id)
    }
  }

  return { processed }
}

// ============================================
// API ROUTE HANDLER
// ============================================

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient()

  try {
    const request: TriggerRequest = await req.json()

    // Handle scheduled email processing (called by cron)
    if (request.type === 'process_scheduled') {
      const result = await processScheduledEmails(supabase)
      return NextResponse.json({
        success: true,
        message: 'Scheduled emails processed',
        ...result,
      })
    }

    // Get order
    let order: Order | null = null

    if (request.orderId) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', request.orderId)
        .single()
      order = data
    } else if (request.orderNumber) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', request.orderNumber)
        .single()
      order = data
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Process email based on type
    let result
    switch (request.type) {
      case 'order_confirmation':
        result = await handleOrderConfirmation(supabase, order)
        break

      case 'shipping':
        result = await handleShippingNotification(supabase, order, {
          trackingNumber: request.trackingNumber,
          trackingUrl: request.trackingUrl,
          carrier: request.carrier,
          estimatedDelivery: request.estimatedDelivery,
        })
        break

      case 'out_for_delivery':
        // For out_for_delivery, we just send a reminder - no special handling needed
        result = await sendShippingNotification({
          to: order.customer_email,
          customerName: order.customer_name,
          orderNumber: order.order_number,
          productName: order.product_name,
          trackingNumber: order.tracking_number || '',
          trackingUrl: `https://www.tforcefreight.com/ltl/apps/Tracking?TrackingNumber=${order.tracking_number}`,
          carrier: order.carrier || 'T-Force Freight',
          estimatedDelivery: 'Today',
        })
        break

      case 'delivered':
        result = await handleDeliveryConfirmation(supabase, order)
        break

      case 'pickup_ready':
        result = await handlePickupReady(supabase, order)
        break

      case 'review_request':
        result = await handleReviewRequest(supabase, order)
        break

      case 'installation_tips':
        result = await handleInstallationTips(supabase, order)
        break

      default:
        return NextResponse.json({ error: `Unknown email type: ${request.type}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Email trigger error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
