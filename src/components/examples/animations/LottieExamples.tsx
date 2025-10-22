'use client';

import Lottie from 'lottie-react';
import { useLottie } from 'lottie-react';
import { useState, useEffect } from 'react';

/**
 * LOTTIE ANIMATIONS FOR EZ CYCLE RAMP
 *
 * Lottie is an industry-standard library for rendering After Effects animations.
 * Perfect for decorative animations, loading states, and success/error feedback.
 *
 * Installation: pnpm add lottie-react
 *
 * How to get Lottie animations:
 * 1. LottieFiles: https://lottiefiles.com (huge free library)
 * 2. Create in After Effects with Bodymovin plugin
 * 3. Purchase from marketplaces
 *
 * File formats:
 * - .json (standard Lottie)
 * - .lottie (dotLottie - 80% smaller, recommended for 2025)
 *
 * Pros:
 * - Massive asset library (lottiefiles.com)
 * - Industry standard
 * - After Effects workflow
 *
 * Cons:
 * - Larger file sizes than Rive
 * - Less interactive (playback only, no state machines)
 * - Requires "use client" in Next.js
 *
 * For Next.js App Router:
 * - Always use "use client" directive
 * - Consider lazy loading for performance
 */

// ============================================================================
// SAMPLE LOTTIE DATA
// These would normally be imported from JSON files in /public/animations/
// ============================================================================

// For demo purposes, these would be actual animation JSON from lottiefiles.com
const SAMPLE_LOADING_ANIMATION = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 60,
  w: 500,
  h: 500,
  nm: 'Loading',
  ddd: 0,
  assets: [],
  layers: [],
};

// ============================================================================
// 1. SIMPLE LOADING SPINNER
// ============================================================================

export function LottieLoadingSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-32 w-32">
        <Lottie
          animationData={SAMPLE_LOADING_ANIMATION}
          loop={true}
          autoplay={true}
        />
      </div>
    </div>
  );
}

// ============================================================================
// 2. LOADING SPINNER WITH CONTROL
// ============================================================================

export function LottieControlledSpinner({ isLoading }: { isLoading: boolean }) {
  const options = {
    animationData: SAMPLE_LOADING_ANIMATION,
    loop: true,
    autoplay: false,
  };

  const { View, play, stop } = useLottie(options);

  useEffect(() => {
    if (isLoading) {
      play();
    } else {
      stop();
    }
  }, [isLoading, play, stop]);

  if (!isLoading) return null;

  return <div className="h-20 w-20">{View}</div>;
}

// ============================================================================
// 3. SUCCESS CHECKMARK ANIMATION (ONE-TIME PLAYBACK)
// ============================================================================

export function LottieSuccessCheckmark({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="flex h-32 w-32 items-center justify-center">
      <Lottie
        animationData={SAMPLE_LOADING_ANIMATION} // Would use success animation JSON
        loop={false}
        autoplay={true}
        onComplete={onComplete}
      />
    </div>
  );
}

// ============================================================================
// 4. ORDER CONFIRMATION ANIMATION
// ============================================================================

export function LottieOrderConfirmation() {
  const [showAnimation, setShowAnimation] = useState(false);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAnimation(true)}
        className="rounded-lg bg-primary px-6 py-3 font-semibold text-white"
      >
        Place Order
      </button>

      {showAnimation && (
        <div className="rounded-lg border bg-white p-8 text-center shadow-lg">
          <div className="mx-auto h-48 w-48">
            <Lottie
              animationData={SAMPLE_LOADING_ANIMATION}
              loop={false}
              autoplay={true}
              onComplete={() => {
                setTimeout(() => setShowAnimation(false), 1000);
              }}
            />
          </div>
          <h3 className="mt-4 text-xl font-bold text-green-600">
            Order Placed Successfully!
          </h3>
          <p className="mt-2 text-gray-600">
            Your order confirmation has been sent to your email.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. EMPTY CART ILLUSTRATION
// ============================================================================

export function LottieEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-64 w-64">
        <Lottie
          animationData={SAMPLE_LOADING_ANIMATION} // Would use empty cart animation
          loop={true}
          autoplay={true}
        />
      </div>
      <h3 className="mt-4 text-xl font-bold text-gray-800">{title}</h3>
      <p className="mt-2 max-w-md text-gray-600">{description}</p>
    </div>
  );
}

// ============================================================================
// 6. PAYMENT PROCESSING ANIMATION
// ============================================================================

export function LottiePaymentProcessing({
  status,
}: {
  status: 'processing' | 'success' | 'error';
}) {
  const animationMap = {
    processing: SAMPLE_LOADING_ANIMATION,
    success: SAMPLE_LOADING_ANIMATION, // Would use success animation
    error: SAMPLE_LOADING_ANIMATION, // Would use error animation
  };

  const messageMap = {
    processing: 'Processing your payment...',
    success: 'Payment successful!',
    error: 'Payment failed. Please try again.',
  };

  const colorMap = {
    processing: 'text-blue-600',
    success: 'text-green-600',
    error: 'text-red-600',
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-white p-8">
      <div className="h-32 w-32">
        <Lottie
          animationData={animationMap[status]}
          loop={status === 'processing'}
          autoplay={true}
        />
      </div>
      <p className={`mt-4 text-lg font-semibold ${colorMap[status]}`}>
        {messageMap[status]}
      </p>
    </div>
  );
}

// ============================================================================
// 7. PRODUCT SHOWCASE WITH ANIMATION
// ============================================================================

export function LottieProductShowcase() {
  const [isHovered, setIsHovered] = useState(false);

  const options = {
    animationData: SAMPLE_LOADING_ANIMATION, // Would use product animation
    loop: false,
    autoplay: false,
  };

  const { View, play, stop, goToAndStop } = useLottie(options);

  useEffect(() => {
    if (isHovered) {
      play();
    } else {
      goToAndStop(0, true); // Reset to frame 0
    }
  }, [isHovered, play, goToAndStop]);

  return (
    <div
      className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-64">{View}</div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold">EZ Cycle Ramp Pro</h3>
        <p className="mt-1 text-2xl font-bold text-primary">$399.99</p>
        <p className="mt-2 text-sm text-gray-600">
          Hover to see animation
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 8. ONBOARDING/TUTORIAL SLIDES
// ============================================================================

export function LottieOnboardingSlide({
  animationData,
  title,
  description,
}: {
  animationData: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="h-80 w-80">
        <Lottie animationData={animationData} loop={true} autoplay={true} />
      </div>
      <h2 className="mt-6 text-2xl font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-gray-600">{description}</p>
    </div>
  );
}

// ============================================================================
// 9. BACKGROUND DECORATION ANIMATION
// ============================================================================

export function LottieBackgroundDecoration() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
      <div className="h-full w-full">
        <Lottie
          animationData={SAMPLE_LOADING_ANIMATION}
          loop={true}
          autoplay={true}
        />
      </div>
    </div>
  );
}

// ============================================================================
// 10. ERROR STATE WITH RETRY
// ============================================================================

export function LottieErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8">
      <div className="h-48 w-48">
        <Lottie
          animationData={SAMPLE_LOADING_ANIMATION} // Would use error animation
          loop={false}
          autoplay={true}
        />
      </div>
      <h3 className="mt-4 text-xl font-bold text-red-600">
        Oops! Something went wrong
      </h3>
      <p className="mt-2 text-gray-600">
        We couldn't load your data. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-lg bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}

// ============================================================================
// 11. LAZY LOADED ANIMATION (NEXT.JS OPTIMIZATION)
// ============================================================================

/**
 * For large animations, lazy load to improve initial page load
 */
import dynamic from 'next/dynamic';

const LazyLottie = dynamic(() => import('lottie-react'), {
  loading: () => <div className="h-32 w-32 animate-pulse bg-gray-200" />,
  ssr: false, // Disable SSR for Lottie
});

export function LottieLazyLoaded({ animationData }: { animationData: any }) {
  return (
    <div className="h-64 w-64">
      <LazyLottie animationData={animationData} loop autoplay />
    </div>
  );
}

// ============================================================================
// DEMO PAGE
// ============================================================================

export function LottieExamplesDemo() {
  const [paymentStatus, setPaymentStatus] = useState<
    'processing' | 'success' | 'error'
  >('processing');

  return (
    <div className="space-y-12 p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Lottie Animation Examples</h1>
        <p className="text-gray-600">
          Industry-standard animations from After Effects
        </p>
        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Getting Lottie animations:</strong>
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700">
            <li>
              Browse{' '}
              <a
                href="https://lottiefiles.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                LottieFiles.com
              </a>{' '}
              (free library)
            </li>
            <li>Search categories: loading, success, error, empty state</li>
            <li>Download JSON and place in /public/animations/</li>
            <li>Import and use in your components</li>
          </ul>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-bold">1. Loading Spinner</h2>
        <LottieLoadingSpinner />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">2. Order Confirmation</h2>
        <LottieOrderConfirmation />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">3. Payment Processing</h2>
        <div className="space-y-4">
          <LottiePaymentProcessing status={paymentStatus} />
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPaymentStatus('processing')}
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Processing
            </button>
            <button
              onClick={() => setPaymentStatus('success')}
              className="rounded bg-green-600 px-4 py-2 text-white"
            >
              Success
            </button>
            <button
              onClick={() => setPaymentStatus('error')}
              className="rounded bg-red-600 px-4 py-2 text-white"
            >
              Error
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">4. Empty State</h2>
        <LottieEmptyState
          title="Your cart is empty"
          description="Add some amazing EZ Cycle ramps to get started!"
        />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">5. Product Showcase</h2>
        <div className="max-w-sm">
          <LottieProductShowcase />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">6. Error State</h2>
        <LottieErrorState onRetry={() => alert('Retrying...')} />
      </section>
    </div>
  );
}

/**
 * QUICK START GUIDE:
 *
 * 1. Install: pnpm add lottie-react
 *
 * 2. Get animations from https://lottiefiles.com
 *    Popular searches for EZ Cycle:
 *    - "shopping cart"
 *    - "delivery truck"
 *    - "checkmark success"
 *    - "loading spinner"
 *    - "empty box"
 *    - "payment card"
 *    - "error"
 *
 * 3. Download as JSON and place in /public/animations/
 *
 * 4. Import in your component:
 *    import animationData from '@/public/animations/loading.json';
 *
 * 5. Use:
 *    <Lottie animationData={animationData} loop autoplay />
 *
 * OPTIMIZATION TIPS:
 * - Use .lottie format (dotLottie) for 80% smaller files
 * - Lazy load with dynamic import for large animations
 * - Set ssr: false in Next.js for client-only rendering
 * - Consider using useMemo for animationData in frequently re-rendered components
 */
