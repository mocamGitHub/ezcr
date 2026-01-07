// ============================================
// META PIXEL - CLIENT-SIDE TRACKING
// (Facebook/Instagram Pixel)
// ============================================
//
// Environment Variable:
//   NEXT_PUBLIC_META_PIXEL_ID=xxxxxxxxxxxxxxxx
//
// This component loads the Meta Pixel script and initializes tracking.
// It complements the server-side Conversions API tracking in
// src/lib/analytics/ for complete conversion attribution.

import Script from 'next/script';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function MetaPixel() {
  if (!META_PIXEL_ID) {
    return null;
  }

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Helper to track standard Meta Pixel events
export function trackMetaEvent(
  eventName:
    | 'ViewContent'
    | 'AddToCart'
    | 'InitiateCheckout'
    | 'Purchase'
    | 'Lead'
    | 'CompleteRegistration'
    | 'Contact'
    | 'Search',
  parameters?: {
    content_ids?: string[];
    content_name?: string;
    content_type?: string;
    contents?: Array<{ id: string; quantity: number }>;
    currency?: string;
    value?: number;
    num_items?: number;
    search_string?: string;
  }
) {
  if (typeof window !== 'undefined' && 'fbq' in window) {
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq(
      'track',
      eventName,
      parameters
    );
  }
}

// Helper to track custom events
export function trackMetaCustomEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && 'fbq' in window) {
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq(
      'trackCustom',
      eventName,
      parameters
    );
  }
}
