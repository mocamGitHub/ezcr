'use client';

import Spline from '@splinetool/react-spline';
import { useState } from 'react';

/**
 * SPLINE 3D INTEGRATION FOR EZ CYCLE RAMP
 *
 * Spline is a no-code 3D design tool with React integration.
 * Perfect for marketing pages, hero sections, and interactive product showcases.
 *
 * Installation: pnpm add @splinetool/react-spline
 *
 * Workflow:
 * 1. Design 3D scene at https://spline.design (free browser-based tool)
 * 2. Add animations, physics, interactions
 * 3. Export/publish scene
 * 4. Copy the scene URL
 * 5. Embed in React using <Spline /> component
 *
 * Pros:
 * - No coding required for 3D creation
 * - Visual editor (like Figma for 3D)
 * - Built-in physics and interactions
 * - Exports to React components
 * - Real-time collaboration
 *
 * Cons:
 * - Larger file sizes than React Three Fiber
 * - Less customizable than code-based 3D
 * - Requires Spline account
 *
 * Best for:
 * - Marketing hero sections
 * - Product showcases
 * - Abstract 3D backgrounds
 * - Quick prototypes
 *
 * Next.js Optimization:
 * - Supports SSR with blur placeholders
 * - Lazy loading recommended
 * - Use dynamic import for large scenes
 */

// ============================================================================
// 1. HERO SECTION WITH 3D RAMP
// ============================================================================

export function SplineHeroSection() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <p className="mt-4 text-white">Loading 3D scene...</p>
          </div>
        </div>
      )}

      {/* Spline 3D Scene */}
      <div className="absolute inset-0">
        <Spline
          scene="https://prod.spline.design/YOUR-SCENE-URL.splinecode"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Content overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold">EZ Cycle Ramp</h1>
          <p className="mt-4 text-xl">
            Premium bike ramps for your truck bed
          </p>
          <button className="pointer-events-auto mt-8 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-primary/90">
            Configure Your Ramp
          </button>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// 2. PRODUCT SHOWCASE WITH SPLINE
// ============================================================================

export function SplineProductShowcase() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* 3D Preview */}
      <div className="h-96 rounded-lg border bg-gray-100 lg:h-auto">
        <Spline scene="https://prod.spline.design/YOUR-PRODUCT-SCENE.splinecode" />
      </div>

      {/* Product Details */}
      <div className="flex flex-col justify-center">
        <h2 className="text-4xl font-bold">EZ Cycle Ramp Pro</h2>
        <p className="mt-4 text-lg text-gray-600">
          Premium aluminum construction with non-slip surface. Perfect for
          loading bikes, motorcycles, and ATVs.
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>500 lb weight capacity</span>
          </div>
          <div className="flex items-center gap-3">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Lightweight aluminum (only 15 lbs)</span>
          </div>
          <div className="flex items-center gap-3">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Folds for easy storage</span>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <span className="text-3xl font-bold text-primary">$399.99</span>
          <button className="rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. INTERACTIVE 3D BACKGROUND
// ============================================================================

export function SplineInteractiveBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {/* Spline background */}
      <div className="fixed inset-0 -z-10">
        <Spline scene="https://prod.spline.design/YOUR-BACKGROUND-SCENE.splinecode" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============================================================================
// 4. FEATURES SECTION WITH 3D ICONS
// ============================================================================

export function SplineFeatureCard({
  title,
  description,
  splineScene,
}: {
  title: string;
  description: string;
  splineScene: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-lg">
      <div className="h-48">
        <Spline scene={splineScene} />
      </div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
  );
}

export function SplineFeaturesGrid() {
  const features = [
    {
      title: 'Durable Construction',
      description: 'Built to last with premium aluminum',
      scene: 'https://prod.spline.design/feature-durability.splinecode',
    },
    {
      title: 'Easy Setup',
      description: 'Install in minutes, no tools required',
      scene: 'https://prod.spline.design/feature-setup.splinecode',
    },
    {
      title: 'Safe & Secure',
      description: 'Non-slip surface with safety straps',
      scene: 'https://prod.spline.design/feature-safety.splinecode',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {features.map((feature, index) => (
        <SplineFeatureCard key={index} {...feature} />
      ))}
    </div>
  );
}

// ============================================================================
// 5. LAZY LOADED SPLINE (PERFORMANCE OPTIMIZATION)
// ============================================================================

import dynamic from 'next/dynamic';

const LazySpline = dynamic(() => import('@splinetool/react-spline'), {
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-gray-600">Loading 3D scene...</p>
      </div>
    </div>
  ),
  ssr: false, // Disable SSR for better performance
});

export function SplineLazyLoaded({ scene }: { scene: string }) {
  return (
    <div className="h-96 rounded-lg border">
      <LazySpline scene={scene} />
    </div>
  );
}

// ============================================================================
// 6. SPLINE WITH RUNTIME CONTROL
// ============================================================================

export function SplineWithControl() {
  const [spline, setSpline] = useState<any>(null);

  function onLoad(splineApp: any) {
    setSpline(splineApp);
  }

  function triggerAnimation() {
    if (spline) {
      // Trigger an event in your Spline scene
      spline.emitEvent('mouseDown', 'Button');
    }
  }

  function changeColor() {
    if (spline) {
      // Find object and change color
      const obj = spline.findObjectByName('Ramp');
      if (obj) {
        obj.material.color.setHex(0xf78309); // EZ Cycle orange
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="h-96 rounded-lg border bg-gray-100">
        <Spline
          scene="https://prod.spline.design/YOUR-SCENE.splinecode"
          onLoad={onLoad}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={triggerAnimation}
          className="rounded bg-primary px-4 py-2 text-white"
          disabled={!spline}
        >
          Trigger Animation
        </button>
        <button
          onClick={changeColor}
          className="rounded bg-secondary px-4 py-2 text-white"
          disabled={!spline}
        >
          Change Color
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 7. MOBILE-OPTIMIZED SPLINE
// ============================================================================

export function SplineMobileOptimized() {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useState(() => {
    setIsMobile(window.innerWidth < 768);
  });

  return (
    <div className="h-96 rounded-lg border bg-gray-100">
      {isMobile ? (
        // Show static image on mobile for better performance
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
          <div className="text-center text-white">
            <p className="text-lg font-semibold">3D Preview</p>
            <p className="mt-2 text-sm">View on desktop for interactive 3D</p>
          </div>
        </div>
      ) : (
        // Show Spline on desktop
        <Spline scene="https://prod.spline.design/YOUR-SCENE.splinecode" />
      )}
    </div>
  );
}

// ============================================================================
// DEMO PAGE
// ============================================================================

export function SplineExamplesDemo() {
  return (
    <div className="space-y-12 p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Spline 3D Integration Examples</h1>
        <p className="text-gray-600">
          No-code 3D designs for marketing and product showcases
        </p>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold">🎨 Installation:</p>
            <code className="mt-2 block rounded bg-blue-100 p-2">
              pnpm add @splinetool/react-spline
            </code>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            <p className="font-semibold">📝 How to create Spline scenes:</p>
            <ol className="mt-2 list-inside list-decimal space-y-1">
              <li>Go to https://spline.design (free account)</li>
              <li>Create your 3D scene (drag & drop interface)</li>
              <li>Add animations and interactions</li>
              <li>Click "Export" → "Web" → "React"</li>
              <li>Copy the scene URL</li>
              <li>Use in your component: &lt;Spline scene="URL" /&gt;</li>
            </ol>
          </div>

          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
            <p className="font-semibold">✨ Community templates:</p>
            <p className="mt-1">
              Browse pre-made scenes at{' '}
              <a
                href="https://spline.design/community"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                spline.design/community
              </a>
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-bold">1. Product Showcase</h2>
        <SplineProductShowcase />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">2. Features Grid with 3D Icons</h2>
        <SplineFeaturesGrid />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">3. Lazy Loaded Scene</h2>
        <SplineLazyLoaded scene="https://prod.spline.design/YOUR-SCENE.splinecode" />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">4. Runtime Control</h2>
        <SplineWithControl />
      </section>
    </div>
  );
}

/**
 * QUICK START GUIDE FOR EZ CYCLE:
 *
 * 1. Install: pnpm add @splinetool/react-spline
 *
 * 2. Create account at https://spline.design (free)
 *
 * 3. Design your 3D scene:
 *    - Import 3D models or use primitives
 *    - Add materials and lighting
 *    - Create animations (hover, click, scroll)
 *    - Add physics (optional)
 *
 * 4. Export:
 *    - Click "Export" button
 *    - Select "Web" → "React"
 *    - Copy the scene URL
 *
 * 5. Use in component:
 *    import Spline from '@splinetool/react-spline';
 *
 *    <Spline scene="YOUR_SCENE_URL" />
 *
 * 6. Optimization tips:
 *    - Use lazy loading for large scenes
 *    - Disable on mobile for performance
 *    - Use blur placeholders while loading
 *    - Optimize polygon count in Spline editor
 *    - Use compressed textures
 *
 * 7. Best use cases for EZ Cycle:
 *    - Hero section with animated ramp
 *    - Product page interactive 3D preview
 *    - Features section with 3D icons
 *    - Abstract backgrounds
 *    - Marketing landing pages
 *
 * Alternative to React Three Fiber when:
 * - You want visual editing (no code)
 * - Quick prototypes needed
 * - Non-technical team members create 3D
 * - Marketing pages (not configurator)
 */
