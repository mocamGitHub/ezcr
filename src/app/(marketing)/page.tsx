// src/app/(marketing)/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TestimonialCarousel } from '@/components/testimonials/TestimonialCarousel'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Base URL for images from live site
const LIVE_SITE = 'https://ezcycleramp.com'

// ============================================
// Hero Section (Variant A - Rotating Slider)
// ============================================
function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      image: `${LIVE_SITE}/revolution/assets/10.webp`,
      headline: 'Creative + Unique + Wow',
      subtext: 'The EZ Cycle Ramp combines creativity with distinctive styling',
    },
    {
      image: `${LIVE_SITE}/revolution/assets/11.webp`,
      headline: 'And Then SOME',
      subtext: 'Awe-inspiring in its ease and efficiency',
    },
    {
      image: `${LIVE_SITE}/revolution/assets/12.webp`,
      headline: 'Revolutionizing',
      subtext: 'A safe and stress-free motorcycle loading experience',
    },
  ]

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [slides.length])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden bg-black">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt={slide.headline}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                  {slide.headline}
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-gray-200 mb-8">
                  {slide.subtext}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white text-lg px-8">
                    <Link href="/products">Shop All Ramps</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/20 text-lg px-8">
                    <Link href="/configure">Find Your Perfect Ramp</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 p-3 rounded-full transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 p-3 rounded-full transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-[#F78309]' : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

// ============================================
// Product Showcase Section (Variant B style)
// ============================================
function ProductShowcase() {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-[#0B5394] to-slate-900 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Text Content */}
          <div>
            <div className="inline-block bg-[#F78309]/20 text-[#F78309] px-4 py-1 rounded-full text-sm font-semibold mb-6">
              Made in USA • Veteran Owned • A+ BBB Rating
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Load Your Bike<br />
              <span className="text-[#F78309]">With Confidence</span>
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-lg">
              Premium folding and standard motorcycle loading ramps.
              Engineered for safety, built to last.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white text-lg px-8 py-6">
                <Link href="/products">Shop All Ramps</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 text-lg px-8 py-6">
                <Link href="/configure">Configure Your Ramp</Link>
              </Button>
            </div>
            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free Shipping $500+
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Lifetime Warranty
              </div>
            </div>
          </div>

          {/* Right: Product Image */}
          <div className="relative flex items-center justify-center">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-[#F78309]/20 blur-3xl rounded-full scale-75" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${LIVE_SITE}/images/ramp6.webp`}
                alt="EZ Cycle Ramp"
                className="relative z-10 max-h-[400px] lg:max-h-[500px] object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// Main Homepage
// ============================================
export default function HomePage() {
  return (
    <div>
      {/* Hero Section - Variant A */}
      <HeroSlider />

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4 font-bold text-[#0B5394]">Heavy Duty</div>
              <h3 className="font-semibold text-lg mb-2">Built Tough</h3>
              <p className="text-muted-foreground">Built to handle heavy motorcycles with ease</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4 font-bold text-[#0B5394]">Adjustable</div>
              <h3 className="font-semibold text-lg mb-2">Perfect Fit</h3>
              <p className="text-muted-foreground">Fits various truck bed heights perfectly</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4 font-bold text-[#0B5394]">Easy Setup</div>
              <h3 className="font-semibold text-lg mb-2">Quick Install</h3>
              <p className="text-muted-foreground">Simple installation in under an hour</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase - Variant B */}
      <ProductShowcase />

      {/* Featured Products */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Ramps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg mb-2">AUN250 Folding Ramp</h3>
              <p className="text-2xl font-bold text-[#F78309] mb-4">$1,299</p>
              <Button asChild className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90">
                <Link href="/products/aun250">View Details</Link>
              </Button>
            </div>
            <div className="bg-background border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg mb-2">AUN210 Standard Ramp</h3>
              <p className="text-2xl font-bold text-[#F78309] mb-4">$999</p>
              <Button asChild className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90">
                <Link href="/products/aun210">View Details</Link>
              </Button>
            </div>
            <div className="bg-background border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-lg mb-2">AUN200 Basic Ramp</h3>
              <p className="text-2xl font-bold text-[#F78309] mb-4">$799</p>
              <Button asChild className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90">
                <Link href="/products/aun200">View Details</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Our Customers Say
          </h2>
          <TestimonialCarousel />
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link href="/testimonials">View All Testimonials</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#F78309] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Not Sure Which Ramp Is Right?</h2>
          <p className="text-lg mb-8">Use our configurator to find the perfect ramp for your setup.</p>
          <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
            <Link href="/configure">Start Configurator</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
