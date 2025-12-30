'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    rating: 5,
    review_text: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form after success message - must be before any early returns
  React.useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

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
    } catch (err: unknown) {
      // Differentiate error types for better user messaging
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect. Please check your internet connection and try again.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className={className}>
        <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <LogIn className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Sign in to Leave a Review
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to your account to share your experience with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login?redirect=/testimonials">
              <Button className="bg-[#0B5394] hover:bg-[#0B5394]/90">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link href="/register?redirect=/testimonials">
              <Button variant="outline">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
