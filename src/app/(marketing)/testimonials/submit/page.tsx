'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SubmitTestimonialPage() {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)

      if (rating === 0) {
        toast.error('Please select a rating')
        setIsSubmitting(false)
        return
      }

      const response = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.get('customerName'),
          customerEmail: formData.get('customerEmail'),
          customerLocation: formData.get('customerLocation'),
          title: formData.get('title'),
          content: formData.get('content'),
          rating,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit testimonial')
      }

      toast.success('Thank you! Your review has been submitted for approval.')
      router.push('/testimonials?submitted=true')
    } catch (error) {
      console.error('Error submitting testimonial:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit review. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-12">
      {/* Back Button */}
      <div className="mb-6">
        <Button asChild variant="ghost" className="hover:text-[#0B5394]">
          <Link href="/testimonials">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Testimonials
          </Link>
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Share Your Experience</h1>
          <p className="text-lg text-muted-foreground">
            Help others make informed decisions by sharing your honest feedback
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed">
            <Label className="text-lg font-semibold mb-3 block">
              How would you rate your experience? *
            </Label>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 5 }).map((_, i) => {
                const starValue = i + 1
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        starValue <= (hoveredRating || rating)
                          ? 'fill-[#F78309] text-[#F78309]'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                {rating === 5 && 'Excellent!'}
                {rating === 4 && 'Great!'}
                {rating === 3 && 'Good'}
                {rating === 2 && 'Fair'}
                {rating === 1 && 'Poor'}
              </p>
            )}
          </div>

          {/* Personal Information */}
          <div className="bg-background border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  required
                  disabled={isSubmitting}
                  placeholder="John Smith"
                />
              </div>

              <div>
                <Label htmlFor="customerEmail">Email Address *</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  required
                  disabled={isSubmitting}
                  placeholder="john@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your email will not be published
                </p>
              </div>

              <div>
                <Label htmlFor="customerLocation">Location (Optional)</Label>
                <Input
                  id="customerLocation"
                  name="customerLocation"
                  disabled={isSubmitting}
                  placeholder="Los Angeles, CA"
                />
              </div>
            </div>
          </div>

          {/* Review Content */}
          <div className="bg-background border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Review</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Review Title (Optional)</Label>
                <Input
                  id="title"
                  name="title"
                  disabled={isSubmitting}
                  placeholder="Best purchase I've made!"
                  maxLength={255}
                />
              </div>

              <div>
                <Label htmlFor="content">Your Experience *</Label>
                <Textarea
                  id="content"
                  name="content"
                  required
                  disabled={isSubmitting}
                  placeholder="Tell us about your experience with our product..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Share details about quality, delivery, customer service, or anything that matters to you
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 bg-[#0B5394] hover:bg-[#0B5394]/90"
              size="lg"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => router.back()}
              size="lg"
            >
              Cancel
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            By submitting, you agree that your review may be published on our website after approval.
          </p>
        </form>
      </div>
    </div>
  )
}
