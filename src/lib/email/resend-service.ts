import { Resend } from 'resend'

// Initialize Resend client
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured')
    return null
  }
  return new Resend(apiKey)
}

// ============================================
// TYPES
// ============================================

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface BaseEmailData {
  to: string
  customerName?: string
}

export interface ShippingEmailData extends BaseEmailData {
  orderNumber: string
  productName: string
  trackingNumber: string
  trackingUrl: string
  carrier: string
  estimatedDelivery?: string
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    isResidential?: boolean
  }
  destinationTerminal?: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    phone: string
  }
}

export interface DeliveryEmailData extends BaseEmailData {
  orderNumber: string
  productName: string
}

export interface PickupReadyEmailData extends BaseEmailData {
  orderNumber: string
  productName: string
}

export interface ReviewRequestEmailData extends BaseEmailData {
  orderNumber: string
  productName: string
}

export interface InstallationTipsEmailData extends BaseEmailData {
  orderNumber: string
  productName: string
  productSku: string
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #1f2937;
  margin: 0;
  padding: 0;
  background-color: #f3f4f6;
`

const headerHtml = (title: string, subtitle?: string) => `
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
    ${subtitle ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${subtitle}</p>` : ''}
  </div>
`

const footerHtml = `
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">EZ Cycle Ramp | 2500 Continental Blvd, Woodstock, GA 30188</p>
    <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} EZ Cycle Ramp. All rights reserved.</p>
  </div>
`

const supportHtml = `
  <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; margin: 0;">
      Questions? Contact us at<br>
      <a href="mailto:support@ezcycleramp.com" style="color: #2563eb;">support@ezcycleramp.com</a>
      or call <a href="tel:+19377256790" style="color: #2563eb;">(937) 725-6790</a>
    </p>
  </div>
`

// ============================================
// EMAIL TEMPLATES
// ============================================

function generateShippingNotificationHtml(data: ShippingEmailData): string {
  const deliveryTypeInfo = data.shippingAddress?.isResidential
    ? `
      <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0; color: #047857;">
          <strong>Residential Delivery:</strong> The carrier will call you to schedule a delivery appointment.
          A liftgate will be used for unloading.
        </p>
      </div>
    `
    : data.destinationTerminal
    ? `
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0 0 10px 0; color: #92400e;"><strong>Terminal Pickup Required</strong></p>
        <p style="margin: 0; color: #78350f;">
          <strong>${data.destinationTerminal.name}</strong><br>
          ${data.destinationTerminal.address}<br>
          ${data.destinationTerminal.city}, ${data.destinationTerminal.state} ${data.destinationTerminal.zip}<br>
          Phone: ${data.destinationTerminal.phone}
        </p>
      </div>
    `
    : ''

  return `
    <!DOCTYPE html>
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
          <p style="margin-top: 0;">Hi ${data.customerName || 'Valued Customer'},</p>
          <p>Great news! Your <strong>${data.productName}</strong> is on its way!</p>

          <!-- Tracking Info -->
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #0369a1;"><strong>Order:</strong> ${data.orderNumber}</p>
            <p style="margin: 0 0 10px 0; color: #0369a1;"><strong>Carrier:</strong> ${data.carrier}</p>
            <p style="margin: 0 0 15px 0; color: #0369a1;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
            ${data.estimatedDelivery ? `<p style="margin: 0 0 15px 0; color: #0369a1;"><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
            <a href="${data.trackingUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Track Your Shipment
            </a>
          </div>

          ${deliveryTypeInfo}

          ${data.shippingAddress ? `
          <!-- Shipping Address -->
          <div style="margin-top: 20px;">
            <h3 style="color: #374151; margin-bottom: 10px;">Shipping To</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <p style="margin: 0;">
                ${data.shippingAddress.line1}<br>
                ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
                ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
              </p>
            </div>
          </div>
          ` : ''}

          ${supportHtml}
        </div>
        ${footerHtml}
      </div>
    </body>
    </html>
  `
}

function generateDeliveryConfirmationHtml(data: DeliveryEmailData): string {
  return `
    <!DOCTYPE html>
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
          <p style="margin-top: 0;">Hi ${data.customerName || 'Valued Customer'},</p>
          <p>Your <strong>${data.productName}</strong> has been delivered! We hope you love it.</p>

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
    </html>
  `
}

function generatePickupReadyHtml(data: PickupReadyEmailData): string {
  return `
    <!DOCTYPE html>
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
          <p style="margin-top: 0;">Hi ${data.customerName || 'Valued Customer'},</p>
          <p>Great news! Your <strong>${data.productName}</strong> (Order ${data.orderNumber}) is ready for pickup!</p>

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
    </html>
  `
}

function generateReviewRequestHtml(data: ReviewRequestEmailData): string {
  return `
    <!DOCTYPE html>
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
          <p style="margin-top: 0;">Hi ${data.customerName || 'Valued Customer'},</p>
          <p>We hope you're enjoying your <strong>${data.productName}</strong>! It's been about a week since delivery, and we'd love to hear how things are going.</p>

          <p>Your feedback helps other motorcycle enthusiasts make informed decisions and helps us continue improving our products.</p>

          <!-- Review CTA -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://ezcycleramp.com/review?order=${data.orderNumber}" style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 16px;">
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
    </html>
  `
}

function generateInstallationTipsHtml(data: InstallationTipsEmailData): string {
  return `
    <!DOCTYPE html>
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
          <p style="margin-top: 0;">Hi ${data.customerName || 'Valued Customer'},</p>
          <p>Ready to set up your <strong>${data.productName}</strong>? Here are some tips to make installation smooth and easy!</p>

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
            <a href="https://ezcycleramp.com/installation/${data.productSku.toLowerCase()}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Download PDF Guide
            </a>
          </div>

          ${supportHtml}
        </div>
        ${footerHtml}
      </div>
    </body>
    </html>
  `
}

// ============================================
// EMAIL SEND FUNCTIONS
// ============================================

export async function sendShippingNotification(data: ShippingEmailData): Promise<EmailResult> {
  const resend = getResend()
  if (!resend) {
    return { success: true, error: 'Email service not configured' }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: 'EZ Cycle Ramp <shipping@ezcycleramp.com>',
      to: data.to,
      subject: `Your EZ Cycle Ramp is on its way! Order ${data.orderNumber}`,
      html: generateShippingNotificationHtml(data),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: result?.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function sendDeliveryConfirmation(data: DeliveryEmailData): Promise<EmailResult> {
  const resend = getResend()
  if (!resend) {
    return { success: true, error: 'Email service not configured' }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: 'EZ Cycle Ramp <hello@ezcycleramp.com>',
      to: data.to,
      subject: `Delivered! Your EZ Cycle Ramp has arrived`,
      html: generateDeliveryConfirmationHtml(data),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: result?.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function sendPickupReadyNotification(data: PickupReadyEmailData): Promise<EmailResult> {
  const resend = getResend()
  if (!resend) {
    return { success: true, error: 'Email service not configured' }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: 'EZ Cycle Ramp <orders@ezcycleramp.com>',
      to: data.to,
      subject: `Ready for Pickup: Order ${data.orderNumber}`,
      html: generatePickupReadyHtml(data),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: result?.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function sendReviewRequest(data: ReviewRequestEmailData): Promise<EmailResult> {
  const resend = getResend()
  if (!resend) {
    return { success: true, error: 'Email service not configured' }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: 'EZ Cycle Ramp <hello@ezcycleramp.com>',
      to: data.to,
      subject: `How's your EZ Cycle Ramp? We'd love your feedback!`,
      html: generateReviewRequestHtml(data),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: result?.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function sendInstallationTips(data: InstallationTipsEmailData): Promise<EmailResult> {
  const resend = getResend()
  if (!resend) {
    return { success: true, error: 'Email service not configured' }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: 'EZ Cycle Ramp Support <support@ezcycleramp.com>',
      to: data.to,
      subject: `Getting Started with Your ${data.productName}`,
      html: generateInstallationTipsHtml(data),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: result?.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
