// ============================================
// ANALYTICS SERVICE
// Server-side conversion tracking orchestrator
// ============================================
//
// Usage:
//   import { trackOrderConversion } from '@/lib/analytics';
//   await trackOrderConversion(orderData, leadId);
//
// Environment Variables (set whichever platforms you use):
//
//   Google Analytics 4:
//     GA_MEASUREMENT_ID=G-XXXXXXXXXX
//     GA_API_SECRET=xxxxxxxxxxxxx
//
//   Meta Pixel (Facebook/Instagram):
//     META_PIXEL_ID=xxxxxxxxxxxxxxxx
//     META_ACCESS_TOKEN=EAAxxxxxxxx
//
//   Google Ads (simple webhook mode):
//     GOOGLE_ADS_WEBHOOK_URL=https://n8n.example.com/webhook/gads
//     GOOGLE_ADS_CONVERSION_ACTION_ID=123456789

import { AnalyticsProvider, AnalyticsResult, ConversionEvent } from './types';
import { GoogleAnalyticsProvider } from './providers/google-analytics';
import { MetaPixelProvider } from './providers/meta-pixel';
import { GoogleAdsProvider } from './providers/google-ads';

// Initialize all providers
const providers: AnalyticsProvider[] = [
  new GoogleAnalyticsProvider(),
  new MetaPixelProvider(),
  new GoogleAdsProvider(),
];

/**
 * Track an order conversion across all configured analytics platforms
 */
export async function trackOrderConversion(
  orderData: {
    orderNumber: string;
    customerEmail: string;
    customerPhone?: string;
    customerName?: string;
    productSku: string;
    productName: string;
    productPrice: number;
    subtotal: number;
    shippingTotal: number;
    taxTotal: number;
    grandTotal: number;
    paymentIntentId: string;
    sessionId?: string;
    leadId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  },
  additionalContext?: {
    clientId?: string;
    fbclid?: string;
    gclid?: string;
    fbp?: string;
    fbc?: string;
    userAgent?: string;
    ipAddress?: string;
  }
): Promise<AnalyticsResult[]> {
  // Build the conversion event
  const event: ConversionEvent = {
    orderId: orderData.orderNumber,
    orderNumber: orderData.orderNumber,
    transactionId: orderData.paymentIntentId,
    customerEmail: orderData.customerEmail,
    customerPhone: orderData.customerPhone,
    customerName: orderData.customerName,
    productSku: orderData.productSku,
    productName: orderData.productName,
    productPrice: orderData.productPrice,
    quantity: 1,
    subtotal: orderData.subtotal,
    shippingCost: orderData.shippingTotal,
    taxTotal: orderData.taxTotal,
    grandTotal: orderData.grandTotal,
    currency: 'USD',
    sessionId: orderData.sessionId,
    leadId: orderData.leadId,
    utmSource: orderData.utmSource,
    utmMedium: orderData.utmMedium,
    utmCampaign: orderData.utmCampaign,
    ...additionalContext,
  };

  // Get list of configured providers
  const configuredProviders = providers.filter((p) => p.isConfigured());

  if (configuredProviders.length === 0) {
    console.log('[Analytics] No providers configured - skipping conversion tracking');
    return [];
  }

  console.log(
    `[Analytics] Tracking purchase ${event.orderNumber} to ${configuredProviders.length} provider(s): ${configuredProviders.map((p) => p.name).join(', ')}`
  );

  // Track to all configured providers in parallel
  const results = await Promise.all(
    configuredProviders.map(async (provider) => {
      try {
        const result = await provider.trackPurchase(event);
        if (result.success) {
          console.log(`[Analytics] ${provider.name}: Success (eventId: ${result.eventId})`);
        } else {
          console.error(`[Analytics] ${provider.name}: Failed - ${result.error}`);
        }
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Analytics] ${provider.name}: Exception - ${errorMessage}`);
        return {
          provider: provider.name,
          success: false,
          error: errorMessage,
        };
      }
    })
  );

  // Log summary
  const successCount = results.filter((r) => r.success).length;
  console.log(
    `[Analytics] Conversion tracking complete: ${successCount}/${results.length} succeeded`
  );

  return results;
}

/**
 * Get status of all analytics providers
 */
export function getAnalyticsStatus(): { provider: string; configured: boolean }[] {
  return providers.map((p) => ({
    provider: p.name,
    configured: p.isConfigured(),
  }));
}

// Re-export types
export * from './types';
