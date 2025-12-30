// src/app/(marketing)/page.tsx
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import {
  HeroSlider,
  ProductShowcase,
  WhyRidersTrust,
} from '@/components/marketing/HomePageClient'
import { FeaturedProducts } from '@/components/products/FeaturedProducts'
import { FeaturedProductsSkeleton } from '@/components/products/FeaturedProductsSkeleton'
import { ComparisonTable } from '@/components/marketing/ComparisonTable'
import { QuickConfigurator } from '@/components/marketing/QuickConfigurator'
import { AccessoriesExplainer } from '@/components/marketing/AccessoriesExplainer'

// Dynamic imports for below-the-fold components (reduces initial bundle)
const TestimonialsSection = dynamic(
  () => import('@/components/marketing/HomePageClient').then((mod) => ({ default: mod.TestimonialsSection })),
  { ssr: true }
)
const GalleryPreview = dynamic(
  () => import('@/components/marketing/HomePageClient').then((mod) => ({ default: mod.GalleryPreview })),
  { ssr: true }
)
const CTASection = dynamic(
  () => import('@/components/marketing/HomePageClient').then((mod) => ({ default: mod.CTASection })),
  { ssr: true }
)
const BlogPreview = dynamic(
  () => import('@/components/blog/BlogPreview').then((mod) => ({ default: mod.BlogPreview })),
  { ssr: true }
)

export default function HomePage() {
  return (
    <div>
      {/* Hero Section - Variant A */}
      <HeroSlider />

      {/* Why Riders Trust EZ Cycle Ramp */}
      <WhyRidersTrust />

      {/* Product Showcase - Variant B (with Parallax) */}
      <ProductShowcase />

      {/* Quick Configurator - Find Your Perfect Ramp */}
      <QuickConfigurator />

      {/* Featured Products - from database */}
      <Suspense fallback={<FeaturedProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>

      {/* Comparison Table */}
      <ComparisonTable />

      {/* Accessories Explainer - Understanding when accessories are needed */}
      <AccessoriesExplainer />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Gallery Preview Section */}
      <GalleryPreview />

      {/* CTA Section */}
      <CTASection />

      {/* Blog Preview Section */}
      <BlogPreview />
    </div>
  )
}
