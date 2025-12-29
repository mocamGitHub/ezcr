import type { NextConfig } from "next";

// Content Security Policy
// Note: 'unsafe-inline' for scripts is required for Next.js without nonce implementation
// For stricter CSP, implement nonce-based script loading
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://*.supabase.co https://*.stripe.com https://maps.gstatic.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://maps.googleapis.com;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

// Security headers for all routes
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // Explicitly expose environment variables to the browser bundle
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_TENANT_SLUG: process.env.NEXT_PUBLIC_TENANT_SLUG,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  experimental: {
    // Ensure server components work properly
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  eslint: {
    // ESLint errors fixed - strict linting enabled
    ignoreDuringBuilds: false,
  },
  typescript: {
    // TypeScript errors fixed - strict type checking enabled
    ignoreBuildErrors: false,
  },
  images: {
    // Disable image optimization for Docker deployment reliability
    // Uses unoptimized prop on all images - more reliable for external URLs
    unoptimized: true,
  },
  // Skip optimization to avoid static generation issues
  generateBuildId: async () => {
    // Use a fixed build ID to avoid issues
    return 'staging-build'
  },
  // Apply security headers to all routes
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
