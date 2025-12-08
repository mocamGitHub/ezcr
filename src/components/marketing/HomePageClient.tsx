// src/components/marketing/HomePageClient.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnimatedCTAButton } from '@/components/ui/animated-cta-button'
import { TestimonialShowcase } from '@/components/testimonials/TestimonialShowcase'
import { ChatCTA } from '@/components/chat/ChatCTA'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Base URL for images from live site
const LIVE_SITE = 'https://ezcycleramp.com'

// ============================================
// Hero Section (Variant A - Rotating Slider with Crossfade)
// ============================================
export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const slides = [
    {
      image: '/images/hero/10.webp',
      headline: 'Load Your Bike\nWith Confidence',
      subtext: 'Make loading an easy, one-person, no-sweat job.',
    },
    {
      image: '/images/hero/11.webp',
      headline: 'Your Bike Deserves Better\nThan a 2×10 Board',
      subtext: 'Safer for you. Safer for your bike. Safer for your truck.',
    },
    {
      image: '/images/hero/12.webp',
      headline: 'Dropping Your Bike\nIs Not an Option',
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
                  transform: index === currentSlide && !isTransitioning ? 'translate(30px, -110px)' : 'translate(30px, -90px)',
                  transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                  pointerEvents: index === currentSlide ? 'auto' : 'none',
                }}
              >
                <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg">
                  {slide.headline.split('\n').map((line, i) => (
                    <span key={i} className={`block ${i > 0 ? 'text-[#F78309]' : ''} ${i > 0 && slide.headline.includes('2×10') ? 'pl-8' : ''}`}>
                      {line}
                    </span>
                  ))}
                </h1>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-gray-100 mb-4 sm:mb-6 md:mb-8 line-clamp-2 md:line-clamp-none drop-shadow-md">
                  {slide.subtext}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <Button asChild size="default" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 shadow-lg">
                    <Link href="#configurator">Quick Ramp Finder</Link>
                  </Button>
                  <Button asChild size="default" variant="outline" className="bg-transparent text-white border-white hover:bg-white/20 text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 shadow-lg backdrop-blur-sm">
                    <Link href="/products">Shop Ramps</Link>
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
// Product Showcase Section (Variant B style - Light/Dark mode with Parallax)
// ============================================
export function ProductShowcase() {
  const sectionRef = useRef<HTMLElement>(null)
  const [parallaxOffset, setParallaxOffset] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect()
        const windowHeight = window.innerHeight

        // Check if section is in view
        if (rect.top < windowHeight && rect.bottom > 0) {
          setIsVisible(true)
          // Calculate parallax: how far into view the section is
          const scrollProgress = 1 - (rect.top / windowHeight)
          const offset = scrollProgress * 60 // Subtle parallax
          setParallaxOffset(offset)
        } else {
          setIsVisible(false)
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section ref={sectionRef} className="relative py-16 lg:py-24 overflow-hidden">
      {/* Parallax Background - Light Mode */}
      <div
        className="absolute inset-0 w-full h-[150%] -top-[25%] dark:hidden"
        style={{
          transform: `translateY(${parallaxOffset}px)`,
          willChange: 'transform',
          transition: 'transform 0.1s ease-out',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-orange-50 to-gray-200" />
        {/* Geometric pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Parallax Background - Dark Mode */}
      <div
        className="absolute inset-0 w-full h-[150%] -top-[25%] hidden dark:block"
        style={{
          transform: `translateY(${parallaxOffset}px)`,
          willChange: 'transform',
          transition: 'transform 0.1s ease-out',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0B5394] to-slate-900" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 0h40v1H0zM0 0h1v40H0z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Text Content */}
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s ease-out',
            }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Safely load heavy motorcycles into tall trucks —{' '}
              <span className="text-[#F78309]">even solo.</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
              EZ Cycle Ramp combines Neo-Dyne&apos;s powered loading system with precision-fit ramps so you can load into pickups, vans, and trailers with less stress and more control.
            </p>

            <div className="mb-8">
              <p className="font-semibold text-gray-900 dark:text-white mb-4">Built for real riders:</p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-gray-900 dark:text-white mt-1">•</span>
                  <span>Handles large touring and cruiser bikes when configured correctly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-900 dark:text-white mt-1">•</span>
                  <span>Configured to your truck bed height and bike wheelbase.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-900 dark:text-white mt-1">•</span>
                  <span>Backed by a full 2-year warranty on NEO-DYNE ramps and accessories.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
              <AnimatedCTAButton href="/configure-smooth">
                Full Configurator
              </AnimatedCTAButton>
              <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white text-lg px-8 py-6 min-w-[180px]">
                <Link href="/products">Shop Ramps</Link>
              </Button>
            </div>

            {/* Quick Ramp Finder Button with Tooltip */}
            <div className="relative group inline-block">
              <Link
                href="#configurator"
                className="inline-flex items-center gap-2 text-[#0B5394] dark:text-[#4A9FDC] hover:text-[#F78309] dark:hover:text-[#F78309] font-medium transition-colors"
              >
                <span className="text-lg">Quick Ramp Finder</span>
                <span className="text-sm bg-[#F78309]/10 text-[#F78309] px-2 py-0.5 rounded-full">&lt; 1 min</span>
              </Link>
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p className="font-semibold mb-1">Quick vs Full Configurator</p>
                <p className="text-gray-300">Quick Finder: Answer 3 simple questions for a fast recommendation.</p>
                <p className="text-gray-300 mt-1">Full Configurator: Enter exact measurements for a precise configuration.</p>
                <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-900"></div>
              </div>
            </div>
          </div>

          {/* Right: Product Image */}
          <div
            className="relative flex items-center justify-center"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s ease-out 0.2s',
            }}
          >
            <div className="relative">
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
// Why Riders Trust Section
// ============================================
export function WhyRidersTrust() {
  return (
    <section className="py-16 bg-slate-100 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">
            Why Riders Trust <span className="text-[#F78309]">EZ Cycle Ramp</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            High-value bikes, tall trucks, and solo loading demand more than a generic ramp.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-base uppercase tracking-wide text-gray-900 dark:text-white mb-3">VETERAN OWNED</h3>
            <p className="text-base text-gray-600 dark:text-gray-300">Built and supported by a veteran-owned small business.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-base uppercase tracking-wide text-gray-900 dark:text-white mb-3">BBB A+ RATING</h3>
            <p className="text-base text-gray-600 dark:text-gray-300">A+ rated and committed to real, human support.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-base uppercase tracking-wide text-gray-900 dark:text-white mb-3">NEO-DYNE ENGINEERED</h3>
            <p className="text-base text-gray-600 dark:text-gray-300">Powered loading system and ramps designed together as a complete solution.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-base uppercase tracking-wide text-gray-900 dark:text-white mb-3">2-YEAR WARRANTY</h3>
            <p className="text-base text-gray-600 dark:text-gray-300">Backed by a full 2-year warranty on NEO-DYNE ramps and accessories.</p>
          </div>
        </div>

        {/* Chat CTA */}
        <div className="mt-10">
          <ChatCTA
            variant="banner"
            title="Have Any Questions?"
            description="Our assistant, Charli, can help you find the right ramp, check shipping costs, and more."
            buttonText="Chat with Charli Now"
            showIcon={true}
          />
        </div>
      </div>
    </section>
  )
}

// ============================================
// Testimonials Section
// ============================================
export function TestimonialsSection() {
  return (
    <section className="py-16 bg-slate-100 dark:bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            What Our <span className="text-[#F78309]">Customers</span> Say
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of satisfied riders who trust EZ Cycle Ramp
          </p>
        </div>
        <TestimonialShowcase />
        <div className="text-center mt-10">
          <Button asChild variant="outline" className="border-[#0B5394] text-[#0B5394] hover:bg-[#0B5394]/10 dark:border-white dark:text-white dark:hover:bg-white/10">
            <Link href="/testimonials">View All Testimonials</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

// ============================================
// Gallery Preview Section
// ============================================
export function GalleryPreview() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">See Our <span className="text-[#F78309]">Ramps</span> in Action</h2>
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
          <Button asChild variant="outline" className="border-[#0B5394] text-[#0B5394] hover:bg-[#0B5394]/10 dark:border-white dark:text-white dark:hover:bg-white/10">
            <Link href="/gallery">View Full Gallery</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

// ============================================
// CTA Section
// ============================================
export function CTASection() {
  return (
    <section className="bg-gradient-to-r from-[#F78309] to-[#e06d00] text-white py-12 md:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Not Sure Which Ramp Is Right?
            </h2>
            <p className="text-base sm:text-lg mb-6 opacity-90 max-w-md mx-auto lg:mx-0">
              Use our Full Configurator with exact measurements to get your complete quote with all options.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button asChild size="lg" className="bg-white text-[#F78309] hover:bg-gray-100 font-semibold shadow-lg">
                <Link href="/configure-smooth">Full Configurator</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/20 font-semibold">
                <Link href="tel:800-687-4410">Call 800-687-4410</Link>
              </Button>
            </div>
            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-6 text-sm opacity-80">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free Quotes
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Expert Advice
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                2-Year Warranty
              </span>
            </div>
          </div>
          {/* Right: Image - Hidden on mobile for cleaner look */}
          <div className="hidden lg:flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-75" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${LIVE_SITE}/images/ramp6.webp`}
                alt="EZ Cycle Ramp"
                className="relative z-10 max-h-[300px] object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// Blog Preview Section
// ============================================
export function BlogPreview() {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-200 via-orange-50 to-gray-200 dark:bg-muted/50 dark:from-transparent dark:via-transparent dark:to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Some of <span className="text-[#F78309]">Our Stories</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tips, guides, and news about motorcycle loading
          </p>
        </div>
        <div className="relative">
          {/* Glow effects */}
          <div className="absolute inset-0 bg-[#F78309]/15 dark:bg-[#F78309]/20 blur-3xl rounded-full scale-90" />
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-[#F78309]/20 dark:bg-[#F78309]/25 blur-3xl rounded-full" />
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-[#F78309]/20 dark:bg-[#F78309]/25 blur-3xl rounded-full" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
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
        </div>
        <div className="text-center mt-8">
          <Button asChild variant="outline" className="border-[#0B5394] text-[#0B5394] hover:bg-[#0B5394]/10 dark:border-white dark:text-white dark:hover:bg-white/10">
            <Link href="/blog">View All Articles</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
