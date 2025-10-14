import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentTenant } from '@/lib/tenant'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      cartItems,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      billingAddress,
    } = body

    // Get tenant ID from environment-aware configuration
    const tenantSlug = getCurrentTenant()
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (tenantError || !tenant) {
      console.error('Error fetching tenant:', tenantError)
      return NextResponse.json(
        { error: 'Tenant configuration error' },
        { status: 500 }
      )
    }

    const TENANT_ID = tenant.id

    // Validate required fields
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    if (!customerEmail || !shippingAddress || !billingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate totals (convert dollars to cents for Stripe)
    // Cart stores prices in dollars, Stripe needs cents
    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + Math.round(item.price * 100) * item.quantity,
      0
    )

    // Always apply shipping cost (no free shipping)
    const shippingCost = STRIPE_CONFIG.shippingCost

    const taxAmount = Math.round(subtotal * STRIPE_CONFIG.taxRate)
    const total = subtotal + shippingCost + taxAmount

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cartItems.map((item: any) => ({
        price_data: {
          currency: STRIPE_CONFIG.currency,
          unit_amount: Math.round(item.price * 100), // Convert dollars to cents
          product_data: {
            name: item.productName,
            description: item.productSku,
            images: item.productImage ? [item.productImage] : undefined,
          },
        },
        quantity: item.quantity,
      }))

    // Add shipping as a line item
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: STRIPE_CONFIG.currency,
          unit_amount: shippingCost,
          product_data: {
            name: 'Shipping',
            description: 'Standard shipping',
          },
        },
        quantity: 1,
      })
    }

    // Add tax as a line item
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: STRIPE_CONFIG.currency,
          unit_amount: taxAmount,
          product_data: {
            name: 'Tax',
            description: `Sales tax (${STRIPE_CONFIG.taxRate * 100}%)`,
          },
        },
        quantity: 1,
      })
    }

    // Generate order number
    const { data: orderNumberData, error: orderNumberError } =
      await supabaseAdmin.rpc('generate_order_number', {
        tenant_prefix: 'EZCR',
      })

    if (orderNumberError) {
      console.error('Error generating order number:', orderNumberError)
      return NextResponse.json(
        { error: 'Failed to generate order number' },
        { status: 500 }
      )
    }

    const orderNumber = orderNumberData as string

    // Create pending order in database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tenant_id: TENANT_ID,
        order_number: orderNumber,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        status: 'pending',
        payment_status: 'pending',
        subtotal: subtotal / 100, // Convert to dollars for DB
        tax_amount: taxAmount / 100,
        shipping_amount: shippingCost / 100,
        discount_amount: 0,
        total_amount: total / 100,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Create order items
    const orderItems = cartItems.map((item: any) => ({
      tenant_id: TENANT_ID,
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      product_sku: item.productSku || '',
      quantity: item.quantity,
      unit_price: item.price, // Already in dollars
      total_price: item.price * item.quantity, // Already in dollars
      configuration: item.configuration || {},
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Rollback order creation
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      client_reference_id: order.id,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        tenant_id: TENANT_ID,
      },
      success_url: `${request.nextUrl.origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/checkout?canceled=true`,
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
    })

    // Update order with Stripe session ID
    await supabaseAdmin
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
      orderNumber: orderNumber,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
