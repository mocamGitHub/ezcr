'use client'

import React, { useState, useEffect } from 'react'
import { StaticStarRating } from '@/components/ui/star-rating'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Testimonial {
  id: string
  customer_name: string
  customer_avatar_url: string | null
  rating: number
  review_text: string
  created_at: string
  admin_response?: string | null
}

interface TestimonialShowcaseProps {
  testimonials?: Testimonial[]
  className?: string
}

// Sample testimonials for fallback/demo - enough for smooth marquee scrolling
const SAMPLE_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    customer_name: 'Mike Johnson',
    customer_avatar_url: null,
    rating: 5,
    review_text: 'Best motorcycle ramp I\'ve ever owned. The quality is outstanding and loading my Harley has never been easier. Worth every penny!',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    customer_name: 'Sarah Williams',
    customer_avatar_url: null,
    rating: 5,
    review_text: 'Amazing customer service and fast shipping. The ramp is incredibly sturdy and folds up nicely for storage. Highly recommend!',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    customer_name: 'David Chen',
    customer_avatar_url: null,
    rating: 5,
    review_text: 'Finally a ramp that can handle my adventure bike! The build quality is top-notch and setup took less than 30 minutes.',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    customer_name: 'Tom Martinez',
    customer_avatar_url: null,
    rating: 5,
    review_text: 'I was skeptical at first due to the price, but after using it for 6 months I can say it\'s the best investment I\'ve made for my bikes.',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    customer_name: 'Chris Anderson',
    customer_avatar_url: null,
    rating: 5,
    review_text: 'Veteran-owned and you can tell they care about quality. My Gold Wing loads perfectly every time. Great product!',
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    customer_name: 'James Wilson',
    customer_avatar_url: null,
    rating: 5,
    review_text: 'The folding mechanism is genius. Stores in my truck bed and sets up in under a minute. Game changer for track days!',
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    customer_name: 'Robert Taylor',
    customer_avatar_url: null,
    rating: 5,
    review_text: 'Bought this for my Goldwing and couldn\'t be happier. Rock solid construction and the powder coat finish looks great.',
    created_at: new Date().toISOString(),
  },
  {
    id: '8',
    customer_name: 'Kevin Brown',
    customer_avatar_url: null,
    rating: 5,
    review_text: 'Third ramp I\'ve owned and by far the best. No flex, no wobble, just confidence when loading my Street Glide.',
    created_at: new Date().toISOString(),
  },
  {
    id: '9',
    customer_name: 'Steve Miller',
    customer_avatar_url: null,
    rating: 5,
    review_text: 'Customer support helped me pick the right size for my F-150. Perfect fit and works exactly as advertised.',
    created_at: new Date().toISOString(),
  },
  {
    id: '10',
    customer_name: 'Dan Roberts',
    customer_avatar_url: null,
    rating: 5,
    review_text: 'Used it for the first time last weekend - loaded my Road King in under 2 minutes. Why did I wait so long to buy this?',
    created_at: new Date().toISOString(),
  },
  {
    id: '11',
    customer_name: 'Mark Thompson',
    customer_avatar_url: null,
    rating: 5,
    review_text: 'Heavy duty is an understatement. This thing is built like a tank. My Indian Scout loads smoothly every time.',
    created_at: new Date().toISOString(),
  },
  {
    id: '12',
    customer_name: 'Paul Garcia',
    customer_avatar_url: null,
    rating: 5,
    review_text: 'Excellent quality and fast delivery. The adjustable width feature is perfect for my different bikes.',
    created_at: new Date().toISOString(),
  },
]

// Single Testimonial Card component
function TestimonialCard({ testimonial, variant = 'default' }: { testimonial: Testimonial; variant?: 'default' | 'marquee' }) {
  const isMarquee = variant === 'marquee'

  // Format the date for "Verified Customer since {date}"
  const purchaseDate = new Date(testimonial.created_at)
  const formattedDate = purchaseDate.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  })

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700',
        'transition-all duration-300 hover:shadow-xl',
        isMarquee ? 'w-[350px] h-[260px] flex-shrink-0' : 'w-full'
      )}
    >
      <div className={cn('p-6 flex flex-col', isMarquee && 'h-full')}>
        {/* Rating */}
        <div className="mb-3">
          <StaticStarRating rating={testimonial.rating} size="sm" />
        </div>

        {/* Review text */}
        <p className={cn(
          'text-gray-700 dark:text-gray-300 leading-relaxed flex-grow',
          isMarquee ? 'line-clamp-4 text-sm' : 'text-base'
        )}>
          &quot;{testimonial.review_text}&quot;
        </p>

        {/* Customer info */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          {testimonial.customer_avatar_url ? (
            <img
              src={testimonial.customer_avatar_url}
              alt={testimonial.customer_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#0B5394] flex items-center justify-center text-white font-bold text-sm">
              {testimonial.customer_name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {testimonial.customer_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Verified Customer since {formattedDate}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Marquee component for desktop - CSS-based seamless infinite scroll
function MarqueeRow({ testimonials, direction = 'left' }: { testimonials: Testimonial[]; direction?: 'left' | 'right' }) {
  // We need to duplicate the content to create seamless loop
  // The animation moves the first set completely off-screen while the duplicate takes its place

  return (
    <div className="relative overflow-hidden py-2 marquee-container">
      {/* Gradient overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 dark:from-gray-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent z-10 pointer-events-none" />

      {/* Animated track - using flex with two identical groups */}
      <div
        className={cn(
          "flex w-max hover:[animation-play-state:paused]",
          direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'
        )}
      >
        {/* First set */}
        <div className="flex">
          {testimonials.map((testimonial, idx) => (
            <div key={`a-${testimonial.id}-${idx}`} className="px-2 flex-shrink-0">
              <TestimonialCard testimonial={testimonial} variant="marquee" />
            </div>
          ))}
        </div>
        {/* Second set (duplicate for seamless loop) */}
        <div className="flex" aria-hidden="true">
          {testimonials.map((testimonial, idx) => (
            <div key={`b-${testimonial.id}-${idx}`} className="px-2 flex-shrink-0">
              <TestimonialCard testimonial={testimonial} variant="marquee" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Mobile card stack with navigation
function MobileCardStack({ testimonials }: { testimonials: Testimonial[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  return (
    <div className="relative">
      {/* Current card */}
      <div className="px-4">
        <TestimonialCard testimonial={testimonials[currentIndex]} />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 px-4">
        <button
          onClick={handlePrev}
          className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'w-6 bg-[#F78309]'
                  : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              )}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
          aria-label="Next testimonial"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </div>
  )
}

export function TestimonialShowcase({ testimonials: initialTestimonials, className }: TestimonialShowcaseProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    initialTestimonials || SAMPLE_TESTIMONIALS
  )
  const [isLoading, setIsLoading] = useState(!initialTestimonials)

  // Fetch featured testimonials if not provided
  useEffect(() => {
    if (!initialTestimonials) {
      fetchFeaturedTestimonials()
    }
  }, [initialTestimonials])

  const fetchFeaturedTestimonials = async () => {
    try {
      // Fetch featured approved testimonials, sorted by rating desc
      const response = await fetch('/api/testimonials?featured=true&limit=20&sort_by=rating&sort_order=desc')
      const data = await response.json()

      if (response.ok && data.testimonials && data.testimonials.length >= 8) {
        // Only use API testimonials if we have enough for smooth scrolling
        setTestimonials(data.testimonials)
      }
      // If fewer than 8 featured testimonials from API, keep using SAMPLE_TESTIMONIALS
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      // Keep using SAMPLE_TESTIMONIALS on error
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={cn('py-12', className)}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F78309]"></div>
        </div>
      </div>
    )
  }

  // Split testimonials for two marquee rows
  const midpoint = Math.ceil(testimonials.length / 2)
  const topRow = testimonials.slice(0, midpoint)
  const bottomRow = testimonials.slice(midpoint)

  return (
    <div className={cn('relative', className)}>
      {/* Desktop: Marquee style - two rows (hidden on mobile) */}
      <div className="hidden md:block space-y-4">
        <MarqueeRow testimonials={topRow} direction="left" />
        {bottomRow.length > 0 && (
          <MarqueeRow testimonials={bottomRow} direction="right" />
        )}
      </div>

      {/* Mobile: Card stack with navigation (hidden on desktop) */}
      <div className="md:hidden">
        <MobileCardStack testimonials={testimonials} />
      </div>

      {/* CSS for seamless infinite scroll */}
      <style jsx global>{`
        @keyframes marquee-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
        .animate-marquee-left {
          animation: marquee-left 90s linear infinite;
        }
        .animate-marquee-right {
          animation: marquee-right 90s linear infinite;
        }
      `}</style>
    </div>
  )
}
