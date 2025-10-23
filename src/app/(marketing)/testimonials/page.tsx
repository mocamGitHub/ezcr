import { createClient } from '@/lib/supabase/server'
import { TestimonialsSection } from '@/components/testimonials/TestimonialsSection'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Star, PenSquare } from 'lucide-react'

export default async function TestimonialsPage() {
  const supabase = await createClient()

  // Fetch all approved testimonials
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('status', 'approved')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  // Calculate average rating
  const averageRating = testimonials && testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : 0

  const totalReviews = testimonials?.length || 0

  // Group by rating for distribution
  const ratingDistribution = testimonials?.reduce((acc, t) => {
    acc[t.rating] = (acc[t.rating] || 0) + 1
    return acc
  }, {} as Record<number, number>) || {}

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Customer Testimonials</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Real reviews from real customers who trust EZ Cycle Ramp
        </p>

        {/* Overall Rating Summary */}
        <div className="bg-muted/30 rounded-lg p-8 mb-8">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-center">
              <div className="text-5xl font-bold text-[#0B5394] mb-2">
                {averageRating}
              </div>
              <div className="flex gap-1 justify-center mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(Number(averageRating))
                        ? 'fill-[#F78309] text-[#F78309]'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            <div className="flex-1 min-w-[200px] max-w-sm">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating] || 0
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

                return (
                  <div key={rating} className="flex items-center gap-2 mb-2">
                    <span className="text-sm w-12 text-right">{rating} stars</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#F78309] h-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm w-12 text-muted-foreground">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Write Review CTA */}
        <Button asChild size="lg" className="bg-[#0B5394] hover:bg-[#0B5394]/90">
          <Link href="/testimonials/submit" className="gap-2">
            <PenSquare className="h-5 w-5" />
            Write a Review
          </Link>
        </Button>
      </div>

      {/* All Testimonials */}
      {testimonials && testimonials.length > 0 ? (
        <TestimonialsSection testimonials={testimonials} />
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">
            No testimonials yet. Be the first to share your experience!
          </p>
          <Button asChild className="bg-[#0B5394] hover:bg-[#0B5394]/90">
            <Link href="/testimonials/submit">Write the First Review</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
