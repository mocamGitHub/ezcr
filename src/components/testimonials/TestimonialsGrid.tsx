'use client'

import { TestimonialCard } from './TestimonialCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface Testimonial {
  id: string
  customer_name: string
  customer_location?: string
  title?: string
  content: string
  rating: number
  helpful_count: number
  created_at: string
  is_featured: boolean
  product?: {
    name: string
  }
}

interface TestimonialsGridProps {
  testimonials: Testimonial[]
  showViewAll?: boolean
  onVoteHelpful?: (testimonialId: string) => Promise<void>
}

export function TestimonialsGrid({
  testimonials,
  showViewAll = false,
  onVoteHelpful,
}: TestimonialsGridProps) {
  if (testimonials.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground mb-4">
          No testimonials yet. Be the first to share your experience!
        </p>
        <Button asChild className="bg-[#0B5394] hover:bg-[#0B5394]/90">
          <Link href="/testimonials/submit">Write a Review</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {testimonials.map((testimonial) => (
          <TestimonialCard
            key={testimonial.id}
            id={testimonial.id}
            customerName={testimonial.customer_name}
            customerLocation={testimonial.customer_location}
            title={testimonial.title}
            content={testimonial.content}
            rating={testimonial.rating}
            helpfulCount={testimonial.helpful_count}
            createdAt={new Date(testimonial.created_at)}
            isFeatured={testimonial.is_featured}
            productName={testimonial.product?.name}
            onVoteHelpful={onVoteHelpful}
          />
        ))}
      </div>

      {showViewAll && (
        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/testimonials" className="gap-2">
              View All Testimonials
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
