// ============================================
// SUPABASE EDGE FUNCTION: stripe-webhook
// Handles Stripe payment events and creates orders
// ============================================
//
// Deploy: supabase functions deploy stripe-webhook
//
// Required Secrets:
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
//   supabase secrets set N8N_ORDER_WEBHOOK_URL=https://n8n.example.com/webhook/order
//   supabase secrets set SENDGRID_API_KEY=SG.xxx
//   supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/xxx (optional)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.5.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// ============================================
// TYPES
// ============================================

interface OrderData {
  orderNumber: string;
  customerEmail: string;
  customerPhone?: string;
  customerName?: string;
  
  productSku: string;
  productName: string;
  productPrice: number;
  
  deliveryMethod: 'shipping' | 'pickup';
  shippingQuoteId?: string;
  shippingCost: number;
  shippingAddress?: {
    streetAddress: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isResidential: boolean;
  };
  destinationTerminal?: {
    code: string;
    name: string;
  };
  estimatedTransitDays?: number;
  
  billingAddress: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  paymentIntentId: string;
  paymentMethod: string;
  
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  
  sessionId?: string;
  leadId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EZC-${dateStr}-${random}`;
}

function determineProductFromMetadata(metadata: Record<string, string>): {
  sku: string;
  name: string;
  price: number;
} {
  const sku = metadata.product_sku || 'AUN250';
  const prices: Record<string, { name: string; price: number }> = {
    'AUN200': { name: 'EZ Cycle Ramp AUN 200', price: 2495 },
    'AUN250': { name: 'EZ Cycle Ramp AUN 250', price: 2795 },
  };
  
  return {
    sku,
    name: prices[sku]?.name || 'EZ Cycle Ramp',
    price: parseFloat(metadata.product_price) || prices[sku]?.price || 2795,
  };
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
  });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Verify Stripe signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No Stripe signature');
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
    
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Received Stripe event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripe, supabase, event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(stripe, supabase, event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(supabase, event.data.object as Stripe.PaymentIntent);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// EVENT HANDLERS
// ============================================

async function handleCheckoutSessionCompleted(
  stripe: Stripe,
  supabase: any,
  session: Stripe.Checkout.Session
) {
  console.log(`Processing checkout session: ${session.id}`);
  
  const metadata = session.metadata || {};
  const product = determineProductFromMetadata(metadata);
  
  // Get shipping quote if exists
  let shippingQuote = null;
  if (metadata.shipping_quote_id) {
    const { data } = await supabase
      .from('shipping_quotes')
      .select('*')
      .eq('quote_id', metadata.shipping_quote_id)
      .single();
    shippingQuote = data;
  }
  
  // Build order data
  const orderData: OrderData = {
    orderNumber: generateOrderNumber(),
    customerEmail: session.customer_details?.email || session.customer_email || '',
    customerPhone: session.customer_details?.phone || undefined,
    customerName: session.customer_details?.name || undefined,
    
    productSku: product.sku,
    productName: product.name,
    productPrice: product.price,
    
    deliveryMethod: metadata.delivery_method as 'shipping' | 'pickup' || 'shipping',
    shippingQuoteId: metadata.shipping_quote_id,
    shippingCost: parseFloat(metadata.shipping_cost) || shippingQuote?.total_rate || 0,
    shippingAddress: session.shipping_details?.address ? {
      streetAddress: session.shipping_details.address.line1 || '',
      apartment: session.shipping_details.address.line2 || undefined,
      city: session.shipping_details.address.city || '',
      state: session.shipping_details.address.state || '',
      zipCode: session.shipping_details.address.postal_code || '',
      country: session.shipping_details.address.country || 'US',
      isResidential: metadata.is_residential === 'true',
    } : undefined,
    destinationTerminal: shippingQuote?.destination_terminal_code ? {
      code: shippingQuote.destination_terminal_code,
      name: shippingQuote.destination_terminal_name,
    } : undefined,
    estimatedTransitDays: shippingQuote?.transit_days,
    
    billingAddress: {
      streetAddress: session.customer_details?.address?.line1 || '',
      city: session.customer_details?.address?.city || '',
      state: session.customer_details?.address?.state || '',
      zipCode: session.customer_details?.address?.postal_code || '',
      country: session.customer_details?.address?.country || 'US',
    },
    
    paymentIntentId: session.payment_intent as string,
    paymentMethod: session.payment_method_types?.[0] || 'card',
    
    subtotal: product.price,
    shippingTotal: parseFloat(metadata.shipping_cost) || 0,
    taxTotal: 0,
    grandTotal: session.amount_total ? session.amount_total / 100 : product.price,
    
    sessionId: metadata.session_id,
    leadId: metadata.lead_id,
    utmSource: metadata.utm_source,
    utmMedium: metadata.utm_medium,
    utmCampaign: metadata.utm_campaign,
  };
  
  await createOrder(supabase, orderData);
}

async function handlePaymentIntentSucceeded(
  stripe: Stripe,
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  console.log(`Processing payment intent: ${paymentIntent.id}`);
  
  // Check if order already exists (might have been created by checkout.session.completed)
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('payment_intent_id', paymentIntent.id)
    .single();
  
  if (existingOrder) {
    console.log(`Order already exists for payment intent ${paymentIntent.id}`);
    return;
  }
  
  const metadata = paymentIntent.metadata || {};
  const product = determineProductFromMetadata(metadata);
  
  // Get shipping quote if exists
  let shippingQuote = null;
  if (metadata.shipping_quote_id) {
    const { data } = await supabase
      .from('shipping_quotes')
      .select('*')
      .eq('quote_id', metadata.shipping_quote_id)
      .single();
    shippingQuote = data;
  }
  
  // Build order from payment intent (less data available than checkout session)
  const orderData: OrderData = {
    orderNumber: generateOrderNumber(),
    customerEmail: metadata.customer_email || paymentIntent.receipt_email || '',
    customerName: metadata.customer_name,
    
    productSku: product.sku,
    productName: product.name,
    productPrice: product.price,
    
    deliveryMethod: metadata.delivery_method as 'shipping' | 'pickup' || 'shipping',
    shippingQuoteId: metadata.shipping_quote_id,
    shippingCost: parseFloat(metadata.shipping_cost) || shippingQuote?.total_rate || 0,
    shippingAddress: metadata.shipping_address ? JSON.parse(metadata.shipping_address) : undefined,
    destinationTerminal: shippingQuote?.destination_terminal_code ? {
      code: shippingQuote.destination_terminal_code,
      name: shippingQuote.destination_terminal_name,
    } : undefined,
    estimatedTransitDays: shippingQuote?.transit_days,
    
    billingAddress: metadata.billing_address 
      ? JSON.parse(metadata.billing_address)
      : { streetAddress: '', city: '', state: '', zipCode: '', country: 'US' },
    
    paymentIntentId: paymentIntent.id,
    paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
    
    subtotal: product.price,
    shippingTotal: parseFloat(metadata.shipping_cost) || 0,
    taxTotal: 0,
    grandTotal: paymentIntent.amount / 100,
    
    sessionId: metadata.session_id,
    leadId: metadata.lead_id,
    utmSource: metadata.utm_source,
    utmMedium: metadata.utm_medium,
    utmCampaign: metadata.utm_campaign,
  };
  
  await createOrder(supabase, orderData);
}

async function handlePaymentFailed(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  
  const metadata = paymentIntent.metadata || {};
  
  // Log failed payment for follow-up
  await supabase.from('payment_failures').insert({
    payment_intent_id: paymentIntent.id,
    customer_email: metadata.customer_email || paymentIntent.receipt_email,
    product_sku: metadata.product_sku,
    amount: paymentIntent.amount / 100,
    failure_code: paymentIntent.last_payment_error?.code,
    failure_message: paymentIntent.last_payment_error?.message,
    session_id: metadata.session_id,
    created_at: new Date().toISOString(),
  });
  
  // Could trigger abandoned cart email here
}

// ============================================
// ORDER CREATION
// ============================================

async function createOrder(supabase: any, orderData: OrderData) {
  console.log(`Creating order: ${orderData.orderNumber}`);
  
  // 1. Find and update lead if exists
  let leadId = orderData.leadId;
  if (!leadId && orderData.customerEmail) {
    const { data: lead } = await supabase
      .from('configurator_leads')
      .select('id')
      .eq('email', orderData.customerEmail.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (lead) {
      leadId = lead.id;
    }
  }
  
  // 2. Create order record
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderData.orderNumber,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
      customer_name: orderData.customerName,
      status: 'pending',
      
      product_sku: orderData.productSku,
      product_name: orderData.productName,
      product_price: orderData.productPrice,
      quantity: 1,
      
      delivery_method: orderData.deliveryMethod,
      shipping_quote_id: orderData.shippingQuoteId,
      shipping_cost: orderData.shippingCost,
      shipping_address: orderData.shippingAddress,
      destination_terminal: orderData.destinationTerminal,
      estimated_transit_days: orderData.estimatedTransitDays,
      
      billing_address: orderData.billingAddress,
      
      payment_intent_id: orderData.paymentIntentId,
      payment_method: orderData.paymentMethod,
      payment_status: 'succeeded',
      
      subtotal: orderData.subtotal,
      shipping_total: orderData.shippingTotal,
      tax_total: orderData.taxTotal,
      grand_total: orderData.grandTotal,
      
      lead_id: leadId,
      session_id: orderData.sessionId,
      utm_source: orderData.utmSource,
      utm_medium: orderData.utmMedium,
      utm_campaign: orderData.utmCampaign,
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (orderError) {
    console.error('Error creating order:', orderError);
    throw orderError;
  }
  
  console.log(`Order created: ${order.id}`);
  
  // 3. Update lead as converted (if exists)
  if (leadId) {
    await supabase
      .from('configurator_leads')
      .update({
        converted_at: new Date().toISOString(),
        order_id: orderData.orderNumber,
      })
      .eq('id', leadId);
    
    // Stop active email sequences
    await supabase
      .from('lead_sequences')
      .update({
        status: 'converted',
        completed_at: new Date().toISOString(),
      })
      .eq('lead_id', leadId)
      .eq('status', 'active');
    
    console.log(`Lead ${leadId} marked as converted`);
  }
  
  // 4. Trigger post-purchase automation
  await Promise.allSettled([
    triggerN8NWorkflow(orderData, order),
    sendOrderConfirmationEmail(orderData, order),
    sendSlackNotification(orderData, order),
    trackConversion(orderData, leadId),
  ]);
  
  return order;
}

// ============================================
// POST-PURCHASE ACTIONS
// ============================================

async function triggerN8NWorkflow(orderData: OrderData, order: any) {
  const webhookUrl = Deno.env.get('N8N_ORDER_WEBHOOK_URL');
  if (!webhookUrl) return { skipped: true };
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'order_created',
        timestamp: new Date().toISOString(),
        order: {
          id: order.id,
          orderNumber: orderData.orderNumber,
          customerEmail: orderData.customerEmail,
          customerName: orderData.customerName,
          productSku: orderData.productSku,
          productName: orderData.productName,
          deliveryMethod: orderData.deliveryMethod,
          shippingAddress: orderData.shippingAddress,
          grandTotal: orderData.grandTotal,
        },
      }),
    });
    console.log('N8N workflow triggered');
  } catch (error) {
    console.error('N8N trigger failed:', error);
  }
}

async function sendOrderConfirmationEmail(orderData: OrderData, order: any) {
  const apiKey = Deno.env.get('SENDGRID_API_KEY');
  if (!apiKey) return { skipped: true };
  
  const templateId = Deno.env.get('SENDGRID_TEMPLATE_ORDER_CONFIRMATION');
  
  try {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: orderData.customerEmail }],
          dynamic_template_data: {
            order_number: orderData.orderNumber,
            customer_name: orderData.customerName || 'Valued Customer',
            product_name: orderData.productName,
            product_price: orderData.productPrice.toFixed(2),
            delivery_method: orderData.deliveryMethod,
            shipping_cost: orderData.shippingCost.toFixed(2),
            grand_total: orderData.grandTotal.toFixed(2),
            shipping_address: orderData.shippingAddress,
            destination_terminal: orderData.destinationTerminal,
            estimated_transit_days: orderData.estimatedTransitDays,
            is_pickup: orderData.deliveryMethod === 'pickup',
          },
        }],
        from: { 
          email: 'orders@ezcycleramp.com', 
          name: 'EZ Cycle Ramp' 
        },
        template_id: templateId,
      }),
    });
    
    // Update order with confirmation sent timestamp
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    await supabase
      .from('orders')
      .update({ order_confirmation_sent_at: new Date().toISOString() })
      .eq('id', order.id);
    
    console.log('Order confirmation email sent');
  } catch (error) {
    console.error('Email send failed:', error);
  }
}

async function sendSlackNotification(orderData: OrderData, order: any) {
  const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
  if (!webhookUrl) return { skipped: true };
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🎉 New Order: ${orderData.orderNumber}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🎉 New Order: ${orderData.orderNumber}`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Product:*\n${orderData.productName}` },
              { type: 'mrkdwn', text: `*Total:*\n$${orderData.grandTotal.toFixed(2)}` },
              { type: 'mrkdwn', text: `*Customer:*\n${orderData.customerEmail}` },
              { type: 'mrkdwn', text: `*Delivery:*\n${orderData.deliveryMethod === 'pickup' ? 'Pickup' : 'Shipping'}` },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: orderData.deliveryMethod === 'shipping' && orderData.shippingAddress
                ? `*Ship to:* ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zipCode}`
                : '*Pickup at:* Woodstock, GA',
            },
          },
        ],
      }),
    });
    console.log('Slack notification sent');
  } catch (error) {
    console.error('Slack notification failed:', error);
  }
}

async function trackConversion(orderData: OrderData, leadId: string | undefined) {
  // This could send conversion data to analytics platforms
  // Google Analytics, Meta Pixel, etc.
  console.log(`Conversion tracked: ${orderData.orderNumber}, lead: ${leadId || 'none'}`);
}
