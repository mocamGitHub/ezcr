import type { NextConfig } from "next";

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
    // Re-enabled image optimization with remote patterns
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'supabase.nexcyte.com',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
    ],
  },
  // Skip optimization to avoid static generation issues
  generateBuildId: async () => {
    // Use a fixed build ID to avoid issues
    return 'staging-build'
  },
};

export default nextConfig;
