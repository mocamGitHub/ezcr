// src/app/(marketing)/page.tsx
import {
  HeroSlider,
  ProductShowcase,
  WhyRidersTrust,
  TestimonialsSection,
  GalleryPreview,
  CTASection,
} from '@/components/marketing/HomePageClient'
import { FeaturedProducts } from '@/components/products/FeaturedProducts'
import { BlogPreview } from '@/components/blog/BlogPreview'

export default function HomePage() {
  return (
    <div>
      {/* Hero Section - Variant A */}
      <HeroSlider />

      {/* Why Riders Trust EZ Cycle Ramp */}
      <WhyRidersTrust />

      {/* Product Showcase - Variant B */}
      <ProductShowcase />

      {/* Featured Products - from database */}
      <FeaturedProducts />

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
