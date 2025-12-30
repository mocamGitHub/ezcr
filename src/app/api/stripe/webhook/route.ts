import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendOrderEmail } from '@/lib/comms/order-emails'
import Stripe from 'stripe'

// ============================================
// TYPES
// ============================================

interface OrderRecord {
  id: string
  order_number: string
  customer_email: string
  customer_name: string | null
  customer_phone: string | null
  product_sku: string | null
  product_name: string | null
  delivery_method: 'shipping' | 'pickup'
  shipping_address: Record<string, unknown> | null
  total_amount: number
  grand_total?: number
  subtotal: number
  shipping_amount: number
  tax_amount: number
}

interface OrderItem {
  product_name: string | null
  product_sku: string | null
  quantity: number
  unit_price: number
  total_price: number
}

// ============================================
// SHIPPING INTEGRATION HELPERS
// ============================================

async function triggerN8NWorkflow(order: OrderRecord, orderNumber: string) {
  const webhookUrl = process.env.N8N_ORDER_WEBHOOK_URL
  if (!webhookUrl) return { skipped: true }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'order_created',
        timestamp: new Date().toISOString(),
        order: {
          id: order.id,
          orderNumber: orderNumber,
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          productSku: order.product_sku,
          productName: order.product_name,
          deliveryMethod: order.delivery_method,
          shippingAddress: order.shipping_address,
          grandTotal: order.total_amount || order.grand_total,
        },
      }),
    })
  } catch (error) {
    console.error('N8N trigger failed:', error)
  }
}

async function sendSlackNotification(order: OrderRecord, orderNumber: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return { skipped: true }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🎉 New Order: ${orderNumber}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🎉 New Order: ${orderNumber}`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Customer:*\n${order.customer_email}` },
              { type: 'mrkdwn', text: `*Total:*\n$${(order.total_amount || order.grand_total || 0).toFixed(2)}` },
              { type: 'mrkdwn', text: `*Delivery:*\n${order.delivery_method === 'pickup' ? 'Pickup' : 'Shipping'}` },
            ],
          },
        ],
      }),
    })
  } catch (error) {
    console.error('Slack notification failed:', error)
  }
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Get order ID from session metadata
        const orderId = session.metadata?.order_id
        const orderNumber = session.metadata?.order_number

        if (!orderId) {
          console.error('No order_id in session metadata')
          return NextResponse.json(
            { error: 'No order_id in session metadata' },
            { status: 400 }
          )
        }

        // Update order status
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('id', orderId)

        if (updateError) {
          console.error('Error updating order:', updateError)
          return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
          )
        }

        // Deduct inventory for order items
        const { data: orderItems, error: itemsError } = await supabaseAdmin
          .from('order_items')
          .select('id, product_id, variant_id, quantity, tenant_id, product_name, product_sku, unit_price, total_price')
          .eq('order_id', orderId)

        if (itemsError) {
          console.error('Error fetching order items:', itemsError)
        } else if (orderItems) {
          // Process each item
          for (const item of orderItems) {
            try {
              await supabaseAdmin.rpc('log_inventory_transaction', {
                p_tenant_id: item.tenant_id,
                p_product_id: item.product_id,
                p_variant_id: item.variant_id,
                p_order_id: orderId,
                p_transaction_type: 'sale',
                p_quantity_change: -item.quantity, // Negative for deduction
                p_reason: `Order ${orderNumber} completed`,
                p_reference_id: orderNumber,
                p_created_by: null, // System transaction
              })
            } catch (invError) {
              console.error(`Failed to deduct inventory for product ${item.product_id}:`, invError)
              // Don't fail the webhook, but log the error
              // Admin will need to reconcile manually
            }
          }
        }

        // Get order details for email and fulfillment
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        // Send order confirmation email via Comms Pack (Mailgun)
        if (order && orderItems) {
          try {
            await sendOrderEmail({
              type: 'order_confirmation',
              order: {
                orderNumber: orderNumber || order.order_number,
                customerName: order.customer_name,
                customerEmail: order.customer_email,
                customerPhone: order.customer_phone,
                productName: orderItems[0]?.product_name || 'EZ Cycle Ramp',
                productSku: orderItems[0]?.product_sku,
                items: orderItems.map((item: OrderItem) => ({
                  product_name: item.product_name || 'Product',
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  total_price: item.total_price,
                })),
                subtotal: order.subtotal,
                shipping: order.shipping_amount,
                tax: order.tax_amount,
                total: order.total_amount,
                shippingAddress: order.shipping_address,
              },
              channel: order.customer_phone ? 'both' : 'email',
            })
          } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError)
            // Don't fail webhook for email errors
          }

          // Trigger fulfillment workflow via N8N and Slack notification
          try {
            await Promise.allSettled([
              triggerN8NWorkflow(order, orderNumber || order.order_number),
              sendSlackNotification(order, orderNumber || order.order_number),
            ])
          } catch (fulfillmentError) {
            console.error('Fulfillment triggers failed:', fulfillmentError)
            // Don't fail webhook for fulfillment errors
          }
        }

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id

        if (orderId) {
          // Mark order as expired/canceled
          await supabaseAdmin
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'canceled',
            })
            .eq('id', orderId)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Find order by payment intent ID
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('id, order_number')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (order) {
          await supabaseAdmin
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'canceled',
            })
            .eq('id', order.id)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge

        // Find order by payment intent ID
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('id, order_number')
          .eq('stripe_payment_intent_id', charge.payment_intent as string)
          .single()

        if (order) {
          await supabaseAdmin
            .from('orders')
            .update({
              payment_status: 'refunded',
              status: 'refunded',
            })
            .eq('id', order.id)

          // Restore inventory for refunded items
          const { data: orderItems, error: itemsError } = await supabaseAdmin
            .from('order_items')
            .select('id, product_id, variant_id, quantity, tenant_id')
            .eq('order_id', order.id)

          if (itemsError) {
            console.error('Error fetching order items for refund:', itemsError)
          } else if (orderItems) {
            // Restore each item's inventory
            for (const item of orderItems) {
              try {
                await supabaseAdmin.rpc('log_inventory_transaction', {
                  p_tenant_id: item.tenant_id,
                  p_product_id: item.product_id,
                  p_variant_id: item.variant_id,
                  p_order_id: order.id,
                  p_transaction_type: 'refund',
                  p_quantity_change: item.quantity, // Positive for restoration
                  p_reason: `Order ${order.order_number} refunded`,
                  p_reference_id: order.order_number,
                  p_created_by: null, // System transaction
                })
              } catch (invError) {
                console.error(`Failed to restore inventory for product ${item.product_id}:`, invError)
              }
            }
          }
        }
        break
      }

      default:
        // Unhandled event type - silently ignore
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
