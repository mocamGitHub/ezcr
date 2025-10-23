'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, ThumbsUp, ThumbsDown, X } from 'lucide-react'

interface ChatSatisfactionSurveyProps {
  sessionId: string
  onClose: () => void
  onSubmit?: () => void
}

export function ChatSatisfactionSurvey({ sessionId, onClose, onSubmit }: ChatSatisfactionSurveyProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [resolution, setResolution] = useState<'yes' | 'no' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0 || resolution === null) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/surveys/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_type: 'chat',
          session_id: sessionId,
          rating,
          response_data: {
            resolution,
            feedback: feedback || undefined,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit survey')
      }

      setIsSubmitted(true)
      onSubmit?.()

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error submitting survey:', error)
      alert('Failed to submit survey. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  if (isSubmitted) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Thank you for your feedback!</h3>
          <p className="text-muted-foreground">Your input helps us improve our service.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">How was your chat experience?</h3>
        <button
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close survey"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Rating */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-3">Overall satisfaction</p>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
              aria-label={`Rate ${star} stars`}
            >
              <Star
                className={`w-8 h-8 ${
                  (hoveredRating || rating) >= star
                    ? 'fill-[#F78309] text-[#F78309]'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Okay' : rating === 2 ? 'Poor' : 'Very Poor'}
          </p>
        )}
      </div>

      {/* Resolution */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-3">Did we answer your question or resolve your issue?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setResolution('yes')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
              resolution === 'yes'
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <ThumbsUp className="w-5 h-5" />
            <span className="font-medium">Yes</span>
          </button>
          <button
            onClick={() => setResolution('no')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
              resolution === 'no'
                ? 'border-red-600 bg-red-50 text-red-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <ThumbsDown className="w-5 h-5" />
            <span className="font-medium">No</span>
          </button>
        </div>
      </div>

      {/* Feedback (optional) */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2">What could we do better? (optional)</p>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleSkip}
          variant="outline"
          className="flex-1"
          disabled={isSubmitting}
        >
          Skip
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1 bg-[#F78309] hover:bg-[#F78309]/90"
          disabled={rating === 0 || resolution === null || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}
