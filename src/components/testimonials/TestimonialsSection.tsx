'use client'

import { TestimonialsGrid } from './TestimonialsGrid'
import type { Testimonial } from './TestimonialsGrid'
import { toast } from 'sonner'

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const handleVoteHelpful = async (testimonialId: string) => {
    try {
      const response = await fetch('/api/testimonials/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testimonialId,
          isHelpful: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record vote')
      }

      toast.success('Thank you for your feedback!')
    } catch (error) {
      console.error('Error voting:', error)
      toast.error(
        error instanceof Error && error.message.includes('already voted')
          ? 'You have already voted on this testimonial'
          : 'Failed to record vote'
      )
      throw error // Re-throw to prevent UI update
    }
  }

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers have to say about their experience.
          </p>
        </div>

        <TestimonialsGrid
          testimonials={testimonials}
          showViewAll={true}
          onVoteHelpful={handleVoteHelpful}
        />
      </div>
    </section>
  )
}
