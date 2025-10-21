'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, Package, Truck, Wrench, ThumbsUp, ThumbsDown } from 'lucide-react'

export default function PostPurchaseSurveyPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('order_id')
  const customerEmail = searchParams?.get('email')

  const [productRating, setProductRating] = useState<number>(0)
  const [deliveryRating, setDeliveryRating] = useState<number>(0)
  const [installationRating, setInstallationRating] = useState<number>(0)
  const [wouldRecommend, setWouldRecommend] = useState<'yes' | 'no' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [hoveredRating, setHoveredRating] = useState<{ [key: string]: number }>({})

  const handleSubmit = async () => {
    if (productRating === 0 || deliveryRating === 0 || wouldRecommend === null) {
      alert('Please complete all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/surveys/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_type: 'post_purchase',
          order_id: orderId,
          customer_email: customerEmail,
          rating: Math.round((productRating + deliveryRating + (installationRating || 0)) / (installationRating > 0 ? 3 : 2)),
          response_data: {
            product_rating: productRating,
            delivery_rating: deliveryRating,
            installation_rating: installationRating || null,
            would_recommend: wouldRecommend,
            feedback: feedback || undefined,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit survey')
      }

      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting survey:', error)
      alert('Failed to submit survey. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const RatingStars = ({
    value,
    onChange,
    hoveredValue,
    onHover,
    onLeave
  }: {
    value: number
    onChange: (rating: number) => void
    hoveredValue: number
    onHover: (rating: number) => void
    onLeave: () => void
  }) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={onLeave}
          className="transition-transform hover:scale-110"
          type="button"
        >
          <Star
            className={`w-8 h-8 ${
              (hoveredValue || value) >= star
                ? 'fill-[#F78309] text-[#F78309]'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B5394] to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-lg text-muted-foreground mb-6">
            We appreciate your feedback. Your input helps us improve our products and service.
          </p>
          <p className="text-sm text-muted-foreground">
            Enjoy your EZ Cycle Ramp! If you need any assistance, call us at{' '}
            <a href="tel:8006874410" className="text-[#F78309] hover:underline">
              800-687-4410
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B5394] to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">How's Your New Ramp?</h1>
          <p className="text-muted-foreground">
            We'd love to hear about your experience with your EZ Cycle Ramp purchase
          </p>
        </div>

        {/* Product Rating */}
        <div className="mb-8 pb-8 border-b">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-[#F78309]" />
            <div>
              <h2 className="text-lg font-semibold">Product Satisfaction</h2>
              <p className="text-sm text-muted-foreground">How satisfied are you with your purchase?</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <RatingStars
              value={productRating}
              onChange={setProductRating}
              hoveredValue={hoveredRating['product'] || 0}
              onHover={(r) => setHoveredRating({ ...hoveredRating, product: r })}
              onLeave={() => setHoveredRating({ ...hoveredRating, product: 0 })}
            />
            {productRating > 0 && (
              <span className="text-sm font-medium text-muted-foreground">
                {productRating === 5 ? 'Excellent!' : productRating === 4 ? 'Good' : productRating === 3 ? 'Okay' : productRating === 2 ? 'Poor' : 'Very Poor'}
              </span>
            )}
          </div>
        </div>

        {/* Delivery Rating */}
        <div className="mb-8 pb-8 border-b">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="w-6 h-6 text-[#F78309]" />
            <div>
              <h2 className="text-lg font-semibold">Delivery Experience</h2>
              <p className="text-sm text-muted-foreground">How was the shipping and delivery?</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <RatingStars
              value={deliveryRating}
              onChange={setDeliveryRating}
              hoveredValue={hoveredRating['delivery'] || 0}
              onHover={(r) => setHoveredRating({ ...hoveredRating, delivery: r })}
              onLeave={() => setHoveredRating({ ...hoveredRating, delivery: 0 })}
            />
            {deliveryRating > 0 && (
              <span className="text-sm font-medium text-muted-foreground">
                {deliveryRating === 5 ? 'Excellent!' : deliveryRating === 4 ? 'Good' : deliveryRating === 3 ? 'Okay' : deliveryRating === 2 ? 'Poor' : 'Very Poor'}
              </span>
            )}
          </div>
        </div>

        {/* Installation Rating (Optional) */}
        <div className="mb-8 pb-8 border-b">
          <div className="flex items-center gap-3 mb-4">
            <Wrench className="w-6 h-6 text-[#F78309]" />
            <div>
              <h2 className="text-lg font-semibold">Installation</h2>
              <p className="text-sm text-muted-foreground">How easy was the installation? (Optional)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <RatingStars
              value={installationRating}
              onChange={setInstallationRating}
              hoveredValue={hoveredRating['installation'] || 0}
              onHover={(r) => setHoveredRating({ ...hoveredRating, installation: r })}
              onLeave={() => setHoveredRating({ ...hoveredRating, installation: 0 })}
            />
            {installationRating > 0 && (
              <span className="text-sm font-medium text-muted-foreground">
                {installationRating === 5 ? 'Very Easy!' : installationRating === 4 ? 'Easy' : installationRating === 3 ? 'Moderate' : installationRating === 2 ? 'Difficult' : 'Very Difficult'}
              </span>
            )}
          </div>
        </div>

        {/* Would Recommend */}
        <div className="mb-8 pb-8 border-b">
          <h2 className="text-lg font-semibold mb-4">Would you recommend EZ Cycle Ramp to others?</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setWouldRecommend('yes')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-lg border-2 transition-colors ${
                wouldRecommend === 'yes'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ThumbsUp className="w-6 h-6" />
              <span className="font-semibold text-lg">Yes</span>
            </button>
            <button
              onClick={() => setWouldRecommend('no')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-lg border-2 transition-colors ${
                wouldRecommend === 'no'
                  ? 'border-red-600 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ThumbsDown className="w-6 h-6" />
              <span className="font-semibold text-lg">No</span>
            </button>
          </div>
        </div>

        {/* Feedback */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Additional Feedback (Optional)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tell us more about your experience or how we can improve
          </p>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          className="w-full bg-[#F78309] hover:bg-[#F78309]/90 text-white py-6 text-lg font-semibold"
          disabled={productRating === 0 || deliveryRating === 0 || wouldRecommend === null || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Your feedback helps us improve our products and service. Thank you!
        </p>
      </div>
    </div>
  )
}
