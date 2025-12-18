/**
 * seed-order-templates.ts
 * Seeds production email and SMS templates for order lifecycle communications.
 *
 * Templates Created:
 * - Email: Order Confirmation, Shipping, Delivery, Pickup Ready, Review Request, Installation Tips
 * - SMS: Order Confirmation, Shipping, Pickup Ready
 *
 * Usage:
 *   npx tsx scripts/seed-order-templates.ts
 *
 * Env required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 *   EZCR_TENANT_ID
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load .env.local (Next.js convention)
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// ============================================
// EMAIL TEMPLATE HTML
// ============================================

const baseStyles = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;`;

const headerHtml = (title: string, subtitle?: string) => `
<div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
  <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
  ${subtitle ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${subtitle}</p>` : ''}
</div>`;

const footerHtml = `
<div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
  <p style="margin: 0;">EZ Cycle Ramp | 2500 Continental Blvd, Woodstock, GA 30188</p>
  <p style="margin: 5px 0 0 0;">&copy; 2024 EZ Cycle Ramp. All rights reserved.</p>
</div>`;

const supportHtml = `
<div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
  <p style="color: #6b7280; margin: 0;">
    Questions? Contact us at<br>
    <a href="mailto:support@ezcycleramp.com" style="color: #2563eb;">support@ezcycleramp.com</a>
    or call <a href="tel:+19377256790" style="color: #2563eb;">(937) 725-6790</a>
  </p>
</div>`;

// ============================================
// TEMPLATE DEFINITIONS
// ============================================

interface TemplateDefinition {
  name: string;
  channel: "email" | "sms";
  subject: string | null;
  text_body: string;
  html_body: string | null;
}

const templates: TemplateDefinition[] = [
  // ========================================
  // 1. ORDER CONFIRMATION - EMAIL
  // ========================================
  {
    name: "order-confirmation-email",
    channel: "email",
    subject: "Order Confirmed: {{order.number}}",
    text_body: `Hi {{contact.display_name}},

We've received your order and are getting it ready. Here's a summary:

Order Number: {{order.number}}

Items:
{{order.items_text}}

Subtotal: {{order.subtotal}}
Shipping: {{order.shipping}}
Tax: {{order.tax}}
Total: {{order.total}}

Shipping Address:
{{order.shipping_address_text}}

What's Next?
We'll send you another email with tracking information once your order ships.
For LTL freight shipments, the carrier will call you to schedule delivery.

Questions? Contact us at support@ezcycleramp.com or call (937) 725-6790

— EZ Cycle Ramp`,
    html_body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - {{order.number}}</title>
</head>
<body style="${baseStyles}">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${headerHtml('Order Confirmed!', 'Thank you for your purchase')}

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="margin-top: 0;">Hi {{contact.display_name}},</p>
      <p>We've received your order and are getting it ready. Here's a summary of what you ordered:</p>

      <!-- Order Number -->
      <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #0369a1;">
          <strong>Order Number:</strong> {{order.number}}
        </p>
      </div>

      <!-- Items Table -->
      {{{order.items_table}}}

      <!-- Totals -->
      <div style="border-top: 2px solid #e5e7eb; padding-top: 15px;">
        <table style="width: 100%; margin-left: auto;">
          <tr>
            <td style="padding: 5px 0; text-align: right;">Subtotal:</td>
            <td style="padding: 5px 0; text-align: right; width: 120px;">{{order.subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; text-align: right;">Shipping:</td>
            <td style="padding: 5px 0; text-align: right;">{{order.shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; text-align: right;">Tax:</td>
            <td style="padding: 5px 0; text-align: right;">{{order.tax}}</td>
          </tr>
          <tr style="font-weight: bold; font-size: 18px;">
            <td style="padding: 10px 0; text-align: right; border-top: 2px solid #1e40af;">Total:</td>
            <td style="padding: 10px 0; text-align: right; border-top: 2px solid #1e40af; color: #1e40af;">{{order.total}}</td>
          </tr>
        </table>
      </div>

      <!-- Shipping Address -->
      <div style="margin-top: 30px;">
        <h3 style="color: #374151; margin-bottom: 10px;">Shipping Address</h3>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
          {{{order.shipping_address}}}
        </div>
      </div>

      <!-- What's Next -->
      <div style="margin-top: 30px; padding: 20px; background: #fefce8; border-radius: 8px; border-left: 4px solid #eab308;">
        <h3 style="margin: 0 0 10px 0; color: #854d0e;">What's Next?</h3>
        <p style="margin: 0; color: #713f12;">
          We'll send you another email with tracking information once your order ships.
          For LTL freight shipments, the carrier will call you to schedule delivery.
        </p>
      </div>

      ${supportHtml}
    </div>
    ${footerHtml}
  </div>
</body>
</html>`,
  },

  // ========================================
  // 2. ORDER CONFIRMATION - SMS
  // ========================================
  {
    name: "order-confirmation-sms",
    channel: "sms",
    subject: null,
    text_body: `EZ Cycle Ramp: Order {{order.number}} confirmed! {{order.total}}. We'll email tracking when it ships. Questions? (937) 725-6790`,
    html_body: null,
  },

  // ========================================
  // 3. SHIPPING NOTIFICATION - EMAIL
  // ========================================
  {
    name: "shipping-notification-email",
    channel: "email",
    subject: "Your EZ Cycle Ramp is on its way! Order {{order.number}}",
    text_body: `Hi {{contact.display_name}},

Great news! Your {{order.product_name}} is on its way!

Order: {{order.number}}
Carrier: {{shipping.carrier}}
Tracking Number: {{shipping.tracking_number}}
Estimated Delivery: {{shipping.estimated_delivery}}

Track your shipment: {{shipping.tracking_url}}

{{shipping.delivery_type_text}}

Shipping To:
{{shipping.address_text}}

Questions? Contact us at support@ezcycleramp.com or call (937) 725-6790

— EZ Cycle Ramp`,
    html_body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Shipped!</title>
</head>
<body style="${baseStyles}">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${headerHtml('Your Order Has Shipped!', 'Track your delivery')}

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="margin-top: 0;">Hi {{contact.display_name}},</p>
      <p>Great news! Your <strong>{{order.product_name}}</strong> is on its way!</p>

      <!-- Tracking Info -->
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: #0369a1;"><strong>Order:</strong> {{order.number}}</p>
        <p style="margin: 0 0 10px 0; color: #0369a1;"><strong>Carrier:</strong> {{shipping.carrier}}</p>
        <p style="margin: 0 0 15px 0; color: #0369a1;"><strong>Tracking Number:</strong> {{shipping.tracking_number}}</p>
        <p style="margin: 0 0 15px 0; color: #0369a1;"><strong>Estimated Delivery:</strong> {{shipping.estimated_delivery}}</p>
        <a href="{{shipping.tracking_url}}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Track Your Shipment
        </a>
      </div>

      {{{shipping.delivery_type_info}}}

      <!-- Shipping Address -->
      <div style="margin-top: 20px;">
        <h3 style="color: #374151; margin-bottom: 10px;">Shipping To</h3>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
          {{{shipping.address}}}
        </div>
      </div>

      ${supportHtml}
    </div>
    ${footerHtml}
  </div>
</body>
</html>`,
  },

  // ========================================
  // 4. SHIPPING NOTIFICATION - SMS
  // ========================================
  {
    name: "shipping-notification-sms",
    channel: "sms",
    subject: null,
    text_body: `EZ Cycle Ramp: Order {{order.number}} shipped! Track: {{shipping.tracking_url}} ETA: {{shipping.estimated_delivery}}`,
    html_body: null,
  },

  // ========================================
  // 5. DELIVERY CONFIRMATION - EMAIL
  // ========================================
  {
    name: "delivery-confirmation-email",
    channel: "email",
    subject: "Delivered! Your EZ Cycle Ramp has arrived",
    text_body: `Hi {{contact.display_name}},

Your {{order.product_name}} has been delivered! We hope you love it.

Getting Started:
- Check all parts against the included packing list
- Watch our installation video before starting
- Assembly typically takes 3-4 hours
- A second person makes installation easier

Installation Guide: https://ezcycleramp.com/installation
Watch Video: https://ezcycleramp.com/videos/setup

Need help with installation? Our support team is available Mon-Fri, 8am-5pm EST.

Questions? Contact us at support@ezcycleramp.com or call (937) 725-6790

— EZ Cycle Ramp`,
    html_body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Been Delivered!</title>
</head>
<body style="${baseStyles}">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${headerHtml('Delivered!', 'Your EZ Cycle Ramp has arrived')}

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="margin-top: 0;">Hi {{contact.display_name}},</p>
      <p>Your <strong>{{order.product_name}}</strong> has been delivered! We hope you love it.</p>

      <!-- Getting Started -->
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
        <h3 style="margin: 0 0 15px 0; color: #15803d;">Getting Started</h3>
        <ul style="margin: 0; padding-left: 20px; color: #166534;">
          <li style="margin-bottom: 8px;">Check all parts against the included packing list</li>
          <li style="margin-bottom: 8px;">Watch our installation video before starting</li>
          <li style="margin-bottom: 8px;">Assembly typically takes 3-4 hours</li>
          <li>A second person makes installation easier</li>
        </ul>
      </div>

      <!-- Resources -->
      <div style="margin: 20px 0;">
        <a href="https://ezcycleramp.com/installation" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-right: 10px; margin-bottom: 10px;">
          Installation Guide
        </a>
        <a href="https://ezcycleramp.com/videos/setup" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Watch Video
        </a>
      </div>

      <!-- Help -->
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;">
          <strong>Need help with installation?</strong> Our support team is available Mon-Fri, 8am-5pm EST.
          We're happy to walk you through any questions!
        </p>
      </div>

      ${supportHtml}
    </div>
    ${footerHtml}
  </div>
</body>
</html>`,
  },

  // ========================================
  // 6. PICKUP READY - EMAIL
  // ========================================
  {
    name: "pickup-ready-email",
    channel: "email",
    subject: "Ready for Pickup: Order {{order.number}}",
    text_body: `Hi {{contact.display_name}},

Great news! Your {{order.product_name}} (Order {{order.number}}) is ready for pickup!

Pickup Location:
EZ Cycle Ramp Warehouse
2500 Continental Blvd
Woodstock, GA 30188

Hours: Monday - Friday, 8am - 5pm
Phone: (937) 725-6790

What to Bring:
- Photo ID
- This email or your order confirmation
- A vehicle capable of transporting the ramp (truck or trailer recommended)

Questions? Contact us at support@ezcycleramp.com or call (937) 725-6790

— EZ Cycle Ramp`,
    html_body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order is Ready for Pickup!</title>
</head>
<body style="${baseStyles}">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${headerHtml('Ready for Pickup!', 'Your order is waiting')}

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="margin-top: 0;">Hi {{contact.display_name}},</p>
      <p>Great news! Your <strong>{{order.product_name}}</strong> (Order {{order.number}}) is ready for pickup!</p>

      <!-- Pickup Location -->
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #0369a1;">Pickup Location</h3>
        <p style="margin: 0; color: #075985;">
          <strong>EZ Cycle Ramp Warehouse</strong><br>
          2500 Continental Blvd<br>
          Woodstock, GA 30188<br><br>
          <strong>Hours:</strong> Monday - Friday, 8am - 5pm<br>
          <strong>Phone:</strong> (937) 725-6790
        </p>
      </div>

      <!-- What to Bring -->
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <h4 style="margin: 0 0 10px 0; color: #92400e;">What to Bring</h4>
        <ul style="margin: 0; padding-left: 20px; color: #78350f;">
          <li>Photo ID</li>
          <li>This email or your order confirmation</li>
          <li>A vehicle capable of transporting the ramp (truck or trailer recommended)</li>
        </ul>
      </div>

      ${supportHtml}
    </div>
    ${footerHtml}
  </div>
</body>
</html>`,
  },

  // ========================================
  // 7. PICKUP READY - SMS
  // ========================================
  {
    name: "pickup-ready-sms",
    channel: "sms",
    subject: null,
    text_body: `EZ Cycle Ramp: Order {{order.number}} ready for pickup! 2500 Continental Blvd, Woodstock GA. Mon-Fri 8am-5pm. Bring ID + this text.`,
    html_body: null,
  },

  // ========================================
  // 8. REVIEW REQUEST - EMAIL
  // ========================================
  {
    name: "review-request-email",
    channel: "email",
    subject: "How's your EZ Cycle Ramp? We'd love your feedback!",
    text_body: `Hi {{contact.display_name}},

We hope you're enjoying your {{order.product_name}}! It's been about a week since delivery, and we'd love to hear how things are going.

Your feedback helps other motorcycle enthusiasts make informed decisions and helps us continue improving our products.

Share Your Experience: https://ezcycleramp.com/review?order={{order.number}}

Or leave a Google review: https://g.page/ezcycleramp/review

Having any issues? Reply to this email or call us at (937) 725-6790. We're here to make sure you have the best experience possible.

Thank you for choosing EZ Cycle Ramp!

— EZ Cycle Ramp`,
    html_body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How's Your EZ Cycle Ramp?</title>
</head>
<body style="${baseStyles}">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${headerHtml("How's Your Ramp?", "We'd love your feedback")}

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="margin-top: 0;">Hi {{contact.display_name}},</p>
      <p>We hope you're enjoying your <strong>{{order.product_name}}</strong>! It's been about a week since delivery, and we'd love to hear how things are going.</p>

      <p>Your feedback helps other motorcycle enthusiasts make informed decisions and helps us continue improving our products.</p>

      <!-- Review CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://ezcycleramp.com/review?order={{order.number}}" style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 16px;">
          Share Your Experience
        </a>
      </div>

      <!-- Google Review -->
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="color: #6b7280; margin-bottom: 10px;">Or leave a Google review:</p>
        <a href="https://g.page/ezcycleramp/review" style="color: #2563eb; text-decoration: none;">
          Leave a Google Review
        </a>
      </div>

      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Having any issues? Reply to this email or call us at (937) 725-6790.
          We're here to make sure you have the best experience possible.
        </p>
      </div>

      <p style="margin-bottom: 0;">Thank you for choosing EZ Cycle Ramp!</p>
    </div>
    ${footerHtml}
  </div>
</body>
</html>`,
  },

  // ========================================
  // 9. INSTALLATION TIPS - EMAIL
  // ========================================
  {
    name: "installation-tips-email",
    channel: "email",
    subject: "Getting Started with Your {{order.product_name}}",
    text_body: `Hi {{contact.display_name}},

Ready to set up your {{order.product_name}}? Here are some tips to make installation smooth and easy!

Watch Before You Start: https://ezcycleramp.com/videos/installation

Pro Tips:

1. Plan Ahead
Allow 3-4 hours for assembly. Having a helper makes it easier.

2. Gather Tools
You'll need a cordless drill, socket set, and level.

3. Check Your Parts
Verify all parts against the packing list before starting.

4. Level Surface
Install on a level surface for best results and safety.

Download PDF Guide: https://ezcycleramp.com/installation/{{product.sku_lower}}

Questions? Contact us at support@ezcycleramp.com or call (937) 725-6790

— EZ Cycle Ramp`,
    html_body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Installation Tips for Your EZ Cycle Ramp</title>
</head>
<body style="${baseStyles}">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${headerHtml('Installation Tips', 'Get the most out of your ramp')}

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="margin-top: 0;">Hi {{contact.display_name}},</p>
      <p>Ready to set up your <strong>{{order.product_name}}</strong>? Here are some tips to make installation smooth and easy!</p>

      <!-- Video CTA -->
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 15px 0; color: #0369a1; font-weight: 500;">Watch Before You Start</p>
        <a href="https://ezcycleramp.com/videos/installation" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Watch Installation Video
        </a>
      </div>

      <!-- Tips -->
      <div style="margin: 20px 0;">
        <h3 style="color: #374151; margin-bottom: 15px;">Pro Tips</h3>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
          <p style="margin: 0;"><strong>1. Plan Ahead</strong></p>
          <p style="margin: 5px 0 0 0; color: #6b7280;">Allow 3-4 hours for assembly. Having a helper makes it easier.</p>
        </div>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
          <p style="margin: 0;"><strong>2. Gather Tools</strong></p>
          <p style="margin: 5px 0 0 0; color: #6b7280;">You'll need a cordless drill, socket set, and level.</p>
        </div>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
          <p style="margin: 0;"><strong>3. Check Your Parts</strong></p>
          <p style="margin: 5px 0 0 0; color: #6b7280;">Verify all parts against the packing list before starting.</p>
        </div>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
          <p style="margin: 0;"><strong>4. Level Surface</strong></p>
          <p style="margin: 5px 0 0 0; color: #6b7280;">Install on a level surface for best results and safety.</p>
        </div>
      </div>

      <!-- Resources -->
      <div style="margin: 20px 0;">
        <a href="https://ezcycleramp.com/installation/{{product.sku_lower}}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Download PDF Guide
        </a>
      </div>

      ${supportHtml}
    </div>
    ${footerHtml}
  </div>
</body>
</html>`,
  },
];

// ============================================
// SEEDING LOGIC
// ============================================

async function upsertTemplate(tenantId: string, template: TemplateDefinition) {
  // Check if template exists
  const { data: existing } = await supabase
    .from("comms_templates")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("name", template.name)
    .single();

  let templateId: string;

  if (existing) {
    templateId = existing.id;
    console.log(`[seed] Template "${template.name}" already exists`);
  } else {
    const { data: created, error } = await supabase
      .from("comms_templates")
      .insert({
        tenant_id: tenantId,
        name: template.name,
        channel: template.channel,
        status: "draft",
      })
      .select("id")
      .single();

    if (error) throw error;
    templateId = created.id;
    console.log(`[seed] Created template "${template.name}"`);
  }

  // Check if version exists
  const { data: existingVersion } = await supabase
    .from("comms_template_versions")
    .select("id")
    .eq("template_id", templateId)
    .eq("version_number", 1)
    .single();

  let versionId: string;

  if (existingVersion) {
    // Update existing version
    const { error } = await supabase
      .from("comms_template_versions")
      .update({
        subject: template.subject,
        text_body: template.text_body,
        html_body: template.html_body,
        metadata: { updated_by_seed: true, updated_at: new Date().toISOString() },
      })
      .eq("id", existingVersion.id);

    if (error) throw error;
    versionId = existingVersion.id;
    console.log(`[seed] Updated version for "${template.name}"`);
  } else {
    const { data: created, error } = await supabase
      .from("comms_template_versions")
      .insert({
        tenant_id: tenantId,
        template_id: templateId,
        version_number: 1,
        channel: template.channel,
        subject: template.subject,
        text_body: template.text_body,
        html_body: template.html_body,
        metadata: { seeded: true },
      })
      .select("id")
      .single();

    if (error) throw error;
    versionId = created.id;
    console.log(`[seed] Created version for "${template.name}"`);
  }

  // Activate template
  await supabase
    .from("comms_templates")
    .update({ active_version_id: versionId, status: "active" })
    .eq("id", templateId);

  return { templateId, versionId };
}

async function main() {
  const tenantId = must("EZCR_TENANT_ID");

  console.log("[seed] Starting order templates seed...");
  console.log(`[seed] Tenant ID: ${tenantId}`);
  console.log(`[seed] Templates to seed: ${templates.length}`);
  console.log("");

  for (const template of templates) {
    await upsertTemplate(tenantId, template);
  }

  console.log("");
  console.log("[seed] Done! All templates seeded successfully.");
  console.log("[seed] View templates at: /admin/comms/templates");
}

main().catch((e) => {
  console.error("[seed] Error:", e);
  process.exit(1);
});
