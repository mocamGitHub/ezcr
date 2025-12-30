/**
 * Admin Email Notifications via Mailgun
 *
 * Simple email notifications to admins (not customer-facing).
 * Uses Mailgun directly without the full Comms Pack contact system.
 */

import { sendMailgunEmail } from '@/lib/comms/providers/mailgun'

interface AdminEmailParams {
  subject: string
  text: string
  html?: string
}

/**
 * Send an email notification to the admin.
 */
export async function sendAdminNotification(params: AdminEmailParams): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL
  const apiKey = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'notifications@ezcycleramp.com'

  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not configured. Skipping admin notification.')
    return { success: false, error: 'Admin email not configured' }
  }

  if (!apiKey || !domain) {
    console.warn('Mailgun not configured. Logging notification to console.')
    console.log('='.repeat(60))
    console.log('ADMIN NOTIFICATION (Mailgun not configured)')
    console.log('='.repeat(60))
    console.log(`To: ${adminEmail}`)
    console.log(`Subject: ${params.subject}`)
    console.log('-'.repeat(60))
    console.log(params.text)
    console.log('='.repeat(60))
    return { success: false, error: 'Mailgun not configured' }
  }

  try {
    await sendMailgunEmail({
      apiKey,
      domain,
      from: `EZ Cycle Ramp <${fromEmail}>`,
      to: adminEmail,
      subject: params.subject,
      text: params.text,
      html: params.html || null,
      replyTo: fromEmail,
      tags: ['admin-notification'],
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error sending admin notification:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

// =====================================================
// TESTIMONIAL NOTIFICATIONS
// =====================================================

interface TestimonialNotificationData {
  testimonialId: string
  customerName: string
  customerEmail: string
  rating: number
  reviewText: string
  productId?: string | null
  createdAt: string
}

function generateTestimonialEmailHTML(data: TestimonialNotificationData): string {
  const stars = '⭐'.repeat(data.rating)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Testimonial Submitted</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h1 style="color: #1e40af; margin-top: 0;">New Testimonial Submitted</h1>
          <p style="font-size: 16px; margin-bottom: 0;">A new customer testimonial has been submitted and is awaiting review.</p>
        </div>

        <div style="background-color: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin-top: 0;">Testimonial Details</h2>

          <div style="margin-bottom: 15px;">
            <strong>Customer:</strong> ${data.customerName}<br>
            <strong>Email:</strong> ${data.customerEmail}<br>
            <strong>Rating:</strong> ${stars} (${data.rating}/5)
          </div>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
            <strong>Review:</strong><br>
            <p style="margin: 10px 0 0 0;">"${data.reviewText}"</p>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/admin/testimonials"
             style="display: inline-block; background-color: #3b82f6; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
            Review Testimonial
          </a>
        </div>

        <div style="text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p>This is an automated notification from EZ Cycle Ramp.</p>
          <p>Testimonial ID: ${data.testimonialId}</p>
        </div>
      </body>
    </html>
  `
}

function generateTestimonialEmailText(data: TestimonialNotificationData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return `
New Testimonial Submitted

A new customer testimonial has been submitted and is awaiting review.

TESTIMONIAL DETAILS
-------------------
Customer: ${data.customerName}
Email: ${data.customerEmail}
Rating: ${'⭐'.repeat(data.rating)} (${data.rating}/5)

Review:
"${data.reviewText}"

To review this testimonial, please visit:
${appUrl}/admin/testimonials

Testimonial ID: ${data.testimonialId}

---
This is an automated notification from EZ Cycle Ramp.
  `.trim()
}

/**
 * Send notification to admin when a new testimonial is submitted.
 */
export async function sendNewTestimonialNotification(
  data: TestimonialNotificationData
): Promise<{ success: boolean; error?: string }> {
  return sendAdminNotification({
    subject: `New ${data.rating}-Star Testimonial from ${data.customerName}`,
    text: generateTestimonialEmailText(data),
    html: generateTestimonialEmailHTML(data),
  })
}

export type { TestimonialNotificationData }
