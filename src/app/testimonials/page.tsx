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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Filter, PenSquare } from 'lucide-react';
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

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

// =====================================================
// TESTIMONIALS PAGE
// =====================================================

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // Filters
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch testimonials
  useEffect(() => {
    fetchTestimonials();
  }, [ratingFilter, sortBy, currentPage]);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort_by: sortBy,
        sort_order: 'desc',
      });

      if (ratingFilter !== 'all') {
        params.append('rating', ratingFilter);
      }

      const response = await fetch(`/api/testimonials?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setTestimonials(data.testimonials);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes
  const handleRatingFilterChange = (value: string) => {
    setRatingFilter(value);
    setCurrentPage(1); // Reset to first page
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (pagination?.has_prev_page) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination?.has_next_page) {
      setCurrentPage((prev) => prev + 1);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Customer Testimonials
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                See what our customers are saying about us
              </p>
            </div>

            {/* Submit Testimonial Button */}
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <PenSquare className="mr-2 h-5 w-5" />
                  Write a Review
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Submit Your Testimonial</DialogTitle>
                </DialogHeader>
                <TestimonialSubmitForm
                  onSuccess={() => {
                    setIsSubmitDialogOpen(false);
                    fetchTestimonials();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>

            {/* Rating Filter */}
            <Select value={ratingFilter} onValueChange={handleRatingFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Most Recent</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>

            {/* Total Count */}
            {pagination && (
              <span className="ml-auto text-sm text-gray-600">
                {pagination.total} {pagination.total === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No testimonials found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Rating */}
                  <StaticStarRating rating={testimonial.rating} size="sm" />

                  {/* Review Text */}
                  <p className="mt-4 text-gray-700 line-clamp-4">
                    "{testimonial.review_text}"
                  </p>

                  {/* Customer Info */}
                  <div className="mt-6 flex items-center gap-3">
                    {testimonial.customer_avatar_url ? (
                      <img
                        src={testimonial.customer_avatar_url}
                        alt={testimonial.customer_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                        {testimonial.customer_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {testimonial.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(testimonial.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Admin Response */}
                  {testimonial.admin_response && (
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-1">
                        Response:
                      </p>
                      <p className="text-xs text-blue-800">
                        {testimonial.admin_response}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={!pagination.has_prev_page}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.total_pages}
                </span>

                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={!pagination.has_next_page}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
