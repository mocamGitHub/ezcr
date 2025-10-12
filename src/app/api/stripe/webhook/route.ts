import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Stripe from 'stripe'

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

        console.log(`✅ Payment successful for order ${orderNumber} (${orderId})`)

        // TODO: Send order confirmation email
        // TODO: Update inventory
        // TODO: Trigger fulfillment workflow

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

          console.log(`❌ Checkout session expired for order ${orderId}`)
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

          console.log(`❌ Payment failed for order ${order.order_number}`)
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

          console.log(`💰 Refund processed for order ${order.order_number}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
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
