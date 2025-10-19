'use client';

import React, { useState, useEffect } from 'react';
import { StaticStarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { TestimonialSubmitForm } from '@/components/testimonials/TestimonialSubmitForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PenSquare, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// TYPES
// =====================================================

interface Testimonial {
  id: string;
  customer_name: string;
  customer_avatar_url: string | null;
  rating: number;
  review_text: string;
  created_at: string;
  admin_response: string | null;
}

interface ProductTestimonialsProps {
  productId: string;
  productName?: string;
  className?: string;
}

interface RatingBreakdown {
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  average_rating: number;
  total_reviews: number;
}

// =====================================================
// PRODUCT TESTIMONIALS COMPONENT
// =====================================================

export function ProductTestimonials({
  productId,
  productName,
  className,
}: ProductTestimonialsProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [ratingBreakdown, setRatingBreakdown] = useState<RatingBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displayLimit = 3; // Show only 3 testimonials initially

  useEffect(() => {
    fetchTestimonials();
  }, [productId]);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      // Fetch product testimonials
      const response = await fetch(
        `/api/testimonials?product_id=${productId}&limit=50&sort_by=created_at&sort_order=desc`
      );
      const data = await response.json();

      if (response.ok) {
        setTestimonials(data.testimonials);
        calculateRatingBreakdown(data.testimonials);
      }
    } catch (error) {
      console.error('Error fetching product testimonials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate rating breakdown
  const calculateRatingBreakdown = (testimonials: Testimonial[]) => {
    const breakdown = {
      five_star_count: 0,
      four_star_count: 0,
      three_star_count: 0,
      two_star_count: 0,
      one_star_count: 0,
      total_reviews: testimonials.length,
      average_rating: 0,
    };

    testimonials.forEach((t) => {
      if (t.rating === 5) breakdown.five_star_count++;
      else if (t.rating === 4) breakdown.four_star_count++;
      else if (t.rating === 3) breakdown.three_star_count++;
      else if (t.rating === 2) breakdown.two_star_count++;
      else if (t.rating === 1) breakdown.one_star_count++;
    });

    if (testimonials.length > 0) {
      const totalRating = testimonials.reduce((sum, t) => sum + t.rating, 0);
      breakdown.average_rating = totalRating / testimonials.length;
    }

    setRatingBreakdown(breakdown);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get percentage for rating bar
  const getRatingPercentage = (count: number, total: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  const displayedTestimonials = showAll
    ? testimonials
    : testimonials.slice(0, displayLimit);

  if (isLoading) {
    return (
      <div className={cn('w-full py-8', className)}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>

        {/* Write Review Button */}
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PenSquare className="mr-2 h-4 w-4" />
              Write a Review
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Review {productName || 'This Product'}
              </DialogTitle>
            </DialogHeader>
            <TestimonialSubmitForm
              productId={productId}
              onSuccess={() => {
                setIsSubmitDialogOpen(false);
                fetchTestimonials();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Rating Summary */}
      {ratingBreakdown && ratingBreakdown.total_reviews > 0 && (
        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-gray-900">
                {ratingBreakdown.average_rating.toFixed(1)}
              </div>
              <StaticStarRating
                rating={ratingBreakdown.average_rating}
                size="lg"
                className="mt-2"
              />
              <p className="text-sm text-gray-600 mt-2">
                Based on {ratingBreakdown.total_reviews}{' '}
                {ratingBreakdown.total_reviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count =
                  rating === 5
                    ? ratingBreakdown.five_star_count
                    : rating === 4
                    ? ratingBreakdown.four_star_count
                    : rating === 3
                    ? ratingBreakdown.three_star_count
                    : rating === 2
                    ? ratingBreakdown.two_star_count
                    : ratingBreakdown.one_star_count;

                const percentage = getRatingPercentage(
                  count,
                  ratingBreakdown.total_reviews
                );

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-12">
                      {rating} star
                    </span>
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Testimonials List */}
      {testimonials.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">
            No reviews yet. Be the first to review this product!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {displayedTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-lg border p-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {testimonial.customer_avatar_url ? (
                      <img
                        src={testimonial.customer_avatar_url}
                        alt={testimonial.customer_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {testimonial.customer_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.customer_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(testimonial.created_at)}
                      </p>
                    </div>
                  </div>
                  <StaticStarRating rating={testimonial.rating} size="sm" />
                </div>

                {/* Review Text */}
                <p className="text-gray-700 leading-relaxed">
                  {testimonial.review_text}
                </p>

                {/* Admin Response */}
                {testimonial.admin_response && (
                  <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Response from {productName || 'EZ Cycle Ramp'}:
                    </p>
                    <p className="text-sm text-blue-800">
                      {testimonial.admin_response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Show More Button */}
          {testimonials.length > displayLimit && !showAll && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAll(true)}
                className="gap-2"
              >
                Show All {testimonials.length} Reviews
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
