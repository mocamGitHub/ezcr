// ============================================
// GOOGLE ADS CONVERSION TRACKING
// Server-side conversion imports
// ============================================
//
// Required Environment Variables:
//   GOOGLE_ADS_CUSTOMER_ID=123-456-7890
//   GOOGLE_ADS_CONVERSION_ACTION_ID=123456789
//   GOOGLE_ADS_DEVELOPER_TOKEN=xxxxx
//   GOOGLE_ADS_REFRESH_TOKEN=xxxxx
//   GOOGLE_ADS_CLIENT_ID=xxxxx.apps.googleusercontent.com
//   GOOGLE_ADS_CLIENT_SECRET=xxxxx
//
// Note: For simpler setups, enhanced conversions can be sent via gtag
// This implementation uses the Conversions API for server-side tracking
//
// Documentation:
//   https://developers.google.com/google-ads/api/docs/conversions/upload-clicks

import { createHash } from 'crypto';
import { AnalyticsProvider, AnalyticsResult, ConversionEvent } from '../types';

export class GoogleAdsProvider implements AnalyticsProvider {
  name = 'Google Ads';

  private customerId: string | undefined;
  private conversionActionId: string | undefined;

  constructor() {
    this.customerId = process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, '');
    this.conversionActionId = process.env.GOOGLE_ADS_CONVERSION_ACTION_ID;
  }

  isConfigured(): boolean {
    // Google Ads requires OAuth setup which is complex
    // For now, we'll support a simpler webhook-based approach
    return !!(
      this.customerId &&
      this.conversionActionId &&
      process.env.GOOGLE_ADS_WEBHOOK_URL
    );
  }

  async trackPurchase(event: ConversionEvent): Promise<AnalyticsResult> {
    // Check for simple webhook mode first (recommended for most users)
    const webhookUrl = process.env.GOOGLE_ADS_WEBHOOK_URL;

    if (webhookUrl) {
      return this.trackViaWebhook(event, webhookUrl);
    }

    if (!this.isConfigured()) {
      return {
        provider: this.name,
        success: false,
        error: 'Google Ads not configured (set GOOGLE_ADS_WEBHOOK_URL for simple mode)',
      };
    }

    // Full API integration would go here
    // This requires OAuth2 token refresh which is complex for server-side
    return {
      provider: this.name,
      success: false,
      error: 'Full Google Ads API not implemented - use webhook mode',
    };
  }

  // Simple webhook mode - send to an intermediary service (like n8n or Zapier)
  // that handles the Google Ads API authentication
  private async trackViaWebhook(
    event: ConversionEvent,
    webhookUrl: string
  ): Promise<AnalyticsResult> {
    try {
      const payload = {
        conversion_action: this.conversionActionId,
        gclid: event.gclid,
        conversion_date_time: new Date().toISOString(),
        conversion_value: event.grandTotal,
        currency_code: event.currency,
        order_id: event.orderNumber,
        // Enhanced conversions data (hashed)
        user_identifiers: {
          hashed_email: event.customerEmail
            ? this.hashValue(event.customerEmail.toLowerCase().trim())
            : undefined,
          hashed_phone_number: event.customerPhone
            ? this.hashValue(this.normalizePhone(event.customerPhone))
            : undefined,
        },
        custom_variables: {
          product_sku: event.productSku,
          lead_id: event.leadId,
          utm_source: event.utmSource,
          utm_campaign: event.utmCampaign,
        },
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return {
          provider: this.name,
          success: false,
          error: `Google Ads webhook error: ${response.status}`,
        };
      }

      return {
        provider: this.name,
        success: true,
        eventId: event.orderNumber,
      };
    } catch (error) {
      return {
        provider: this.name,
        success: false,
        error: `Google Ads error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return '+1' + digits;
    }
    return '+' + digits;
  }
}
