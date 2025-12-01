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
// Hero Section (Variant A - Rotating Slider with Crossfade)
// ============================================
function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const slides = [
    {
      image: '/images/hero/10.webp',
      headline: 'Creative + Unique + Wow',
      subtext: 'The EZ Cycle Ramp combines creativity with distinctive styling',
    },
    {
      image: '/images/hero/11.webp',
      headline: 'And Then SOME',
      subtext: 'Awe-inspiring in its ease and efficiency',
    },
    {
      image: '/images/hero/12.webp',
      headline: 'Revolutionizing',
      subtext: 'A safe and stress-free motorcycle loading experience',
    },
  ]

  // Auto-advance slides with 9-second delay (matching original site)
  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
        setTimeout(() => setIsTransitioning(false), 100)
      }, 800)
    }, 9000)
    return () => clearInterval(timer)
  }, [slides.length])

  const goToSlide = (index: number) => {
    if (index === currentSlide || isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide(index)
      setTimeout(() => setIsTransitioning(false), 100)
    }, 800)
  }

  const nextSlide = () => goToSlide((currentSlide + 1) % slides.length)
  const prevSlide = () => goToSlide((currentSlide - 1 + slides.length) % slides.length)

  return (
    <section className="relative h-[350px] sm:h-[450px] md:h-[550px] lg:h-[600px] overflow-hidden bg-black">
      {/* Background slides with crossfade effect */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className="absolute inset-0"
          style={{
            opacity: index === currentSlide ? 1 : 0,
            transition: 'opacity 1.5s ease-in-out',
            zIndex: index === currentSlide ? 1 : 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt={slide.headline}
            className="w-full h-full object-cover object-center"
            style={{
              transform: index === currentSlide ? 'scale(1)' : 'scale(1.05)',
              transition: 'transform 9s ease-out',
            }}
          />
        </div>
      ))}

      {/* Gradient overlay - always visible */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20 md:from-black/70 md:via-black/40 md:to-transparent z-10" />

      {/* Content overlay with fade animation */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-xl md:max-w-2xl">
            {slides.map((slide, index) => (
              <div
                key={index}
                className="absolute"
                style={{
                  opacity: index === currentSlide && !isTransitioning ? 1 : 0,
                  transform: index === currentSlide && !isTransitioning ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                  pointerEvents: index === currentSlide ? 'auto' : 'none',
                }}
              >
                <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg">
                  {slide.headline}
                </h1>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-gray-100 mb-4 sm:mb-6 md:mb-8 line-clamp-2 md:line-clamp-none drop-shadow-md">
                  {slide.subtext}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <Button asChild size="default" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 shadow-lg">
                    <Link href="/products">Shop Ramps</Link>
                  </Button>
                  <Button asChild size="default" variant="outline" className="text-white border-white hover:bg-white/20 text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 shadow-lg backdrop-blur-sm">
                    <Link href="/configure">Free Quote</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        disabled={isTransitioning}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 p-2 sm:p-3 rounded-full transition-all backdrop-blur-sm border border-white/20 disabled:opacity-50"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 p-2 sm:p-3 rounded-full transition-all backdrop-blur-sm border border-white/20 disabled:opacity-50"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
      </button>

      {/* Progress Dots */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 sm:gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isTransitioning}
            className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${
              index === currentSlide
                ? 'bg-[#F78309] w-6 sm:w-8'
                : 'bg-white/50 hover:bg-white/80 w-2 sm:w-3'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

// ============================================
// Product Showcase Section (Variant B style - Light/Dark mode)
// ============================================
function ProductShowcase() {
  return (
    <section className="relative py-16 lg:py-24 bg-gradient-to-br from-gray-200 via-orange-50 to-gray-200 dark:from-slate-900 dark:via-[#0B5394] dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Text Content */}
          <div>
            <div className="inline-block bg-[#F78309]/15 dark:bg-[#F78309]/20 text-[#F78309] dark:text-[#F78309] px-4 py-1 rounded-full text-sm font-semibold mb-6">
              Veteran Owned • A+ BBB Rating • 2 Year Warranty
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Load Your Bike<br />
              <span className="text-[#F78309]">With Confidence</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-blue-100 mb-8 max-w-lg">
              Premium folding and standard motorcycle loading ramps.
              Engineered for safety, built to last.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white text-lg px-8 py-6">
                <Link href="/products">Shop All Ramps</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-[#0B5394] dark:text-white border-[#0B5394]/30 dark:border-white/30 hover:bg-[#0B5394]/10 dark:hover:bg-white/10 text-lg px-8 py-6">
                <Link href="/configure">Configure Your Ramp</Link>
              </Button>
            </div>
            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-gray-600 dark:text-blue-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                2 Year Neo-Dyne Warranty
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                30-Day Money Back
              </div>
            </div>
          </div>

          {/* Right: Product Image */}
          <div className="relative flex items-center justify-center">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-[#F78309]/15 dark:bg-[#F78309]/20 blur-3xl rounded-full scale-75" />
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
            <div className="bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] relative bg-gray-100 flex items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${LIVE_SITE}/images/ramp6.webp`}
                  alt="AUN250 Folding Ramp"
                  className="max-w-[85%] max-h-[85%] object-contain"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="font-semibold text-lg mb-2">AUN250 Folding Ramp</h3>
                <p className="text-sm text-muted-foreground mb-2">Premium folding design for easy storage</p>
                <p className="text-2xl font-bold text-[#F78309] mb-4">$1,299</p>
                <Button asChild className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90">
                  <Link href="/products/aun-250-folding-ramp">View Details</Link>
                </Button>
              </div>
            </div>
            <div className="bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] relative bg-gray-100 flex items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${LIVE_SITE}/images/ramp4.webp`}
                  alt="AUN210 Standard Ramp"
                  className="max-w-[85%] max-h-[85%] object-contain"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="font-semibold text-lg mb-2">AUN210 Standard Ramp</h3>
                <p className="text-sm text-muted-foreground mb-2">Heavy-duty standard loading ramp</p>
                <p className="text-2xl font-bold text-[#F78309] mb-4">$999</p>
                <Button asChild className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90">
                  <Link href="/products/aun-210-standard-ramp">View Details</Link>
                </Button>
              </div>
            </div>
            <div className="bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] relative bg-gray-100 flex items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${LIVE_SITE}/images/ramp2.webp`}
                  alt="AUN200 Basic Ramp"
                  className="max-w-[85%] max-h-[85%] object-contain"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="font-semibold text-lg mb-2">AUN200 Basic Ramp</h3>
                <p className="text-sm text-muted-foreground mb-2">Reliable and affordable entry option</p>
                <p className="text-2xl font-bold text-[#F78309] mb-4">$799</p>
                <Button asChild className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90">
                  <Link href="/products/aun-200-basic-ramp">View Details</Link>
                </Button>
              </div>
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

      {/* Gallery Preview Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">See Our Ramps in Action</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real customers loading real motorcycles with EZ Cycle Ramps
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="aspect-[4/3] rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero/10.webp"
                alt="Motorcycle being loaded"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="aspect-[4/3] rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero/11.webp"
                alt="EZ Cycle Ramp setup"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="aspect-[4/3] rounded-lg overflow-hidden hidden md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero/12.webp"
                alt="Motorcycle on ramp"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link href="/gallery">View Full Gallery</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">From Our Blog</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tips, guides, and news about motorcycle loading
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article className="bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="aspect-[16/9] relative bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${LIVE_SITE}/images/ramp6.webp`}
                  alt="Choosing a ramp"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-[#F78309] text-white text-xs font-medium px-3 py-1 rounded-full">
                  Buying Guide
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-[#0B5394] transition-colors">
                  How to Choose the Right Motorcycle Loading Ramp
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Choosing the right ramp depends on your bike&apos;s weight, truck bed height, and loading frequency.
                </p>
              </div>
            </article>
            <article className="bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="aspect-[16/9] relative bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${LIVE_SITE}/images/ramp4.webp`}
                  alt="Safety tips"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-[#F78309] text-white text-xs font-medium px-3 py-1 rounded-full">
                  Safety
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-[#0B5394] transition-colors">
                  10 Essential Safety Tips for Loading Your Motorcycle
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Loading a motorcycle can be dangerous. Follow these tips to protect yourself and your bike.
                </p>
              </div>
            </article>
            <article className="bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="aspect-[16/9] relative bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${LIVE_SITE}/images/ramp2.webp`}
                  alt="Folding vs standard"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-[#F78309] text-white text-xs font-medium px-3 py-1 rounded-full">
                  Comparison
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-[#0B5394] transition-colors">
                  Folding vs Standard Ramps: Which Is Right for You?
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Both folding and standard ramps have advantages. Learn the pros and cons of each type.
                </p>
              </div>
            </article>
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link href="/blog">View All Articles</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#F78309] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Not Sure Which Ramp Is Right?</h2>
          <p className="text-lg mb-8">Use our configurator to find the perfect ramp for your setup.</p>
          <Button asChild size="lg" className="bg-white text-[#F78309] hover:bg-gray-100 font-semibold">
            <Link href="/configure">Start Configurator</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
