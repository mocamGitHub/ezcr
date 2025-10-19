'use client';

import React, { useState } from 'react';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// =====================================================
// TYPES
// =====================================================

interface TestimonialSubmitFormProps {
  productId?: string | null; // Optional product reference
  onSuccess?: () => void;
  className?: string;
}

interface FormData {
  rating: number;
  review_text: string;
}

// =====================================================
// TESTIMONIAL SUBMIT FORM COMPONENT
// =====================================================

export function TestimonialSubmitForm({
  productId = null,
  onSuccess,
  className,
}: TestimonialSubmitFormProps) {
  const [formData, setFormData] = useState<FormData>({
    rating: 5,
    review_text: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle rating change
  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
    setError(null);
  };

  // Handle review text change
  const handleReviewTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, review_text: e.target.value }));
    setError(null);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitSuccess(false);

    // Validation
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }

    if (formData.review_text.trim().length < 20) {
      setError('Please write at least 20 characters in your review.');
      return;
    }

    if (formData.review_text.trim().length > 1000) {
      setError('Review text must not exceed 1000 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: formData.rating,
          review_text: formData.review_text.trim(),
          product_id: productId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit testimonial');
      }

      // Success
      setSubmitSuccess(true);
      setFormData({ rating: 5, review_text: '' });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error submitting testimonial:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form after success message
  React.useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-6">
        {/* Success Alert */}
        {submitSuccess && (
          <Alert variant="default" className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Thank you for your testimonial! It will be reviewed and published
              shortly.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Rating */}
        <div className="space-y-2">
          <Label htmlFor="rating">Your Rating *</Label>
          <div className="flex items-center gap-2">
            <StarRating
              rating={formData.rating}
              size="lg"
              interactive
              onChange={handleRatingChange}
            />
            <span className="text-sm text-gray-600">
              ({formData.rating} {formData.rating === 1 ? 'star' : 'stars'})
            </span>
          </div>
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <Label htmlFor="review_text">Your Review *</Label>
          <Textarea
            id="review_text"
            placeholder="Share your experience with us... (minimum 20 characters)"
            value={formData.review_text}
            onChange={handleReviewTextChange}
            rows={6}
            maxLength={1000}
            disabled={isSubmitting}
            className="resize-none"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Minimum 20 characters</span>
            <span>
              {formData.review_text.length} / 1000
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || formData.review_text.trim().length < 20}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Testimonial'
          )}
        </Button>

        {/* Helper Text */}
        <p className="text-xs text-gray-500 text-center">
          Your testimonial will be reviewed before being published. We display
          your first name and last initial for privacy.
        </p>
      </div>
    </form>
  );
}
