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
    <div className="min-h-screen bg-background">
      {/* Hero Section - Consistent with other pages */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white/80 mb-6">
              <Star className="w-4 h-4 text-[#F78309]" />
              <span>Rated 4.9/5 by 500+ customers</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Customer Testimonials
            </h1>
            <p className="text-xl text-blue-100">
              Real stories from real riders who trust EZ Cycle Ramp for their motorcycle loading needs
            </p>
          </div>
          {/* Submit Testimonial Button */}
          <div className="mt-8">
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90 text-white">
                  <PenSquare className="mr-2 h-5 w-5" />
                  Share Your Experience
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-background border">
                <DialogHeader>
                  <DialogTitle>Submit Your Testimonial</DialogTitle>
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
      </section>

      {/* Filters Bar */}
      <div className="sticky top-16 z-40 backdrop-blur-xl bg-background/95 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Rating Filter */}
            <Select value={ratingFilter} onValueChange={handleRatingFilterChange}>
              <SelectTrigger className="w-[140px]">
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
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Most Recent</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>

            {/* Total Count */}
            {pagination && (
              <span className="ml-auto text-sm text-muted-foreground">
                {pagination.total} {pagination.total === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F78309]"></div>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-muted border border-border rounded-2xl p-12 max-w-md mx-auto">
              <Quote className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No testimonials found.</p>
              <p className="text-muted-foreground/70 text-sm mt-2">Be the first to share your experience!</p>
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
                    bg-card
                    border border-border hover:border-[#F78309]/30
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
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-muted-foreground/10 group-hover:text-[#F78309]/20 transition-colors" />

                  <div className="relative z-10">
                    {/* Rating */}
                    <div className="mb-4">
                      <StaticStarRating rating={testimonial.rating} size="sm" />
                    </div>

                    {/* Review Text */}
                    <blockquote className={`text-foreground/80 leading-relaxed ${index % 5 === 0 ? '' : 'line-clamp-4'}`}>
                      &ldquo;{testimonial.review_text}&rdquo;
                    </blockquote>

                    {/* Customer Info */}
                    <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
                      {testimonial.customer_avatar_url ? (
                        <img
                          src={testimonial.customer_avatar_url}
                          alt={testimonial.customer_name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B5394] to-[#F78309] flex items-center justify-center text-white font-bold text-sm ring-2 ring-border">
                          {testimonial.customer_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {testimonial.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(testimonial.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Admin Response */}
                    {testimonial.admin_response && (
                      <div className="mt-4 p-4 bg-[#0B5394]/10 dark:bg-[#0B5394]/20 rounded-xl border border-[#0B5394]/20 dark:border-[#0B5394]/30">
                        <p className="text-xs font-semibold text-[#0B5394] dark:text-blue-400 mb-1">
                          Response from EZ Cycle Ramp:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.admin_response}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={!pagination.has_prev_page}
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
                            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
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
