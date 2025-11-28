// Hero Preview Page - Compare different hero designs
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Base URL for images from live site
const LIVE_SITE = 'https://ezcycleramp.com'

// ============================================
// VARIANT A: Rotating Slider (like current live site)
// ============================================
function HeroVariantA() {
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

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <section className="relative h-[600px] overflow-hidden bg-black">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />
          <img
            src={slide.image}
            alt={slide.headline}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-2xl">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
                  {slide.headline}
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 mb-8">
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
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 p-3 rounded-full transition-colors"
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
          />
        ))}
      </div>
    </section>
  )
}

// ============================================
// VARIANT B: Split Hero (text left, image right)
// ============================================
function HeroVariantB() {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-[#0B5394] to-slate-900 min-h-[600px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[600px]">
          {/* Left: Text Content */}
          <div className="py-16 lg:py-0">
            <div className="inline-block bg-[#F78309]/20 text-[#F78309] px-4 py-1 rounded-full text-sm font-semibold mb-6">
              Made in USA • Veteran Owned • A+ BBB Rating
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Load Your Bike<br />
              <span className="text-[#F78309]">With Confidence</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-lg">
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
            <div className="flex items-center gap-6 mt-10 text-sm text-blue-200">
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
          <div className="relative lg:h-[600px] flex items-center justify-center">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-[#F78309]/20 blur-3xl rounded-full scale-75" />
              <img
                src={`${LIVE_SITE}/images/ramp6.webp`}
                alt="EZ Cycle Ramp"
                className="relative z-10 max-h-[500px] object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// VARIANT C: Full-bleed Background Image
// ============================================
function HeroVariantC() {
  return (
    <section className="relative h-[700px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={`${LIVE_SITE}/images/TruckRampRear3.webp`}
          alt="Motorcycle loading ramp in action"
          className="w-full h-full object-cover object-center"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              The Last Ramp<br />
              You Will Ever Need
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Heavy-duty construction. Adjustable height.
              Made in USA by veterans who understand quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white text-lg px-10 py-6">
                <Link href="/products">Shop Now</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-lg px-10 py-6">
                <Link href="/configure">Build Your Setup</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// VARIANT D: Video-style Hero with Animated Elements
// ============================================
function HeroVariantD() {
  return (
    <section className="relative min-h-[650px] bg-[#0B5394] overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#F78309]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img
                src={`${LIVE_SITE}/logo/logoEZCR.png`}
                alt="EZ Cycle Ramp"
                className="h-12"
              />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Revolutionary<br />
              <span className="bg-gradient-to-r from-[#F78309] to-yellow-400 bg-clip-text text-transparent">
                Motorcycle Loading
              </span>
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Experience the safest, easiest way to load your motorcycle.
              Our patented design eliminates strain and risk.
            </p>

            {/* Feature list */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {['Heavy Duty Steel', 'Adjustable Height', 'Quick Setup', 'Lifetime Warranty'].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-blue-100">
                  <div className="w-2 h-2 bg-[#F78309] rounded-full" />
                  {feature}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white text-lg px-8 py-6">
                <Link href="/configure">Start Configurator</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 text-lg px-8 py-6">
                <Link href="/products">View Products</Link>
              </Button>
            </div>
          </div>

          {/* Right: Product showcase */}
          <div className="relative">
            <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              {/* Main product image */}
              <img
                src={`${LIVE_SITE}/images/loader.webp`}
                alt="EZ Cycle Ramp Product"
                className="w-full h-auto rounded-xl"
              />

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-[#F78309] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                Made in USA
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white text-[#0B5394] px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                A+ BBB Rating
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// Main Preview Page
// ============================================
export default function HeroPreviewPage() {
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B' | 'C' | 'D' | 'all'>('all')

  const variants = [
    { id: 'A', name: 'Rotating Slider', desc: 'Classic carousel with multiple slides' },
    { id: 'B', name: 'Split Hero', desc: 'Text left, product image right' },
    { id: 'C', name: 'Full-bleed Image', desc: 'Bold background with overlay' },
    { id: 'D', name: 'Modern Animated', desc: 'Clean design with subtle animations' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-gray-900">Hero Section Preview</h1>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedVariant('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedVariant === 'all'
                    ? 'bg-[#0B5394] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                View All
              </button>
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedVariant === v.id
                      ? 'bg-[#0B5394] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {v.id}: {v.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="space-y-8 pb-20">
        {(selectedVariant === 'all' || selectedVariant === 'A') && (
          <div>
            {selectedVariant === 'all' && (
              <div className="bg-[#0B5394] text-white py-3 px-4">
                <div className="max-w-7xl mx-auto">
                  <span className="font-bold">Variant A:</span> Rotating Slider - Classic carousel with multiple slides
                </div>
              </div>
            )}
            <HeroVariantA />
          </div>
        )}

        {(selectedVariant === 'all' || selectedVariant === 'B') && (
          <div>
            {selectedVariant === 'all' && (
              <div className="bg-[#0B5394] text-white py-3 px-4">
                <div className="max-w-7xl mx-auto">
                  <span className="font-bold">Variant B:</span> Split Hero - Text left, product image right
                </div>
              </div>
            )}
            <HeroVariantB />
          </div>
        )}

        {(selectedVariant === 'all' || selectedVariant === 'C') && (
          <div>
            {selectedVariant === 'all' && (
              <div className="bg-[#0B5394] text-white py-3 px-4">
                <div className="max-w-7xl mx-auto">
                  <span className="font-bold">Variant C:</span> Full-bleed Image - Bold background with overlay
                </div>
              </div>
            )}
            <HeroVariantC />
          </div>
        )}

        {(selectedVariant === 'all' || selectedVariant === 'D') && (
          <div>
            {selectedVariant === 'all' && (
              <div className="bg-[#0B5394] text-white py-3 px-4">
                <div className="max-w-7xl mx-auto">
                  <span className="font-bold">Variant D:</span> Modern Animated - Clean design with subtle animations
                </div>
              </div>
            )}
            <HeroVariantD />
          </div>
        )}
      </div>

      {/* Back to home */}
      <div className="fixed bottom-6 right-6">
        <Button asChild className="bg-[#0B5394] hover:bg-[#0B5394]/90 shadow-lg">
          <Link href="/">← Back to Home</Link>
        </Button>
      </div>
    </div>
  )
}
