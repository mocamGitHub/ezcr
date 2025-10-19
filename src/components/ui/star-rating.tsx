'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// TYPES
// =====================================================

interface StarRatingProps {
  rating: number; // Current rating (1-5)
  max?: number; // Maximum rating (default: 5)
  size?: 'sm' | 'md' | 'lg'; // Size of stars
  interactive?: boolean; // Whether user can click to set rating
  onChange?: (rating: number) => void; // Callback when rating changes
  showValue?: boolean; // Show numeric value next to stars
  className?: string;
}

// =====================================================
// SIZE MAP
// =====================================================

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

// =====================================================
// STAR RATING COMPONENT
// =====================================================

export function StarRating({
  rating,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  // Ensure rating is within bounds
  const clampedRating = Math.max(0, Math.min(max, rating));
  const displayRating = hoverRating ?? clampedRating;

  // Handle star click
  const handleClick = (starValue: number) => {
    if (interactive && onChange) {
      onChange(starValue);
    }
  };

  // Handle mouse enter
  const handleMouseEnter = (starValue: number) => {
    if (interactive) {
      setHoverRating(starValue);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
              className={cn(
                'transition-all',
                interactive && 'cursor-pointer hover:scale-110',
                !interactive && 'cursor-default'
              )}
              aria-label={`Rate ${starValue} out of ${max} stars`}
            >
              <Star
                className={cn(
                  sizeMap[size],
                  'transition-colors',
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-none text-gray-300'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Numeric value */}
      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {clampedRating.toFixed(1)} / {max}
        </span>
      )}
    </div>
  );
}

// =====================================================
// STATIC STAR RATING (Display Only)
// =====================================================

interface StaticStarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number; // Optional review count
  className?: string;
}

export function StaticStarRating({
  rating,
  max = 5,
  size = 'md',
  showValue = false,
  reviewCount,
  className,
}: StaticStarRatingProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <StarRating
        rating={rating}
        max={max}
        size={size}
        interactive={false}
        showValue={showValue}
      />

      {/* Review count */}
      {reviewCount !== undefined && (
        <span className="text-sm text-gray-500">
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
