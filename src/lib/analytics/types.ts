// ============================================
// ANALYTICS TYPES
// Server-side conversion tracking types
// ============================================

export interface ConversionEvent {
  // Order identifiers
  orderId: string;
  orderNumber: string;
  transactionId: string; // payment_intent_id

  // Customer data (hashed for privacy)
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;

  // Product data
  productSku: string;
  productName: string;
  productPrice: number;
  quantity: number;

  // Transaction values
  subtotal: number;
  shippingCost: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;

  // Attribution
  sessionId?: string;
  leadId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;

  // Client identifiers (from cookies if available)
  clientId?: string; // GA client ID
  fbclid?: string; // Facebook click ID
  gclid?: string; // Google click ID
  fbp?: string; // Facebook browser ID
  fbc?: string; // Facebook click ID cookie

  // Request context
  userAgent?: string;
  ipAddress?: string;
}

export interface AnalyticsResult {
  provider: string;
  success: boolean;
  eventId?: string;
  error?: string;
}

export interface AnalyticsProvider {
  name: string;
  isConfigured(): boolean;
  trackPurchase(event: ConversionEvent): Promise<AnalyticsResult>;
}
