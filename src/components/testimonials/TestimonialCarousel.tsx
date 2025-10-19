'use client';

import React, { useState, useEffect } from 'react';
import { StaticStarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
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

interface TestimonialCarouselProps {
  testimonials?: Testimonial[]; // Pre-loaded testimonials (SSR)
  autoPlay?: boolean;
  autoPlayInterval?: number; // In milliseconds
  className?: string;
}

// =====================================================
// TESTIMONIAL CAROUSEL COMPONENT
// =====================================================

export function TestimonialCarousel({
  testimonials: initialTestimonials,
  autoPlay = true,
  autoPlayInterval = 5000,
  className,
}: TestimonialCarouselProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    initialTestimonials || []
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(!initialTestimonials);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch featured testimonials if not provided
  useEffect(() => {
    if (!initialTestimonials) {
      fetchFeaturedTestimonials();
    }
  }, [initialTestimonials]);

  // Auto-play carousel
  useEffect(() => {
    if (!autoPlay || isPaused || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, isPaused, currentIndex, testimonials.length, autoPlayInterval]);

  // Fetch featured testimonials
  const fetchFeaturedTestimonials = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/testimonials?featured=true&limit=10');
      const data = await response.json();

      if (response.ok && data.testimonials) {
        setTestimonials(data.testimonials);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to next testimonial
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  // Navigate to previous testimonial
  const handlePrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  // Jump to specific testimonial
  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (isLoading) {
    return (
      <div className={cn('w-full py-12', className)}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <div className={cn('w-full py-12 text-center', className)}>
        <p className="text-gray-500">No testimonials available yet.</p>
      </div>
    );
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div
      className={cn('w-full', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative bg-white rounded-lg shadow-lg p-8 md:p-12">
        {/* Quote Icon */}
        <div className="absolute top-4 left-4 text-blue-100">
          <Quote className="w-12 h-12" />
        </div>

        {/* Testimonial Content */}
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Rating */}
          <div className="flex justify-center mb-6">
            <StaticStarRating rating={currentTestimonial.rating} size="lg" />
          </div>

          {/* Review Text */}
          <blockquote className="text-lg md:text-xl text-gray-700 text-center mb-6 leading-relaxed">
            "{currentTestimonial.review_text}"
          </blockquote>

          {/* Customer Info */}
          <div className="flex items-center justify-center gap-4">
            {/* Avatar */}
            {currentTestimonial.customer_avatar_url ? (
              <img
                src={currentTestimonial.customer_avatar_url}
                alt={currentTestimonial.customer_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {currentTestimonial.customer_name.charAt(0)}
              </div>
            )}

            {/* Name */}
            <div className="text-center">
              <p className="font-semibold text-gray-900">
                {currentTestimonial.customer_name}
              </p>
              <p className="text-sm text-gray-500">Verified Customer</p>
            </div>
          </div>

          {/* Admin Response (if exists) */}
          {currentTestimonial.admin_response && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Response from EZ Cycle Ramp:
              </p>
              <p className="text-sm text-blue-800">
                {currentTestimonial.admin_response}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {testimonials.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md hover:bg-gray-100"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md hover:bg-gray-100"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-blue-600 w-8'
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
