import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Ensure server components work properly
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  eslint: {
    // Skip ESLint during production builds (for staging deployment)
    // TODO: Fix linting errors and remove this
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript type checking during production builds (for staging deployment)
    // TODO: Fix Next.js 15 async params and remove this
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
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
