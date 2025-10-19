// =====================================================
// TESTIMONIAL EMAIL NOTIFICATIONS
// =====================================================

/**
 * Email notification service for testimonials
 *
 * This module handles sending email notifications to admins when new testimonials are submitted.
 *
 * Requirements:
 * - Install email service provider (e.g., Resend, SendGrid, AWS SES)
 * - Add environment variables:
 *   - EMAIL_SERVICE_API_KEY (for the email provider)
 *   - ADMIN_EMAIL (email address to receive notifications)
 *   - FROM_EMAIL (sender email address)
 *
 * Example using Resend:
 * ```bash
 * npm install resend
 * ```
 *
 * .env.local:
 * ```
 * RESEND_API_KEY=re_xxxxxxxxxxxxx
 * ADMIN_EMAIL=admin@ezcycleramp.com
 * FROM_EMAIL=notifications@ezcycleramp.com
 * ```
 */

interface TestimonialNotificationData {
  testimonialId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  reviewText: string;
  productId?: string | null;
  createdAt: string;
}

// =====================================================
// EMAIL TEMPLATES
// =====================================================

function generateNewTestimonialEmailHTML(data: TestimonialNotificationData): string {
  const stars = '⭐'.repeat(data.rating);

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
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/testimonials"
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
  `;
}

function generateNewTestimonialEmailText(data: TestimonialNotificationData): string {
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
${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/testimonials

Testimonial ID: ${data.testimonialId}

---
This is an automated notification from EZ Cycle Ramp.
  `.trim();
}

// =====================================================
// EMAIL SENDING FUNCTIONS
// =====================================================

/**
 * Send email notification for new testimonial submission
 *
 * NOTE: This is a placeholder implementation. You need to:
 * 1. Choose an email service provider (Resend, SendGrid, AWS SES, etc.)
 * 2. Install the provider's SDK
 * 3. Configure environment variables
 * 4. Replace the implementation below with actual email sending logic
 */
export async function sendNewTestimonialNotification(
  data: TestimonialNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if email configuration exists
    const adminEmail = process.env.ADMIN_EMAIL;
    const fromEmail = process.env.FROM_EMAIL || 'notifications@ezcycleramp.com';

    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not configured. Skipping email notification.');
      return { success: false, error: 'Admin email not configured' };
    }

    // ============================================================
    // IMPLEMENTATION OPTION 1: RESEND (Recommended)
    // ============================================================
    // Uncomment and configure after installing: npm install resend

    /*
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `New ${data.rating}-Star Testimonial from ${data.customerName}`,
      html: generateNewTestimonialEmailHTML(data),
      text: generateNewTestimonialEmailText(data),
    });

    console.log('Testimonial notification email sent successfully');
    return { success: true };
    */

    // ============================================================
    // IMPLEMENTATION OPTION 2: SENDGRID
    // ============================================================
    // Uncomment and configure after installing: npm install @sendgrid/mail

    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: adminEmail,
      from: fromEmail,
      subject: `New ${data.rating}-Star Testimonial from ${data.customerName}`,
      html: generateNewTestimonialEmailHTML(data),
      text: generateNewTestimonialEmailText(data),
    });

    console.log('Testimonial notification email sent successfully');
    return { success: true };
    */

    // ============================================================
    // IMPLEMENTATION OPTION 3: NODEMAILER (SMTP)
    // ============================================================
    // Uncomment and configure after installing: npm install nodemailer

    /*
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      subject: `New ${data.rating}-Star Testimonial from ${data.customerName}`,
      html: generateNewTestimonialEmailHTML(data),
      text: generateNewTestimonialEmailText(data),
    });

    console.log('Testimonial notification email sent successfully');
    return { success: true };
    */

    // ============================================================
    // PLACEHOLDER: Log to console (development only)
    // ============================================================
    console.log('='.repeat(60));
    console.log('NEW TESTIMONIAL NOTIFICATION (Email not configured)');
    console.log('='.repeat(60));
    console.log(`To: ${adminEmail}`);
    console.log(`From: ${fromEmail}`);
    console.log(`Subject: New ${data.rating}-Star Testimonial from ${data.customerName}`);
    console.log('-'.repeat(60));
    console.log(generateNewTestimonialEmailText(data));
    console.log('='.repeat(60));

    return {
      success: false,
      error: 'Email service not configured. Check console for notification details.'
    };

  } catch (error: any) {
    console.error('Error sending testimonial notification email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email notification'
    };
  }
}

// =====================================================
// EXPORT
// =====================================================

export type { TestimonialNotificationData };
