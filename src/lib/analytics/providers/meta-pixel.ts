// ============================================
// META CONVERSIONS API (Facebook/Instagram Pixel)
// Server-side conversion tracking
// ============================================
//
// Required Environment Variables:
//   META_PIXEL_ID=xxxxxxxxxxxxxxxx
//   META_ACCESS_TOKEN=EAAxxxxxxxx
//
// Documentation:
//   https://developers.facebook.com/docs/marketing-api/conversions-api

import { createHash } from 'crypto';
import { AnalyticsProvider, AnalyticsResult, ConversionEvent } from '../types';

const META_API_VERSION = 'v18.0';
const META_ENDPOINT = `https://graph.facebook.com/${META_API_VERSION}`;

export class MetaPixelProvider implements AnalyticsProvider {
  name = 'Meta Pixel';

  private pixelId: string | undefined;
  private accessToken: string | undefined;

  constructor() {
    this.pixelId = process.env.META_PIXEL_ID;
    this.accessToken = process.env.META_ACCESS_TOKEN;
  }

  isConfigured(): boolean {
    return !!(this.pixelId && this.accessToken);
  }

  async trackPurchase(event: ConversionEvent): Promise<AnalyticsResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        success: false,
        error: 'Meta Pixel not configured (missing META_PIXEL_ID or META_ACCESS_TOKEN)',
      };
    }

    try {
      const eventTime = Math.floor(Date.now() / 1000);
      const eventId = `purchase_${event.orderNumber}_${eventTime}`;

      // Build user data with proper hashing (Meta requires SHA-256)
      const userData: Record<string, string> = {};

      if (event.customerEmail) {
        userData.em = this.hashValue(event.customerEmail.toLowerCase().trim());
      }
      if (event.customerPhone) {
        userData.ph = this.hashValue(this.normalizePhone(event.customerPhone));
      }
      if (event.customerName) {
        const nameParts = event.customerName.split(' ');
        if (nameParts[0]) {
          userData.fn = this.hashValue(nameParts[0].toLowerCase().trim());
        }
        if (nameParts[nameParts.length - 1] && nameParts.length > 1) {
          userData.ln = this.hashValue(nameParts[nameParts.length - 1].toLowerCase().trim());
        }
      }

      // Add click IDs if available
      if (event.fbclid) {
        userData.fbc = event.fbc || `fb.1.${eventTime}.${event.fbclid}`;
      }
      if (event.fbp) {
        userData.fbp = event.fbp;
      }

      // Add IP and user agent if available
      if (event.ipAddress) {
        userData.client_ip_address = event.ipAddress;
      }
      if (event.userAgent) {
        userData.client_user_agent = event.userAgent;
      }

      const payload = {
        data: [
          {
            event_name: 'Purchase',
            event_time: eventTime,
            event_id: eventId,
            event_source_url: 'https://ezcycleramp.com/order-confirmation',
            action_source: 'website',
            user_data: userData,
            custom_data: {
              currency: event.currency,
              value: event.grandTotal,
              order_id: event.orderNumber,
              content_ids: [event.productSku],
              content_name: event.productName,
              content_type: 'product',
              contents: [
                {
                  id: event.productSku,
                  quantity: event.quantity,
                  item_price: event.productPrice,
                },
              ],
              num_items: event.quantity,
            },
          },
        ],
      };

      const url = `${META_ENDPOINT}/${this.pixelId}/events?access_token=${this.accessToken}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        return {
          provider: this.name,
          success: false,
          error: `Meta API error: ${result.error?.message || response.statusText}`,
        };
      }

      return {
        provider: this.name,
        success: true,
        eventId: eventId,
      };
    } catch (error) {
      return {
        provider: this.name,
        success: false,
        error: `Meta error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private normalizePhone(phone: string): string {
    // Remove all non-numeric characters and ensure country code
    const digits = phone.replace(/\D/g, '');
    // Add US country code if not present and looks like US number
    if (digits.length === 10) {
      return '1' + digits;
    }
    return digits;
  }
}
