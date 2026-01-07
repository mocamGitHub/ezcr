// ============================================
// GOOGLE ANALYTICS 4 - MEASUREMENT PROTOCOL
// Server-side conversion tracking
// ============================================
//
// Required Environment Variables:
//   GA_MEASUREMENT_ID=G-XXXXXXXXXX
//   GA_API_SECRET=xxxxxxxxxxxxx
//
// Documentation:
//   https://developers.google.com/analytics/devguides/collection/protocol/ga4

import { AnalyticsProvider, AnalyticsResult, ConversionEvent } from '../types';

const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

export class GoogleAnalyticsProvider implements AnalyticsProvider {
  name = 'Google Analytics 4';

  private measurementId: string | undefined;
  private apiSecret: string | undefined;

  constructor() {
    this.measurementId = process.env.GA_MEASUREMENT_ID;
    this.apiSecret = process.env.GA_API_SECRET;
  }

  isConfigured(): boolean {
    return !!(this.measurementId && this.apiSecret);
  }

  async trackPurchase(event: ConversionEvent): Promise<AnalyticsResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        success: false,
        error: 'GA4 not configured (missing GA_MEASUREMENT_ID or GA_API_SECRET)',
      };
    }

    try {
      // Generate or use existing client ID
      const clientId = event.clientId || this.generateClientId();

      const payload = {
        client_id: clientId,
        user_id: event.customerEmail ? this.hashEmail(event.customerEmail) : undefined,
        timestamp_micros: Date.now() * 1000,
        events: [
          {
            name: 'purchase',
            params: {
              transaction_id: event.orderNumber,
              value: event.grandTotal,
              currency: event.currency,
              tax: event.taxTotal,
              shipping: event.shippingCost,
              items: [
                {
                  item_id: event.productSku,
                  item_name: event.productName,
                  price: event.productPrice,
                  quantity: event.quantity,
                },
              ],
              // Custom parameters for attribution
              session_id: event.sessionId,
              lead_id: event.leadId,
              campaign: event.utmCampaign,
              source: event.utmSource,
              medium: event.utmMedium,
            },
          },
        ],
      };

      const url = `${GA_ENDPOINT}?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          provider: this.name,
          success: false,
          error: `GA4 API error: ${response.status} ${errorText}`,
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
        error: `GA4 error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private generateClientId(): string {
    // Generate a pseudo-random client ID in GA4 format
    const timestamp = Math.floor(Date.now() / 1000);
    const random = Math.floor(Math.random() * 2147483647);
    return `${random}.${timestamp}`;
  }

  private hashEmail(email: string): string {
    // Simple hash for user_id - in production consider using SHA-256
    return Buffer.from(email.toLowerCase().trim()).toString('base64');
  }
}
