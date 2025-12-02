'use client'

import React, { useState, useEffect } from 'react'
import { StaticStarRating } from '@/components/ui/star-rating'
import { Button } from '@/components/ui/button'
import { TestimonialSubmitForm } from '@/components/testimonials/TestimonialSubmitForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Filter, PenSquare, Quote, Star } from 'lucide-react'

// =====================================================
// TYPES
// =====================================================

interface Testimonial {
  id: string
  customer_name: string
  customer_avatar_url: string | null
  rating: number
  review_text: string
  created_at: string
  admin_response: string | null
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  total_pages: number
  has_next_page: boolean
  has_prev_page: boolean
}

// =====================================================
// TESTIMONIALS PAGE - Glassmorphism Grid Layout
// =====================================================

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  // Filters
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch testimonials
  useEffect(() => {
    fetchTestimonials()
  }, [ratingFilter, sortBy, currentPage])

  const fetchTestimonials = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort_by: sortBy,
        sort_order: 'desc',
      })

      if (ratingFilter !== 'all') {
        params.append('rating', ratingFilter)
      }

      const response = await fetch(`/api/testimonials?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setTestimonials(data.testimonials)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle filter changes
  const handleRatingFilterChange = (value: string) => {
    setRatingFilter(value)
    setCurrentPage(1)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setCurrentPage(1)
  }

  // Pagination handlers
  const handlePreviousPage = () => {
    if (pagination?.has_prev_page) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination?.has_next_page) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0B5394]/20 to-slate-900">
      {/* Hero Header with Gradient */}
      <div className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#F78309]/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0B5394]/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white/80 mb-6">
              <Star className="w-4 h-4 text-[#F78309]" />
              <span>Rated 4.9/5 by 500+ customers</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Customer <span className="text-[#F78309]">Testimonials</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Real stories from real riders who trust EZ Cycle Ramp for their motorcycle loading needs
            </p>
          </div>

          {/* Submit Testimonial Button */}
          <div className="flex justify-center">
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white shadow-lg shadow-[#F78309]/25">
                  <PenSquare className="mr-2 h-5 w-5" />
                  Share Your Experience
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-slate-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Submit Your Testimonial</DialogTitle>
                </DialogHeader>
                <TestimonialSubmitForm
                  onSuccess={() => {
                    setIsSubmitDialogOpen(false)
                    fetchTestimonials()
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filters Bar - Glassmorphism */}
      <div className="sticky top-16 z-40 backdrop-blur-xl bg-slate-900/80 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-white/60">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Rating Filter */}
            <Select value={ratingFilter} onValueChange={handleRatingFilterChange}>
              <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="all" className="text-white hover:bg-white/10">All Ratings</SelectItem>
                <SelectItem value="5" className="text-white hover:bg-white/10">5 Stars</SelectItem>
                <SelectItem value="4" className="text-white hover:bg-white/10">4 Stars</SelectItem>
                <SelectItem value="3" className="text-white hover:bg-white/10">3 Stars</SelectItem>
                <SelectItem value="2" className="text-white hover:bg-white/10">2 Stars</SelectItem>
                <SelectItem value="1" className="text-white hover:bg-white/10">1 Star</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="created_at" className="text-white hover:bg-white/10">Most Recent</SelectItem>
                <SelectItem value="rating" className="text-white hover:bg-white/10">Highest Rated</SelectItem>
              </SelectContent>
            </Select>

            {/* Total Count */}
            {pagination && (
              <span className="ml-auto text-sm text-white/60">
                {pagination.total} {pagination.total === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Testimonials Grid - Glassmorphism Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F78309]"></div>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
              <Quote className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 text-lg">No testimonials found.</p>
              <p className="text-white/40 text-sm mt-2">Be the first to share your experience!</p>
            </div>
          </div>
        ) : (
          <>
            {/* Masonry-style Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`
                    group relative
                    bg-white/5 backdrop-blur-lg
                    border border-white/10 hover:border-[#F78309]/30
                    rounded-2xl p-6
                    transition-all duration-300
                    hover:shadow-xl hover:shadow-[#F78309]/5
                    hover:-translate-y-1
                    ${index % 5 === 0 ? 'md:row-span-2' : ''}
                  `}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F78309]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Quote icon */}
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-white/5 group-hover:text-[#F78309]/20 transition-colors" />

                  <div className="relative z-10">
                    {/* Rating */}
                    <div className="mb-4">
                      <StaticStarRating rating={testimonial.rating} size="sm" />
                    </div>

                    {/* Review Text */}
                    <blockquote className={`text-white/80 leading-relaxed ${index % 5 === 0 ? '' : 'line-clamp-4'}`}>
                      &ldquo;{testimonial.review_text}&rdquo;
                    </blockquote>

                    {/* Customer Info */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                      {testimonial.customer_avatar_url ? (
                        <img
                          src={testimonial.customer_avatar_url}
                          alt={testimonial.customer_name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B5394] to-[#F78309] flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/20">
                          {testimonial.customer_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white text-sm">
                          {testimonial.customer_name}
                        </p>
                        <p className="text-xs text-white/50">
                          {formatDate(testimonial.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Admin Response */}
                    {testimonial.admin_response && (
                      <div className="mt-4 p-4 bg-[#0B5394]/20 rounded-xl border border-[#0B5394]/30">
                        <p className="text-xs font-semibold text-[#0B5394] mb-1">
                          Response from EZ Cycle Ramp:
                        </p>
                        <p className="text-sm text-white/70">
                          {testimonial.admin_response}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination - Glassmorphism style */}
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={!pagination.has_prev_page}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                    .slice(Math.max(0, currentPage - 3), Math.min(pagination.total_pages, currentPage + 2))
                    .map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`
                          w-10 h-10 rounded-full text-sm font-medium transition-all
                          ${page === currentPage
                            ? 'bg-[#F78309] text-white shadow-lg shadow-[#F78309]/25'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                          }
                        `}
                      >
                        {page}
                      </button>
                    ))}
                </div>

                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={!pagination.has_next_page}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-30"
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
  )
}
