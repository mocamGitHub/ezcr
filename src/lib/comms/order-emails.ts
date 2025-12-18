/**
 * Order Email Service
 * Sends order lifecycle emails and SMS via the Comms Pack (Mailgun/Twilio).
 *
 * Usage:
 *   import { sendOrderEmail } from '@/lib/comms/order-emails'
 *
 *   await sendOrderEmail({
 *     type: 'order_confirmation',
 *     order: { ... },
 *     channel: 'both', // 'email' | 'sms' | 'both'
 *   })
 */

import { createSupabaseAdmin } from "@/lib/comms/admin";
import { queueAndSendNow } from "@/lib/comms/sendPipeline";

// ============================================
// TYPES
// ============================================

export type EmailType =
  | "order_confirmation"
  | "shipping"
  | "delivery"
  | "pickup_ready"
  | "review_request"
  | "installation_tips";

export interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isResidential?: boolean;
}

export interface DestinationTerminal {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
  estimatedDelivery?: string;
}

export interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  productName: string;
  productSku?: string;
  items?: OrderItem[];
  subtotal?: number;
  shipping?: number;
  tax?: number;
  total: number;
  shippingAddress?: ShippingAddress;
  destinationTerminal?: DestinationTerminal;
}

export interface SendOrderEmailParams {
  type: EmailType;
  order: OrderData;
  trackingInfo?: TrackingInfo;
  channel?: "email" | "sms" | "both";
}

export interface SendResult {
  success: boolean;
  emailMessageId?: string;
  smsMessageId?: string;
  errors?: string[];
}

// ============================================
// TEMPLATE NAME MAPPING
// ============================================

const EMAIL_TEMPLATE_NAMES: Record<EmailType, string> = {
  order_confirmation: "order-confirmation-email",
  shipping: "shipping-notification-email",
  delivery: "delivery-confirmation-email",
  pickup_ready: "pickup-ready-email",
  review_request: "review-request-email",
  installation_tips: "installation-tips-email",
};

const SMS_TEMPLATE_NAMES: Partial<Record<EmailType, string>> = {
  order_confirmation: "order-confirmation-sms",
  shipping: "shipping-notification-sms",
  pickup_ready: "pickup-ready-sms",
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Renders order items as an HTML table for email templates.
 */
export function renderOrderItemsTable(items: OrderItem[]): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.total_price)}</td>
      </tr>
    `
    )
    .join("");

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/**
 * Renders order items as plain text for SMS/text body.
 */
export function renderOrderItemsText(items: OrderItem[]): string {
  return items
    .map((item) => `- ${item.product_name} x${item.quantity}: ${formatCurrency(item.total_price)}`)
    .join("\n");
}

/**
 * Renders shipping address as HTML.
 */
export function renderShippingAddressHtml(address: ShippingAddress): string {
  return `
    <p style="margin: 0;">
      ${address.line1}<br>
      ${address.line2 ? address.line2 + "<br>" : ""}
      ${address.city}, ${address.state} ${address.postalCode}<br>
      ${address.country || "US"}
    </p>
  `;
}

/**
 * Renders shipping address as plain text.
 */
export function renderShippingAddressText(address: ShippingAddress): string {
  const lines = [address.line1];
  if (address.line2) lines.push(address.line2);
  lines.push(`${address.city}, ${address.state} ${address.postalCode}`);
  if (address.country && address.country !== "US") lines.push(address.country);
  return lines.join("\n");
}

/**
 * Renders delivery type info (residential or terminal pickup) as HTML.
 */
export function renderDeliveryTypeInfoHtml(
  isResidential?: boolean,
  terminal?: DestinationTerminal
): string {
  if (isResidential) {
    return `
      <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0; color: #047857;">
          <strong>Residential Delivery:</strong> The carrier will call you to schedule a delivery appointment.
          A liftgate will be used for unloading.
        </p>
      </div>
    `;
  }

  if (terminal) {
    return `
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0 0 10px 0; color: #92400e;"><strong>Terminal Pickup Required</strong></p>
        <p style="margin: 0; color: #78350f;">
          <strong>${terminal.name}</strong><br>
          ${terminal.address}<br>
          ${terminal.city}, ${terminal.state} ${terminal.zip}<br>
          Phone: ${terminal.phone}
        </p>
      </div>
    `;
  }

  return "";
}

/**
 * Renders delivery type info as plain text.
 */
export function renderDeliveryTypeInfoText(
  isResidential?: boolean,
  terminal?: DestinationTerminal
): string {
  if (isResidential) {
    return "Residential Delivery: The carrier will call you to schedule a delivery appointment. A liftgate will be used for unloading.";
  }

  if (terminal) {
    return `Terminal Pickup Required:\n${terminal.name}\n${terminal.address}\n${terminal.city}, ${terminal.state} ${terminal.zip}\nPhone: ${terminal.phone}`;
  }

  return "";
}

// ============================================
// CONTACT MANAGEMENT
// ============================================

/**
 * Gets or creates a contact by email address.
 * Also ensures channel preferences are set to opted_in for transactional messages.
 */
async function getOrCreateContact(
  tenantId: string,
  email: string,
  phone?: string,
  displayName?: string
): Promise<string> {
  const supabase = createSupabaseAdmin();

  // Try to find existing contact by email
  const { data: existing } = await supabase
    .from("comms_contacts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email.toLowerCase().trim())
    .single();

  if (existing?.id) {
    // Update phone/name if provided and different
    if (phone || displayName) {
      await supabase
        .from("comms_contacts")
        .update({
          ...(phone ? { phone_e164: phone } : {}),
          ...(displayName ? { display_name: displayName } : {}),
        })
        .eq("id", existing.id);
    }
    return existing.id;
  }

  // Create new contact
  const { data: created, error } = await supabase
    .from("comms_contacts")
    .insert({
      tenant_id: tenantId,
      email: email.toLowerCase().trim(),
      phone_e164: phone || null,
      display_name: displayName || email.split("@")[0],
      metadata: { source: "order" },
    })
    .select("id")
    .single();

  if (error) throw error;

  // Set channel preferences to opted_in for transactional messages
  await supabase.from("comms_channel_preferences").upsert(
    [
      {
        tenant_id: tenantId,
        contact_id: created.id,
        channel: "email",
        consent_status: "opted_in",
        consent_source: "transactional",
      },
      ...(phone
        ? [
            {
              tenant_id: tenantId,
              contact_id: created.id,
              channel: "sms" as const,
              consent_status: "opted_in" as const,
              consent_source: "transactional",
            },
          ]
        : []),
    ],
    { onConflict: "tenant_id,contact_id,channel" }
  );

  return created.id;
}

/**
 * Gets the active template version ID by template name.
 */
async function getTemplateVersionId(
  tenantId: string,
  templateName: string
): Promise<string | null> {
  const supabase = createSupabaseAdmin();

  const { data } = await supabase
    .from("comms_templates")
    .select("active_version_id")
    .eq("tenant_id", tenantId)
    .eq("name", templateName)
    .eq("status", "active")
    .single();

  return data?.active_version_id || null;
}

// ============================================
// MAIN SEND FUNCTION
// ============================================

/**
 * Sends an order lifecycle email and/or SMS.
 *
 * @example
 * // Send order confirmation email and SMS
 * await sendOrderEmail({
 *   type: 'order_confirmation',
 *   order: {
 *     orderNumber: 'EZCR-20241218-00001',
 *     customerName: 'John Doe',
 *     customerEmail: 'john@example.com',
 *     customerPhone: '+15551234567',
 *     productName: 'EZ Cycle Ramp Pro',
 *     items: [{ product_name: 'EZ Cycle Ramp Pro', quantity: 1, unit_price: 2995, total_price: 2995 }],
 *     subtotal: 2995,
 *     shipping: 350,
 *     tax: 0,
 *     total: 3345,
 *     shippingAddress: { line1: '123 Main St', city: 'Atlanta', state: 'GA', postalCode: '30301' },
 *   },
 *   channel: 'both',
 * })
 */
export async function sendOrderEmail(params: SendOrderEmailParams): Promise<SendResult> {
  const { type, order, trackingInfo, channel = "email" } = params;

  const tenantId = process.env.EZCR_TENANT_ID;
  if (!tenantId) {
    return { success: false, errors: ["EZCR_TENANT_ID not configured"] };
  }

  const errors: string[] = [];
  let emailMessageId: string | undefined;
  let smsMessageId: string | undefined;

  try {
    // Get or create contact
    const contactId = await getOrCreateContact(
      tenantId,
      order.customerEmail,
      order.customerPhone,
      order.customerName
    );

    // Build template variables
    const variables = buildVariables(type, order, trackingInfo);

    // Send email if requested
    if (channel === "email" || channel === "both") {
      const templateName = EMAIL_TEMPLATE_NAMES[type];
      const templateVersionId = await getTemplateVersionId(tenantId, templateName);

      if (!templateVersionId) {
        errors.push(`Email template "${templateName}" not found or not active`);
      } else {
        const result = await queueAndSendNow({
          tenantId,
          contactId,
          channel: "email",
          templateVersionId,
          variables,
          idempotencyKey: `${type}-email-${order.orderNumber}`,
        });

        if (result.ok) {
          emailMessageId = result.messageId;
        } else if ("error" in result) {
          errors.push(`Email send failed: ${result.error}`);
        } else if ("blocked" in result) {
          errors.push(`Email blocked: ${result.blocked.reason}`);
        }
      }
    }

    // Send SMS if requested and template exists
    if ((channel === "sms" || channel === "both") && order.customerPhone) {
      const smsTemplateName = SMS_TEMPLATE_NAMES[type];

      if (smsTemplateName) {
        const templateVersionId = await getTemplateVersionId(tenantId, smsTemplateName);

        if (!templateVersionId) {
          // SMS template not found - this is optional, not an error
          console.log(`SMS template "${smsTemplateName}" not found, skipping SMS`);
        } else {
          const result = await queueAndSendNow({
            tenantId,
            contactId,
            channel: "sms",
            templateVersionId,
            variables,
            idempotencyKey: `${type}-sms-${order.orderNumber}`,
          });

          if (result.ok) {
            smsMessageId = result.messageId;
          } else if ("error" in result) {
            errors.push(`SMS send failed: ${result.error}`);
          } else if ("blocked" in result) {
            errors.push(`SMS blocked: ${result.blocked.reason}`);
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      emailMessageId,
      smsMessageId,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      errors: [error.message || String(error)],
    };
  }
}

// ============================================
// VARIABLE BUILDERS
// ============================================

function buildVariables(
  type: EmailType,
  order: OrderData,
  trackingInfo?: TrackingInfo
): Record<string, any> {
  const base = {
    contact: {
      display_name: order.customerName || "Valued Customer",
    },
    order: {
      number: order.orderNumber,
      product_name: order.productName,
      total: formatCurrency(order.total),
    },
    product: {
      sku_lower: (order.productSku || "").toLowerCase(),
    },
  };

  // Add order details for confirmation emails
  if (type === "order_confirmation") {
    const items = order.items || [
      {
        product_name: order.productName,
        quantity: 1,
        unit_price: order.total - (order.shipping || 0) - (order.tax || 0),
        total_price: order.total - (order.shipping || 0) - (order.tax || 0),
      },
    ];

    return {
      ...base,
      order: {
        ...base.order,
        items_table: renderOrderItemsTable(items),
        items_text: renderOrderItemsText(items),
        subtotal: formatCurrency(order.subtotal || order.total),
        shipping: formatCurrency(order.shipping || 0),
        tax: formatCurrency(order.tax || 0),
        shipping_address: order.shippingAddress
          ? renderShippingAddressHtml(order.shippingAddress)
          : "<p>Address not provided</p>",
        shipping_address_text: order.shippingAddress
          ? renderShippingAddressText(order.shippingAddress)
          : "Address not provided",
      },
    };
  }

  // Add shipping details for shipping emails
  if (type === "shipping" && trackingInfo) {
    return {
      ...base,
      shipping: {
        tracking_number: trackingInfo.trackingNumber,
        tracking_url: trackingInfo.trackingUrl,
        carrier: trackingInfo.carrier,
        estimated_delivery: trackingInfo.estimatedDelivery || "TBD",
        delivery_type_info: renderDeliveryTypeInfoHtml(
          order.shippingAddress?.isResidential,
          order.destinationTerminal
        ),
        delivery_type_text: renderDeliveryTypeInfoText(
          order.shippingAddress?.isResidential,
          order.destinationTerminal
        ),
        address: order.shippingAddress
          ? renderShippingAddressHtml(order.shippingAddress)
          : "",
        address_text: order.shippingAddress
          ? renderShippingAddressText(order.shippingAddress)
          : "",
      },
    };
  }

  return base;
}
