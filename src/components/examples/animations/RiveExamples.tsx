'use client';

import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useState } from 'react';

/**
 * RIVE INTERACTIVE ANIMATIONS FOR EZ CYCLE RAMP
 *
 * Rive is a powerful tool for creating interactive, state-machine driven animations.
 * Perfect for UI micro-interactions, loading states, and responsive animations.
 *
 * Installation: pnpm add @rive-app/react-canvas
 *
 * How to create Rive animations:
 * 1. Go to https://rive.app (free account)
 * 2. Create or import animations
 * 3. Set up State Machines for interactivity
 * 4. Export as .riv file
 * 5. Place in /public folder
 *
 * Why Rive?
 * - Interactive state machines (animations respond to user input)
 * - Small file sizes (vector-based)
 * - Real-time property control
 * - Data binding for dynamic content
 * - Smooth 60fps animations
 *
 * FREE Community Assets:
 * - https://rive.app/community/
 * - Pre-made buttons, loaders, icons, characters
 */

// ============================================================================
// 1. INTERACTIVE LOADING ANIMATION
// ============================================================================

export function RiveLoadingSpinner() {
  const { RiveComponent } = useRive({
    // You need to create this file at rive.app or use a community asset
    src: '/animations/loading-spinner.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
  });

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-32 w-32">
        <RiveComponent />
      </div>
    </div>
  );
}

// ============================================================================
// 2. INTERACTIVE BUTTON WITH HOVER & CLICK STATES
// ============================================================================

export function RiveInteractiveButton({
  onClick,
}: {
  onClick?: () => void;
}) {
  const { RiveComponent, rive } = useRive({
    src: '/animations/button.riv',
    stateMachines: 'Button State',
    autoplay: true,
  });

  // Access state machine inputs to control animation
  const hoverInput = useStateMachineInput(rive, 'Button State', 'Hover');
  const pressInput = useStateMachineInput(rive, 'Button State', 'Press');

  return (
    <div
      className="relative h-16 w-48 cursor-pointer"
      onMouseEnter={() => hoverInput?.fire()}
      onMouseDown={() => pressInput?.fire()}
      onClick={onClick}
    >
      <RiveComponent />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="font-semibold text-white">Add to Cart</span>
      </div>
    </div>
  );
}

// ============================================================================
// 3. CONFIGURATOR PROGRESS INDICATOR
// ============================================================================

export function RiveProgressIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const { RiveComponent, rive } = useRive({
    src: '/animations/progress-circle.riv',
    stateMachines: 'Progress',
    autoplay: true,
  });

  // Control animation progress via number input
  const progressInput = useStateMachineInput(rive, 'Progress', 'progress');

  // Update the progress value
  if (progressInput) {
    progressInput.value = (currentStep / totalSteps) * 100;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-32 w-32">
        <RiveComponent />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">
            {currentStep}/{totalSteps}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
}

// ============================================================================
// 4. SUCCESS/ERROR FEEDBACK ANIMATION
// ============================================================================

export function RiveFeedbackAnimation({
  type,
  message,
}: {
  type: 'success' | 'error' | 'warning';
  message: string;
}) {
  const { RiveComponent, rive } = useRive({
    src: '/animations/feedback.riv',
    stateMachines: 'Feedback',
    autoplay: true,
  });

  // Trigger different animations based on type
  const successTrigger = useStateMachineInput(rive, 'Feedback', 'success');
  const errorTrigger = useStateMachineInput(rive, 'Feedback', 'error');
  const warningTrigger = useStateMachineInput(rive, 'Feedback', 'warning');

  // Fire appropriate trigger when type changes
  if (type === 'success' && successTrigger) successTrigger.fire();
  if (type === 'error' && errorTrigger) errorTrigger.fire();
  if (type === 'warning' && warningTrigger) warningTrigger.fire();

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <div className="h-16 w-16 flex-shrink-0">
        <RiveComponent />
      </div>
      <p className="font-medium">{message}</p>
    </div>
  );
}

// ============================================================================
// 5. INTERACTIVE PRODUCT CARD WITH FAVORITE HEART
// ============================================================================

export function RiveProductCard({
  product,
}: {
  product: { name: string; price: number; image: string };
}) {
  const [isFavorite, setIsFavorite] = useState(false);

  const { RiveComponent, rive } = useRive({
    src: '/animations/heart-favorite.riv',
    stateMachines: 'Heart',
    autoplay: true,
  });

  const favoriteInput = useStateMachineInput(rive, 'Heart', 'favorite');

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    favoriteInput?.fire();
  };

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="relative">
        <div className="mb-3 h-48 rounded bg-gray-200" />

        {/* Animated heart button */}
        <button
          onClick={toggleFavorite}
          className="absolute right-2 top-2 h-12 w-12"
        >
          <RiveComponent />
        </button>
      </div>

      <h3 className="font-semibold">{product.name}</h3>
      <p className="mt-1 text-lg font-bold text-primary">
        ${product.price.toFixed(2)}
      </p>
    </div>
  );
}

// ============================================================================
// 6. ANIMATED TOGGLE SWITCH
// ============================================================================

export function RiveToggleSwitch({
  label,
  onChange,
}: {
  label: string;
  onChange?: (enabled: boolean) => void;
}) {
  const [enabled, setEnabled] = useState(false);

  const { RiveComponent, rive } = useRive({
    src: '/animations/toggle-switch.riv',
    stateMachines: 'Toggle',
    autoplay: true,
  });

  const toggleInput = useStateMachineInput(rive, 'Toggle', 'toggle');

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    toggleInput?.fire();
    onChange?.(newValue);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <span className="font-medium">{label}</span>
      <button onClick={handleToggle} className="h-12 w-20">
        <RiveComponent />
      </button>
    </div>
  );
}

// ============================================================================
// 7. RATING STARS ANIMATION
// ============================================================================

export function RiveRatingStars({
  maxRating = 5,
  onRate,
}: {
  maxRating?: number;
  onRate?: (rating: number) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-2">
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;

        const { RiveComponent, rive } = useRive({
          src: '/animations/star-rating.riv',
          stateMachines: 'Star',
          autoplay: true,
        });

        const hoverInput = useStateMachineInput(rive, 'Star', 'hover');
        const selectInput = useStateMachineInput(rive, 'Star', 'select');

        return (
          <button
            key={index}
            className="h-10 w-10"
            onMouseEnter={() => {
              setHover(starValue);
              hoverInput?.fire();
            }}
            onMouseLeave={() => setHover(0)}
            onClick={() => {
              setRating(starValue);
              selectInput?.fire();
              onRate?.(starValue);
            }}
          >
            <RiveComponent />
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// 8. CHECKOUT PROCESS ANIMATION
// ============================================================================

export function RiveCheckoutProcess({
  step,
}: {
  step: 'cart' | 'shipping' | 'payment' | 'complete';
}) {
  const { RiveComponent, rive } = useRive({
    src: '/animations/checkout-process.riv',
    stateMachines: 'Checkout',
    autoplay: true,
  });

  const stepInput = useStateMachineInput(rive, 'Checkout', 'step');

  // Map step to number input
  const stepValues = { cart: 0, shipping: 1, payment: 2, complete: 3 };
  if (stepInput) {
    stepInput.value = stepValues[step];
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="h-48">
        <RiveComponent />
      </div>
    </div>
  );
}

// ============================================================================
// 9. MOUSE FOLLOW CHARACTER (INTERACTIVE)
// ============================================================================

export function RiveMouseFollowCharacter() {
  const { RiveComponent, rive } = useRive({
    src: '/animations/character-mouse-follow.riv',
    stateMachines: 'MouseFollow',
    autoplay: true,
  });

  const mouseXInput = useStateMachineInput(rive, 'MouseFollow', 'mouseX');
  const mouseYInput = useStateMachineInput(rive, 'MouseFollow', 'mouseY');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (mouseXInput) mouseXInput.value = x;
    if (mouseYInput) mouseYInput.value = y;
  };

  return (
    <div
      className="relative h-96 cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-purple-100"
      onMouseMove={handleMouseMove}
    >
      <RiveComponent />
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-600">
        Move your mouse around!
      </p>
    </div>
  );
}

// ============================================================================
// 10. SIMPLE EXAMPLE: PRE-MADE COMMUNITY ASSET
// ============================================================================

/**
 * Use a pre-made community asset from rive.app
 *
 * 1. Go to https://rive.app/community/
 * 2. Search for "loading", "button", "icon", etc.
 * 3. Download the .riv file
 * 4. Place in /public/animations/
 * 5. Use like this:
 */

export function RiveCommunityLoader() {
  const { RiveComponent } = useRive({
    // Example: Download a loading animation from community
    src: '/animations/community-loader.riv',
    autoplay: true,
  });

  return (
    <div className="flex h-32 w-32 items-center justify-center">
      <RiveComponent />
    </div>
  );
}

// ============================================================================
// DEMO PAGE WITH EXAMPLES
// ============================================================================

export function RiveExamplesDemo() {
  const [checkoutStep, setCheckoutStep] = useState<
    'cart' | 'shipping' | 'payment' | 'complete'
  >('cart');

  return (
    <div className="space-y-12 p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Rive Interactive Animations</h1>
        <p className="text-gray-600">
          State-machine driven animations that respond to user interaction
        </p>
        <div className="mt-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
          <p className="font-semibold">⚠️ Note: Rive files not included</p>
          <p className="mt-1">
            To use these examples, create animations at{' '}
            <a
              href="https://rive.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              rive.app
            </a>{' '}
            or download from the{' '}
            <a
              href="https://rive.app/community/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              community library
            </a>
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-bold">1. Loading Spinner</h2>
        <RiveLoadingSpinner />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">2. Interactive Button</h2>
        <div className="flex justify-center">
          <RiveInteractiveButton onClick={() => alert('Clicked!')} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">3. Progress Indicator</h2>
        <div className="flex justify-center">
          <RiveProgressIndicator currentStep={3} totalSteps={5} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">4. Feedback Animations</h2>
        <div className="space-y-3">
          <RiveFeedbackAnimation
            type="success"
            message="Order placed successfully!"
          />
          <RiveFeedbackAnimation type="error" message="Payment failed" />
          <RiveFeedbackAnimation
            type="warning"
            message="Low stock remaining"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">5. Product Card with Favorite</h2>
        <div className="max-w-sm">
          <RiveProductCard
            product={{
              name: 'EZ Cycle Ramp Pro',
              price: 399.99,
              image: '/placeholder.jpg',
            }}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">6. Checkout Process Animation</h2>
        <RiveCheckoutProcess step={checkoutStep} />
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setCheckoutStep('cart')}
            className="rounded bg-primary px-4 py-2 text-white"
          >
            Cart
          </button>
          <button
            onClick={() => setCheckoutStep('shipping')}
            className="rounded bg-primary px-4 py-2 text-white"
          >
            Shipping
          </button>
          <button
            onClick={() => setCheckoutStep('payment')}
            className="rounded bg-primary px-4 py-2 text-white"
          >
            Payment
          </button>
          <button
            onClick={() => setCheckoutStep('complete')}
            className="rounded bg-primary px-4 py-2 text-white"
          >
            Complete
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * QUICK START GUIDE:
 *
 * 1. Install: pnpm add @rive-app/react-canvas
 *
 * 2. Get Rive files:
 *    - Create at https://rive.app (free)
 *    - Or download from https://rive.app/community/
 *
 * 3. Place .riv files in /public/animations/
 *
 * 4. Import and use:
 *    import { RiveLoadingSpinner } from '@/components/examples/animations/RiveExamples'
 *
 * 5. Free assets to try:
 *    - Search "loading" for spinners
 *    - Search "button" for interactive buttons
 *    - Search "heart" for favorites
 *    - Search "star" for ratings
 *    - Search "checkmark" for success states
 *
 * File sizes are typically 5-50KB (much smaller than Lottie!)
 */
