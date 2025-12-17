// ============================================
// SUPABASE EDGE FUNCTION: trigger-post-purchase-emails
// Manages order lifecycle emails
// ============================================
//
// Deploy: supabase functions deploy trigger-post-purchase-emails
//
// This function can be called:
// 1. Via HTTP endpoint for manual triggers
// 2. Via database webhook on order status changes
// 3. Via cron job for scheduled emails (review requests)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// EMAIL TEMPLATES
// ============================================

const EMAIL_TEMPLATES = {
  // Order Confirmation - sent immediately after purchase
  ORDER_CONFIRMATION: {
    templateId: 'SENDGRID_TEMPLATE_ORDER_CONFIRMATION',
    subject: 'Order Confirmed: {{order_number}}',
    fromName: 'EZ Cycle Ramp',
    fromEmail: 'orders@ezcycleramp.com',
  },
  
  // Shipping Notification - sent when tracking number added
  SHIPPING_NOTIFICATION: {
    templateId: 'SENDGRID_TEMPLATE_SHIPPING',
    subject: 'Your EZ Cycle Ramp is on its way! 🚚',
    fromName: 'EZ Cycle Ramp',
    fromEmail: 'shipping@ezcycleramp.com',
  },
  
  // Out for Delivery - sent day of expected delivery
  OUT_FOR_DELIVERY: {
    templateId: 'SENDGRID_TEMPLATE_OUT_FOR_DELIVERY',
    subject: 'Arriving Today: Your EZ Cycle Ramp',
    fromName: 'EZ Cycle Ramp',
    fromEmail: 'shipping@ezcycleramp.com',
  },
  
  // Delivery Confirmation - sent when marked delivered
  DELIVERY_CONFIRMATION: {
    templateId: 'SENDGRID_TEMPLATE_DELIVERED',
    subject: 'Delivered! Your EZ Cycle Ramp has arrived 📦',
    fromName: 'EZ Cycle Ramp',
    fromEmail: 'hello@ezcycleramp.com',
  },
  
  // Pickup Ready - sent when order ready for pickup
  PICKUP_READY: {
    templateId: 'SENDGRID_TEMPLATE_PICKUP_READY',
    subject: 'Ready for Pickup: Your EZ Cycle Ramp',
    fromName: 'EZ Cycle Ramp',
    fromEmail: 'orders@ezcycleramp.com',
  },
  
  // Review Request - sent 7 days after delivery
  REVIEW_REQUEST: {
    templateId: 'SENDGRID_TEMPLATE_REVIEW_REQUEST',
    subject: 'How\'s your EZ Cycle Ramp? We\'d love your feedback!',
    fromName: 'EZ Cycle Ramp',
    fromEmail: 'hello@ezcycleramp.com',
  },
  
  // Installation Tips - sent 2 days after delivery
  INSTALLATION_TIPS: {
    templateId: 'SENDGRID_TEMPLATE_INSTALLATION',
    subject: 'Getting Started with Your EZ Cycle Ramp',
    fromName: 'EZ Cycle Ramp Support',
    fromEmail: 'support@ezcycleramp.com',
  },
};

// ============================================
// TYPES
// ============================================

interface TriggerRequest {
  type: 'order_confirmation' | 'shipping' | 'out_for_delivery' | 'delivered' | 'pickup_ready' | 'review_request' | 'installation_tips' | 'process_scheduled';
  orderId?: string;
  orderNumber?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  product_sku: string;
  product_name: string;
  product_price: number;
  delivery_method: 'shipping' | 'pickup';
  shipping_address?: any;
  destination_terminal?: any;
  grand_total: number;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery_date?: string;
  delivered_at?: string;
  order_confirmation_sent_at?: string;
  shipping_notification_sent_at?: string;
  delivery_notification_sent_at?: string;
  review_request_sent_at?: string;
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const request: TriggerRequest = await req.json();
    
    // Handle scheduled email processing (called by cron)
    if (request.type === 'process_scheduled') {
      await processScheduledEmails(supabase);
      return new Response(
        JSON.stringify({ success: true, message: 'Scheduled emails processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get order
    let order: Order | null = null;
    
    if (request.orderId) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', request.orderId)
        .single();
      order = data;
    } else if (request.orderNumber) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', request.orderNumber)
        .single();
      order = data;
    }
    
    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process email based on type
    let result;
    switch (request.type) {
      case 'order_confirmation':
        result = await sendOrderConfirmation(supabase, order);
        break;
        
      case 'shipping':
        result = await sendShippingNotification(supabase, order, {
          trackingNumber: request.trackingNumber,
          trackingUrl: request.trackingUrl,
          carrier: request.carrier,
          estimatedDelivery: request.estimatedDelivery,
        });
        break;
        
      case 'out_for_delivery':
        result = await sendOutForDelivery(supabase, order);
        break;
        
      case 'delivered':
        result = await sendDeliveryConfirmation(supabase, order);
        break;
        
      case 'pickup_ready':
        result = await sendPickupReady(supabase, order);
        break;
        
      case 'review_request':
        result = await sendReviewRequest(supabase, order);
        break;
        
      case 'installation_tips':
        result = await sendInstallationTips(supabase, order);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: `Unknown email type: ${request.type}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Email trigger error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// EMAIL FUNCTIONS
// ============================================

async function sendEmail(
  templateKey: keyof typeof EMAIL_TEMPLATES,
  to: string,
  dynamicData: Record<string, any>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = Deno.env.get('SENDGRID_API_KEY');
  if (!apiKey) {
    return { success: false, error: 'SendGrid API key not configured' };
  }
  
  const template = EMAIL_TEMPLATES[templateKey];
  const templateId = Deno.env.get(template.templateId);
  
  if (!templateId) {
    console.warn(`Template ID not found for ${templateKey}, using fallback`);
  }
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          dynamic_template_data: dynamicData,
        }],
        from: {
          email: template.fromEmail,
          name: template.fromName,
        },
        template_id: templateId,
        // Fallback subject if template doesn't have one
        subject: template.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => dynamicData[key] || ''),
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }
    
    const messageId = response.headers.get('x-message-id');
    return { success: true, messageId: messageId || undefined };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendOrderConfirmation(supabase: any, order: Order) {
  // Skip if already sent
  if (order.order_confirmation_sent_at) {
    return { skipped: true, reason: 'Already sent' };
  }
  
  const result = await sendEmail('ORDER_CONFIRMATION', order.customer_email, {
    order_number: order.order_number,
    customer_name: order.customer_name || 'Valued Customer',
    product_name: order.product_name,
    product_price: order.product_price.toFixed(2),
    grand_total: order.grand_total.toFixed(2),
    delivery_method: order.delivery_method,
    is_pickup: order.delivery_method === 'pickup',
    shipping_address: order.shipping_address,
    destination_terminal: order.destination_terminal,
    pickup_location: {
      name: 'EZ Cycle Ramp Warehouse',
      address: '2500 Continental Blvd',
      city: 'Woodstock',
      state: 'GA',
      zip: '30188',
      phone: '(937) 725-6790',
    },
    support_phone: '(937) 725-6790',
    support_email: 'support@ezcycleramp.com',
  });
  
  if (result.success) {
    await supabase
      .from('orders')
      .update({ order_confirmation_sent_at: new Date().toISOString() })
      .eq('id', order.id);
  }
  
  return result;
}

async function sendShippingNotification(
  supabase: any,
  order: Order,
  shipping: {
    trackingNumber?: string;
    trackingUrl?: string;
    carrier?: string;
    estimatedDelivery?: string;
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
    .eq('id', order.id);
  
  // Generate tracking URL if not provided
  const trackingUrl = shipping.trackingUrl || 
    `https://www.tforcefreight.com/ltl/apps/Tracking?TrackingNumber=${shipping.trackingNumber}`;
  
  const result = await sendEmail('SHIPPING_NOTIFICATION', order.customer_email, {
    order_number: order.order_number,
    customer_name: order.customer_name || 'Valued Customer',
    product_name: order.product_name,
    tracking_number: shipping.trackingNumber,
    tracking_url: trackingUrl,
    carrier: shipping.carrier || 'T-Force Freight',
    estimated_delivery: shipping.estimatedDelivery,
    shipping_address: order.shipping_address,
    destination_terminal: order.destination_terminal,
    is_residential: order.shipping_address?.is_residential,
  });
  
  if (result.success) {
    await supabase
      .from('orders')
      .update({ shipping_notification_sent_at: new Date().toISOString() })
      .eq('id', order.id);
  }
  
  return result;
}

async function sendOutForDelivery(supabase: any, order: Order) {
  const result = await sendEmail('OUT_FOR_DELIVERY', order.customer_email, {
    order_number: order.order_number,
    customer_name: order.customer_name || 'Valued Customer',
    product_name: order.product_name,
    tracking_number: order.tracking_number,
    tracking_url: `https://www.tforcefreight.com/ltl/apps/Tracking?TrackingNumber=${order.tracking_number}`,
    shipping_address: order.shipping_address,
    destination_terminal: order.destination_terminal,
    delivery_instructions: order.shipping_address?.is_residential
      ? 'The driver will call before delivery and use a liftgate for unloading.'
      : 'Please pick up at the terminal listed below.',
  });
  
  return result;
}

async function sendDeliveryConfirmation(supabase: any, order: Order) {
  // Update order status
  await supabase
    .from('orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', order.id);
  
  const result = await sendEmail('DELIVERY_CONFIRMATION', order.customer_email, {
    order_number: order.order_number,
    customer_name: order.customer_name || 'Valued Customer',
    product_name: order.product_name,
    installation_guide_url: 'https://ezcycleramp.com/installation',
    video_url: 'https://ezcycleramp.com/videos/setup',
    support_phone: '(937) 725-6790',
    support_email: 'support@ezcycleramp.com',
  });
  
  if (result.success) {
    await supabase
      .from('orders')
      .update({ delivery_notification_sent_at: new Date().toISOString() })
      .eq('id', order.id);
    
    // Schedule review request for 7 days later
    await supabase.from('scheduled_emails').insert({
      order_id: order.id,
      email_type: 'review_request',
      scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });
    
    // Schedule installation tips for 2 days later
    await supabase.from('scheduled_emails').insert({
      order_id: order.id,
      email_type: 'installation_tips',
      scheduled_for: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    });
  }
  
  return result;
}

async function sendPickupReady(supabase: any, order: Order) {
  // Update order
  await supabase
    .from('orders')
    .update({
      pickup_ready_at: new Date().toISOString(),
      pickup_notified_at: new Date().toISOString(),
    })
    .eq('id', order.id);
  
  const result = await sendEmail('PICKUP_READY', order.customer_email, {
    order_number: order.order_number,
    customer_name: order.customer_name || 'Valued Customer',
    product_name: order.product_name,
    pickup_location: {
      name: 'EZ Cycle Ramp Warehouse',
      address: '2500 Continental Blvd',
      city: 'Woodstock',
      state: 'GA',
      zip: '30188',
      hours: 'Monday - Friday, 8am - 5pm',
      phone: '(937) 725-6790',
    },
    what_to_bring: [
      'Photo ID',
      'Order confirmation email',
      'Vehicle capable of transporting the ramp',
    ],
  });
  
  // Also send SMS if phone number available
  if (order.customer_phone) {
    await sendPickupReadySMS(order);
  }
  
  return result;
}

async function sendPickupReadySMS(order: Order) {
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioFrom = Deno.env.get('TWILIO_FROM_NUMBER');
  
  if (!twilioSid || !twilioAuth || !twilioFrom || !order.customer_phone) {
    return { skipped: true };
  }
  
  try {
    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: order.customer_phone,
          From: twilioFrom,
          Body: `🎉 Your EZ Cycle Ramp is ready for pickup! Order ${order.order_number}. Location: 2500 Continental Blvd, Woodstock, GA 30188. Hours: Mon-Fri 8am-5pm. Questions? (937) 725-6790`,
        }),
      }
    );
  } catch (error) {
    console.error('SMS send failed:', error);
  }
}

async function sendReviewRequest(supabase: any, order: Order) {
  // Skip if already sent
  if (order.review_request_sent_at) {
    return { skipped: true, reason: 'Already sent' };
  }
  
  const result = await sendEmail('REVIEW_REQUEST', order.customer_email, {
    order_number: order.order_number,
    customer_name: order.customer_name || 'Valued Customer',
    product_name: order.product_name,
    review_url: 'https://ezcycleramp.com/review',
    google_review_url: 'https://g.page/r/YOUR_GOOGLE_BUSINESS_ID/review',
    days_since_delivery: 7,
  });
  
  if (result.success) {
    await supabase
      .from('orders')
      .update({ review_request_sent_at: new Date().toISOString() })
      .eq('id', order.id);
  }
  
  return result;
}

async function sendInstallationTips(supabase: any, order: Order) {
  const result = await sendEmail('INSTALLATION_TIPS', order.customer_email, {
    order_number: order.order_number,
    customer_name: order.customer_name || 'Valued Customer',
    product_name: order.product_name,
    product_sku: order.product_sku,
    installation_guide_url: `https://ezcycleramp.com/installation/${order.product_sku.toLowerCase()}`,
    video_url: 'https://ezcycleramp.com/videos/installation',
    tips: [
      'Allow 3-4 hours for assembly',
      'A second person makes installation easier',
      'Have a cordless drill ready',
      'Watch the video guide before starting',
    ],
    support_phone: '(937) 725-6790',
  });
  
  return result;
}

// ============================================
// SCHEDULED EMAIL PROCESSOR
// ============================================

async function processScheduledEmails(supabase: any) {
  // Get pending scheduled emails that are due
  const { data: scheduledEmails, error } = await supabase
    .from('scheduled_emails')
    .select(`
      *,
      orders (*)
    `)
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50);
  
  if (error || !scheduledEmails) {
    console.error('Error fetching scheduled emails:', error);
    return { processed: 0 };
  }
  
  let processed = 0;
  
  for (const scheduled of scheduledEmails) {
    try {
      let result;
      
      switch (scheduled.email_type) {
        case 'review_request':
          result = await sendReviewRequest(supabase, scheduled.orders);
          break;
        case 'installation_tips':
          result = await sendInstallationTips(supabase, scheduled.orders);
          break;
        default:
          console.warn(`Unknown scheduled email type: ${scheduled.email_type}`);
          continue;
      }
      
      // Update scheduled email status
      await supabase
        .from('scheduled_emails')
        .update({
          status: result.success ? 'sent' : 'failed',
          sent_at: result.success ? new Date().toISOString() : null,
          error: result.error,
        })
        .eq('id', scheduled.id);
      
      if (result.success) {
        processed++;
      }
      
    } catch (error) {
      console.error(`Error processing scheduled email ${scheduled.id}:`, error);
      
      await supabase
        .from('scheduled_emails')
        .update({
          status: 'failed',
          error: error.message,
        })
        .eq('id', scheduled.id);
    }
  }
  
  return { processed };
}
