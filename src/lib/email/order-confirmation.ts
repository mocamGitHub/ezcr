import { Resend } from 'resend'

interface OrderItem {
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface OrderConfirmationData {
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

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function generateOrderConfirmationHTML(data: OrderConfirmationData): string {
  const itemsHTML = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.unit_price * 100)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.total_price * 100)}</td>
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
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background-color: #0B5394; color: #fff; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your purchase</p>
          </div>

          <!-- Order Info -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; margin-top: 0;">Hi ${data.customerName},</p>
            <p>Your order has been confirmed and is being processed. Here's a summary of your purchase:</p>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>Order Number:</strong> ${data.orderNumber}
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <!-- Totals -->
            <div style="margin: 20px 0; padding-top: 15px; border-top: 2px solid #e5e7eb;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 5px 0;">Subtotal</td>
                  <td style="text-align: right; padding: 5px 0;">${formatPrice(data.subtotal * 100)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">Shipping</td>
                  <td style="text-align: right; padding: 5px 0;">${formatPrice(data.shipping * 100)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">Tax</td>
                  <td style="text-align: right; padding: 5px 0;">${formatPrice(data.tax * 100)}</td>
                </tr>
                <tr style="font-weight: bold; font-size: 18px;">
                  <td style="padding: 10px 0; border-top: 2px solid #333;">Total</td>
                  <td style="text-align: right; padding: 10px 0; border-top: 2px solid #333; color: #0B5394;">${formatPrice(data.total * 100)}</td>
                </tr>
              </table>
            </div>

            <!-- Shipping Address -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Shipping Address</h3>
              <p style="margin: 0;">
                ${data.shippingAddress.line1}<br>
                ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
                ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                ${data.shippingAddress.country}
              </p>
            </div>

            <p style="margin-bottom: 0;">We'll send you a shipping confirmation email once your order is on its way.</p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
              Questions? Contact us at support@ezcycleramp.com
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              EZ Cycle Ramp - Veteran-Owned Business
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

function generateOrderConfirmationText(data: OrderConfirmationData): string {
  const itemsText = data.items
    .map(
      (item) =>
        `${item.product_name} x${item.quantity} - ${formatPrice(item.total_price * 100)}`
    )
    .join('\n')

  return `
ORDER CONFIRMED - ${data.orderNumber}

Hi ${data.customerName},

Thank you for your purchase! Your order has been confirmed and is being processed.

ORDER DETAILS
-------------
Order Number: ${data.orderNumber}

ITEMS
-----
${itemsText}

SUMMARY
-------
Subtotal: ${formatPrice(data.subtotal * 100)}
Shipping: ${formatPrice(data.shipping * 100)}
Tax: ${formatPrice(data.tax * 100)}
Total: ${formatPrice(data.total * 100)}

SHIPPING ADDRESS
----------------
${data.shippingAddress.line1}
${data.shippingAddress.line2 ? data.shippingAddress.line2 + '\n' : ''}${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}

We'll send you a shipping confirmation email once your order is on its way.

Questions? Contact us at support@ezcycleramp.com

---
EZ Cycle Ramp - Veteran-Owned Business
  `.trim()
}

export async function sendOrderConfirmationEmail(
  data: OrderConfirmationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured. Skipping order confirmation email.')
      return { success: false, error: 'Email service not configured' }
    }

    const resend = new Resend(resendApiKey)
    const fromEmail = process.env.FROM_EMAIL || 'orders@ezcycleramp.com'

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: data.customerEmail,
      subject: `Order Confirmed - ${data.orderNumber}`,
      html: generateOrderConfirmationHTML(data),
      text: generateOrderConfirmationText(data),
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log(`Order confirmation email sent to ${data.customerEmail}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error sending order confirmation email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

export type { OrderConfirmationData, OrderItem }
