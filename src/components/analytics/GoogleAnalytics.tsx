// ============================================
// GOOGLE ANALYTICS 4 - CLIENT-SIDE TRACKING
// ============================================
//
// Environment Variable:
//   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
//
// This component loads the GA4 gtag.js script and initializes tracking.
// It complements the server-side Measurement Protocol tracking in
// src/lib/analytics/ for complete conversion attribution.

import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}

// Helper to track custom events from client components
export function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
      'event',
      eventName,
      parameters
    );
  }
}

// Helper to track e-commerce events
export function trackEcommerceEvent(
  eventName: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase',
  params: {
    currency?: string;
    value?: number;
    items?: Array<{
      item_id: string;
      item_name: string;
      price?: number;
      quantity?: number;
    }>;
    transaction_id?: string;
    shipping?: number;
    tax?: number;
  }
) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
      'event',
      eventName,
      {
        currency: params.currency || 'USD',
        ...params,
      }
    );
  }
}
