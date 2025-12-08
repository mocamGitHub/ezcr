// src/components/marketing/AccessoriesExplainer.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, HelpCircle, Wrench, Link2 } from 'lucide-react'

const LIVE_SITE = 'https://ezcycleramp.com'

// Accessory data
const accessories = [
  {
    id: 'ac001',
    name: 'AC001 Ramp Extension',
    slug: 'ac001-ramp-extension',
    image: `${LIVE_SITE}/images/ramp4.webp`, // Use ramp image as placeholder
    description: 'Extends your ramp length for taller truck beds or longer motorcycle wheelbases.',
    whenNeeded: 'Required when your bed height exceeds 42" or when loading bikes with wheelbases over 65".',
  },
  {
    id: 'ac012',
    name: 'AC012 Boltless Tie Down Kit',
    slug: 'ac012-boltless-tie-down-kit',
    image: `${LIVE_SITE}/images/ramp2.webp`, // Use ramp image as placeholder
    description: 'Secure your motorcycle without drilling holes in your truck bed.',
    whenNeeded: 'Ideal for riders who want quick, damage-free tie-down solutions that work with any truck.',
  },
]

// ============================================
// OPTION A: Split Layout with Floating Cards
// Creative diagonal split background with floating accessory cards
// ============================================
export function AccessoriesExplainerOptionA() {
  const sectionRef = useRef<HTMLElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect()
        const windowHeight = window.innerHeight

        if (rect.top < windowHeight && rect.bottom > 0) {
          setIsVisible(true)
          const progress = Math.min(1, Math.max(0, 1 - rect.top / windowHeight))
          setScrollProgress(progress)
        } else {
          setIsVisible(false)
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section ref={sectionRef} className="relative py-20 overflow-hidden">
      {/* Diagonal Split Background */}
      <div className="absolute inset-0">
        {/* Light mode */}
        <div className="absolute inset-0 dark:hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-100" />
          <div
            className="absolute inset-0 bg-[#0B5394]"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 70%)',
            }}
          />
        </div>
        {/* Dark mode */}
        <div className="absolute inset-0 hidden dark:block">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900" />
          <div
            className="absolute inset-0 bg-[#0B5394]"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 70%)',
            }}
          />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className="text-center mb-16"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out',
          }}
        >
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-4">
            <Wrench className="w-4 h-4" />
            <span className="text-sm font-medium">Understanding Accessories</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Do You Need an <span className="text-[#F78309]">Accessory?</span>
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Not every configuration requires accessories. Our configurator analyzes your specific
            truck bed and motorcycle to determine if an extension or tie-down kit would benefit your setup.
          </p>
        </div>

        {/* Floating Accessory Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {accessories.map((accessory, index) => (
            <div
              key={accessory.id}
              className="group relative"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible
                  ? `translateY(0) rotate(${index === 0 ? -1 : 1}deg)`
                  : `translateY(50px) rotate(0deg)`,
                transition: `all 0.8s ease-out ${0.2 + index * 0.15}s`,
              }}
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 group-hover:-translate-y-2">
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  <div className="lg:w-2/5 aspect-square lg:aspect-auto relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={accessory.image}
                      alt={accessory.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#F78309] text-white text-xs font-bold px-3 py-1 rounded-full">
                      ACCESSORY
                    </div>
                  </div>
                  {/* Content */}
                  <div className="lg:w-3/5 p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {accessory.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {accessory.description}
                    </p>
                    <div className="bg-[#F78309]/10 dark:bg-[#F78309]/20 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-[#F78309] flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{accessory.whenNeeded}</span>
                      </p>
                    </div>
                    <Link
                      href={`/products/${accessory.slug}`}
                      className="inline-flex items-center text-[#0B5394] dark:text-[#4A9FDC] font-medium hover:text-[#F78309] transition-colors"
                    >
                      View Product Details
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out 0.5s',
          }}
        >
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Let our configurator determine exactly what you need based on your measurements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white">
              <Link href="/configure-smooth">
                Find Your Configuration
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-[#0B5394] text-[#0B5394] hover:bg-[#0B5394]/10 dark:border-white dark:text-white dark:hover:bg-white/10">
              <Link href="/products?category=accessories">
                View All Accessories
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// OPTION B: Timeline/Journey Style
// Vertical timeline showing the decision process
// ============================================
export function AccessoriesExplainerOptionB() {
  const sectionRef = useRef<HTMLElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect()
        const windowHeight = window.innerHeight

        if (rect.top < windowHeight && rect.bottom > 0) {
          setIsVisible(true)
          const progress = Math.min(1, Math.max(0, 1 - rect.top / windowHeight))
          setScrollProgress(progress)
        } else {
          setIsVisible(false)
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-gray-900 overflow-hidden"
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className="text-center mb-16"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out',
          }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Understanding <span className="text-[#F78309]">Ramp Accessories</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our accessories solve specific challenges. Not everyone needs them—the configurator
            helps you determine if your setup requires additional components.
          </p>
        </div>

        {/* Timeline Layout */}
        <div className="relative">
          {/* Center Line */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#0B5394] via-[#F78309] to-[#0B5394] hidden md:block"
            style={{
              transform: 'translateX(-50%)',
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 0.8s ease-out',
            }}
          />

          {/* Timeline Items */}
          <div className="space-y-12 md:space-y-0">
            {accessories.map((accessory, index) => (
              <div
                key={accessory.id}
                className={`relative md:flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? 'translateY(0)'
                    : `translateY(50px)`,
                  transition: `all 0.8s ease-out ${0.2 + index * 0.2}s`,
                }}
              >
                {/* Content Side */}
                <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                  <div
                    className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow ${
                      index % 2 === 0 ? 'md:ml-auto' : ''
                    } max-w-md`}
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {accessory.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {accessory.description}
                    </p>
                    <div className="bg-[#0B5394]/10 dark:bg-[#0B5394]/20 rounded-lg p-3 mb-4">
                      <p className="text-sm text-[#0B5394] dark:text-[#4A9FDC]">
                        <strong>When you need it:</strong> {accessory.whenNeeded}
                      </p>
                    </div>
                    <Link
                      href={`/products/${accessory.slug}`}
                      className="inline-flex items-center text-[#F78309] font-medium hover:underline"
                    >
                      Learn More <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>

                {/* Center Dot */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-lg items-center justify-center border-4 border-[#F78309] z-10">
                  <span className="text-[#F78309] font-bold">{index + 1}</span>
                </div>

                {/* Image Side */}
                <div className={`md:w-1/2 mt-4 md:mt-0 ${index % 2 === 0 ? 'md:pl-12' : 'md:pr-12'}`}>
                  <div
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg ${
                      index % 2 === 0 ? '' : 'md:ml-auto'
                    } max-w-md bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={accessory.image}
                      alt={accessory.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Note */}
        <div
          className="mt-16 text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out 0.6s',
          }}
        >
          <div className="inline-flex items-center gap-3 bg-[#F78309]/10 dark:bg-[#F78309]/20 px-6 py-3 rounded-full mb-6">
            <HelpCircle className="w-5 h-5 text-[#F78309]" />
            <span className="text-gray-700 dark:text-gray-300">
              <strong className="text-[#F78309]">Good news:</strong> Many configurations don&apos;t require accessories at all!
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#0B5394] hover:bg-[#0B5394]/90 text-white">
              <Link href="/configure-smooth">
                Use the Full Configurator
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/products?category=accessories">
                Browse All Accessories
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// OPTION C: Magazine/Editorial Style (Compact)
// Editorial feel but scaled to match site proportions
// ============================================
export function AccessoriesExplainerOptionC() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect()
        const windowHeight = window.innerHeight

        if (rect.top < windowHeight && rect.bottom > 0) {
          setIsVisible(true)
        } else {
          setIsVisible(false)
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section ref={sectionRef} className="py-16 bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className="text-center mb-10"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out',
          }}
        >
          <span className="inline-block text-[#F78309] text-sm font-semibold tracking-wider uppercase mb-2">
            Accessory Guide
          </span>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Not Every Setup Needs <span className="text-[#F78309]">Additional Parts</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Our accessories solve specific challenges. The configurator helps determine if your setup requires them.
          </p>
        </div>

        {/* Accessory Cards - Side by Side */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {accessories.map((accessory, index) => (
            <div
              key={accessory.id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s ease-out ${0.1 + index * 0.1}s`,
              }}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] max-h-[180px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={accessory.image}
                  alt={accessory.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {/* Badge */}
                <div className="absolute top-3 left-3 bg-[#F78309] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {index === 0 ? 'HEIGHT SOLUTION' : 'SECURITY SOLUTION'}
                </div>
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-[#0B5394] flex items-center justify-center">
                      {index === 0 ? (
                        <Link2 className="w-4 h-4 text-white" />
                      ) : (
                        <Wrench className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                      {accessory.id.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {accessory.name}
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                  {accessory.description}
                </p>
                <div className="border-l-3 border-[#F78309] pl-3 mb-4 bg-[#F78309]/5 dark:bg-[#F78309]/10 py-2 rounded-r">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong className="text-[#F78309]">When needed:</strong> {accessory.whenNeeded}
                  </p>
                </div>
                <Link
                  href={`/products/${accessory.slug}`}
                  className="inline-flex items-center text-sm font-medium text-[#0B5394] dark:text-[#4A9FDC] hover:text-[#F78309] transition-colors"
                >
                  View Details
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA - Compact */}
        <div
          className="bg-gradient-to-r from-[#0B5394] to-blue-700 rounded-xl p-6 md:p-8 text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out 0.3s',
          }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h3 className="text-xl font-bold text-white mb-1">
                Not sure if you need accessories?
              </h3>
              <p className="text-blue-100 text-sm">
                Our configurator analyzes your measurements to recommend exactly what you need.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Button asChild className="bg-[#F78309] hover:bg-[#F78309]/90 text-white">
                <Link href="/configure-smooth">
                  Use Configurator
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent border-white text-white hover:bg-white/20">
                <Link href="/products?category=accessories">
                  All Accessories
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// Default Export - Currently using Option C
// Change this to switch between options
// ============================================
export function AccessoriesExplainer() {
  // Options: AccessoriesExplainerOptionA, AccessoriesExplainerOptionB, AccessoriesExplainerOptionC
  return <AccessoriesExplainerOptionC />
}
