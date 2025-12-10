import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface OrderItem {
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface OrderConfirmationData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function generateOrderConfirmationHtml(data: OrderConfirmationData): string {
  const itemsHtml = data.items
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
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - ${data.orderNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Thank you for your purchase</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="margin-top: 0;">Hi ${data.customerName},</p>
          <p>We've received your order and are getting it ready. Here's a summary of what you ordered:</p>

          <!-- Order Number -->
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #0369a1;">
              <strong>Order Number:</strong> ${data.orderNumber}
            </p>
          </div>

          <!-- Items Table -->
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
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="border-top: 2px solid #e5e7eb; padding-top: 15px;">
            <table style="width: 100%; margin-left: auto;">
              <tr>
                <td style="padding: 5px 0; text-align: right;">Subtotal:</td>
                <td style="padding: 5px 0; text-align: right; width: 120px;">${formatCurrency(data.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; text-align: right;">Shipping:</td>
                <td style="padding: 5px 0; text-align: right;">${formatCurrency(data.shipping)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; text-align: right;">Tax:</td>
                <td style="padding: 5px 0; text-align: right;">${formatCurrency(data.tax)}</td>
              </tr>
              <tr style="font-weight: bold; font-size: 18px;">
                <td style="padding: 10px 0; text-align: right; border-top: 2px solid #1e40af;">Total:</td>
                <td style="padding: 10px 0; text-align: right; border-top: 2px solid #1e40af; color: #1e40af;">${formatCurrency(data.total)}</td>
              </tr>
            </table>
          </div>

          <!-- Shipping Address -->
          <div style="margin-top: 30px;">
            <h3 style="color: #374151; margin-bottom: 10px;">Shipping Address</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <p style="margin: 0;">
                ${data.shippingAddress.line1}<br>
                ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
                ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                ${data.shippingAddress.country}
              </p>
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

          <!-- Support -->
          <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0;">
              Questions? Contact us at<br>
              <a href="mailto:support@ezcycleramp.com" style="color: #2563eb;">support@ezcycleramp.com</a>
              or call <a href="tel:+19377256790" style="color: #2563eb;">(937) 725-6790</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">EZ Cycle Ramp | 2500 Continental Blvd, Woodstock, GA 30188</p>
          <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} EZ Cycle Ramp. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendOrderConfirmationEmail(
  data: OrderConfirmationData
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email')
    return { success: true }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: 'EZ Cycle Ramp <orders@ezcycleramp.com>',
      to: data.customerEmail,
      subject: `Order Confirmed: ${data.orderNumber}`,
      html: generateOrderConfirmationHtml(data),
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('Order confirmation email sent:', result?.id)
    return { success: true }
  } catch (err: any) {
    console.error('Failed to send order confirmation email:', err)
    return { success: false, error: err.message }
  }
}
