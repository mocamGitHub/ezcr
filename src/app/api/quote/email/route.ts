import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Dynamic import to prevent bundling during static generation
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const body = await request.json()
    const {
      email,
      firstName,
      lastName,
      vehicle,
      measurements,
      motorcycle,
      selectedModel,
      extension,
      boltlessKit,
      tiedown,
      service,
      delivery,
      subtotal,
      salesTax,
      processingFee,
      total,
    } = body

    // Build configuration summary
    const configItems = [
      selectedModel.name,
      extension.price > 0 ? extension.name : null,
      boltlessKit.price > 0 ? boltlessKit.name : null,
      tiedown.price > 0 ? tiedown.name : null,
      service.price > 0 ? service.name : null,
      delivery.price > 0 ? delivery.name : null,
    ].filter(Boolean)

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'EZ Cycle Ramp <noreply@ezcycleramp.com>',
      to: [email],
      subject: 'Your EZ Cycle Ramp Configuration Quote',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #005696 0%, #0066b3 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .logo {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .logo-ez {
                color: #005696;
                background: white;
                padding: 5px 10px;
                border-radius: 4px;
              }
              .logo-ramp {
                color: #ff8c00;
                background: white;
                padding: 5px 10px;
                border-radius: 4px;
                margin-left: 5px;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e0e0e0;
              }
              .section {
                margin-bottom: 25px;
              }
              .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #005696;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 2px solid #005696;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #f0f0f0;
              }
              .detail-label {
                font-weight: 500;
                color: #666;
              }
              .detail-value {
                font-weight: 600;
                color: #333;
              }
              .price-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                font-size: 16px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                padding: 15px 0;
                font-size: 20px;
                font-weight: bold;
                color: #005696;
                border-top: 2px solid #005696;
                margin-top: 10px;
              }
              .cta-button {
                display: inline-block;
                background: #ff8c00;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
                text-align: center;
              }
              .footer {
                background: #f5f5f5;
                padding: 20px;
                text-align: center;
                font-size: 14px;
                color: #666;
                border-radius: 0 0 8px 8px;
              }
              .contact-info {
                margin: 15px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">
                <span class="logo-ez">EZ CYCLE</span>
                <span class="logo-ramp">RAMP</span>
              </div>
              <p style="margin: 0; font-size: 16px;">Your Custom Configuration Quote</p>
            </div>

            <div class="content">
              <p>Hi ${firstName} ${lastName},</p>
              <p>Thank you for using our configurator! Here's your custom quote:</p>

              <div class="section">
                <div class="section-title">Customer Information</div>
                <div class="detail-row">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value">${firstName} ${lastName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${email}</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Vehicle Details</div>
                <div class="detail-row">
                  <span class="detail-label">Vehicle Type:</span>
                  <span class="detail-value">${vehicle.charAt(0).toUpperCase() + vehicle.slice(1)}</span>
                </div>
                ${measurements.bedLengthClosed ? `
                <div class="detail-row">
                  <span class="detail-label">Cargo Area (Closed):</span>
                  <span class="detail-value">${measurements.bedLengthClosed.toFixed(1)}"</span>
                </div>
                ` : ''}
                ${measurements.cargoLength ? `
                <div class="detail-row">
                  <span class="detail-label">Cargo Length:</span>
                  <span class="detail-value">${measurements.cargoLength.toFixed(1)}"</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="detail-label">Load Height:</span>
                  <span class="detail-value">${measurements.loadHeight?.toFixed(1) || 'N/A'}"</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Motorcycle Details</div>
                <div class="detail-row">
                  <span class="detail-label">Type:</span>
                  <span class="detail-value">${motorcycle.type.charAt(0).toUpperCase() + motorcycle.type.slice(1)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Weight:</span>
                  <span class="detail-value">${motorcycle.weight?.toFixed(1) || 'N/A'} lbs</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Wheelbase:</span>
                  <span class="detail-value">${motorcycle.wheelbase?.toFixed(1) || 'N/A'}"</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Selected Configuration</div>
                ${configItems.map(item => `
                  <div class="detail-row">
                    <span class="detail-value">${item}</span>
                  </div>
                `).join('')}
              </div>

              <div class="section">
                <div class="section-title">Price Breakdown</div>
                <div class="price-row">
                  <span>Subtotal:</span>
                  <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="price-row">
                  <span>Sales Tax (8.9%):</span>
                  <span>$${salesTax.toFixed(2)}</span>
                </div>
                <div class="price-row">
                  <span>Processing Fee (3%):</span>
                  <span>$${processingFee.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>Total:</span>
                  <span>$${total.toFixed(2)}</span>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="https://ezcycleramp.com/configure" class="cta-button">
                  Continue Configuration
                </a>
              </div>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Questions? Our team is ready to help! Call us at <strong>800-687-4410</strong> or reply to this email.
              </p>
            </div>

            <div class="footer">
              <div class="contact-info">
                <strong>EZ Cycle Ramp</strong><br>
                Phone: <a href="tel:8006874410" style="color: #005696;">800-687-4410</a><br>
                Email: <a href="mailto:support@ezcycleramp.com" style="color: #005696;">support@ezcycleramp.com</a>
              </div>
              <p style="margin: 10px 0; font-size: 12px;">
                © ${new Date().getFullYear()} NEO-DYNE, USA. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error('Error sending quote email:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
