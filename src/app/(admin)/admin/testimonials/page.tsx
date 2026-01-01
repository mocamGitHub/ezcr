'use client'

import React, { useState, useEffect, useCallback, useTransition, useMemo } from 'react'
import type { DateRange } from 'react-day-picker'
import { usePageTitle } from '@/hooks/usePageTitle'
import { StaticStarRating } from '@/components/ui/star-rating'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Star,
  Trash2,
  Loader2,
  RotateCcw,
  ShoppingCart,
  Clock,
  User,
  Mail,
  CalendarDays,
  ExternalLink,
  BadgeCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  AdminDataTable,
  AdminFilterBar,
  FilterPresetDropdown,
  PageHeader,
  useFilters,
  type ColumnDef,
  type RowAction,
  type FilterConfig,
} from '@/components/admin'
import {
  getTestimonialsPaginated,
  approveTestimonial,
  rejectTestimonial,
  respondToTestimonial,
  toggleFeaturedTestimonial,
  deleteTestimonial,
  getCustomerOrders,
  type Testimonial,
  type CustomerOrder,
} from './actions'

export default function AdminTestimonialsPage() {
  usePageTitle('Testimonials')

  // Table state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [sortColumn, setSortColumn] = useState('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // URL-synced filters with presets
  type TestimonialFilters = {
    status: 'all' | 'pending' | 'approved' | 'rejected'
    featured: 'all' | 'featured' | 'not_featured'
    rating: 'all' | '1' | '2' | '3' | '4' | '5'
    dateRange: DateRange | undefined
    [key: string]: unknown
  }

  const {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    applyPreset,
  } = useFilters<TestimonialFilters>({
    initialState: {
      status: 'all',
      featured: 'all',
      rating: 'all',
      dateRange: undefined,
    },
    syncToUrl: true,
    urlPrefix: 'f_',
  })

  const { status: statusFilter, featured: featuredFilter, rating: ratingFilter, dateRange } = filters

  // Dialog states
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isRespondDialogOpen, setIsRespondDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Customer orders for detail view
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  // Form states
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminResponse, setAdminResponse] = useState('')

  const [isPending, startTransition] = useTransition()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getTestimonialsPaginated({
        page,
        pageSize,
        sortColumn,
        sortDirection,
        search,
        status: statusFilter,
        featured: featuredFilter,
        rating: ratingFilter,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
      })
      setTestimonials(result.data)
      setTotalCount(result.totalCount)
    } catch (err: any) {
      console.error('Error loading testimonials:', err)
      setError(err.message || 'Failed to load testimonials')
      toast.error('Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortColumn, sortDirection, search, statusFilter, featuredFilter, ratingFilter, dateRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusFilterChange = (value: 'all' | 'pending' | 'approved' | 'rejected') => {
    updateFilter('status', value)
    setPage(1)
  }

  const handleFeaturedFilterChange = (value: 'all' | 'featured' | 'not_featured') => {
    updateFilter('featured', value)
    setPage(1)
  }

  const handleRatingFilterChange = (value: 'all' | '1' | '2' | '3' | '4' | '5') => {
    updateFilter('rating', value)
    setPage(1)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    updateFilter('dateRange', range)
    setPage(1)
  }

  const handleClearFilters = () => {
    resetFilters()
    setPage(1)
  }

  const handleApplyPreset = (preset: Record<string, unknown>) => {
    if (applyPreset) {
      applyPreset(preset as Partial<TestimonialFilters>)
      setPage(1)
    }
  }

  // Filter configuration for AdminFilterBar
  const filterConfig: FilterConfig[] = useMemo(() => [
    {
      type: 'select' as const,
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: (v: string) => handleStatusFilterChange(v as 'all' | 'pending' | 'approved' | 'rejected'),
      allLabel: 'All Statuses',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    {
      type: 'select' as const,
      key: 'featured',
      label: 'Featured',
      value: featuredFilter,
      onChange: (v: string) => handleFeaturedFilterChange(v as 'all' | 'featured' | 'not_featured'),
      allLabel: 'All',
      options: [
        { value: 'featured', label: 'Featured' },
        { value: 'not_featured', label: 'Not Featured' },
      ],
    },
    {
      type: 'select' as const,
      key: 'rating',
      label: 'Rating',
      value: ratingFilter,
      onChange: (v: string) => handleRatingFilterChange(v as 'all' | '1' | '2' | '3' | '4' | '5'),
      allLabel: 'All Ratings',
      options: [
        { value: '5', label: '5 Stars' },
        { value: '4', label: '4 Stars' },
        { value: '3', label: '3 Stars' },
        { value: '2', label: '2 Stars' },
        { value: '1', label: '1 Star' },
      ],
    },
    {
      type: 'daterange' as const,
      key: 'dateRange',
      label: 'Created Date',
      value: dateRange,
      onChange: handleDateRangeChange,
      placeholder: 'Filter by date',
      presets: true,
    },
  ], [statusFilter, featuredFilter, ratingFilter, dateRange])

  // Open detail dialog
  const openDetailDialog = async (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial)
    setIsDetailDialogOpen(true)
    setIsLoadingOrders(true)
    try {
      const orders = await getCustomerOrders(testimonial.customer_email)
      setCustomerOrders(orders)
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  // Handle approve
  const handleApprove = async (fromDetail = false) => {
    if (!selectedTestimonial) return

    startTransition(async () => {
      try {
        const wasRejected = selectedTestimonial.status === 'rejected'
        const updated = await approveTestimonial(selectedTestimonial.id)
        toast.success(wasRejected ? 'Testimonial restored and approved' : 'Testimonial approved')
        setIsApproveDialogOpen(false)
        if (fromDetail) {
          setSelectedTestimonial(updated)
        }
        loadData()
      } catch (err: any) {
        toast.error(err.message || 'Failed to approve testimonial')
      }
    })
  }

  // Handle reject
  const handleReject = async () => {
    if (!selectedTestimonial || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    startTransition(async () => {
      try {
        await rejectTestimonial(selectedTestimonial.id, rejectionReason)
        toast.success('Testimonial rejected')
        setIsRejectDialogOpen(false)
        setRejectionReason('')
        loadData()
      } catch (err: any) {
        toast.error(err.message || 'Failed to reject testimonial')
      }
    })
  }

  // Handle respond
  const handleRespond = async () => {
    if (!selectedTestimonial || !adminResponse.trim()) {
      toast.error('Please provide a response')
      return
    }

    startTransition(async () => {
      try {
        await respondToTestimonial(selectedTestimonial.id, adminResponse)
        toast.success('Response added successfully')
        setIsRespondDialogOpen(false)
        setAdminResponse('')
        loadData()
      } catch (err: any) {
        toast.error(err.message || 'Failed to add response')
      }
    })
  }

  // Handle toggle featured
  const handleToggleFeatured = async (testimonial: Testimonial, e?: React.MouseEvent) => {
    e?.stopPropagation()

    const newFeaturedState = !testimonial.is_featured

    // Optimistic update
    setTestimonials((prev) =>
      prev.map((t) => (t.id === testimonial.id ? { ...t, is_featured: newFeaturedState } : t))
    )
    if (selectedTestimonial?.id === testimonial.id) {
      setSelectedTestimonial((prev) => (prev ? { ...prev, is_featured: newFeaturedState } : null))
    }

    startTransition(async () => {
      try {
        await toggleFeaturedTestimonial(testimonial.id, newFeaturedState)
        toast.success(`Testimonial ${newFeaturedState ? 'featured' : 'unfeatured'}`)
      } catch (err) {
        // Revert on error
        setTestimonials((prev) =>
          prev.map((t) => (t.id === testimonial.id ? { ...t, is_featured: !newFeaturedState } : t))
        )
        if (selectedTestimonial?.id === testimonial.id) {
          setSelectedTestimonial((prev) => (prev ? { ...prev, is_featured: !newFeaturedState } : null))
        }
        toast.error('Failed to update featured status')
      }
    })
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTestimonial) return

    startTransition(async () => {
      try {
        await deleteTestimonial(selectedTestimonial.id)
        toast.success('Testimonial deleted')
        setIsDeleteDialogOpen(false)
        setIsDetailDialogOpen(false)
        loadData()
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete testimonial')
      }
    })
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Format date with time
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'rejected':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Order status colors
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600'
      case 'shipped':
        return 'text-blue-600'
      case 'processing':
        return 'text-yellow-600'
      case 'pending':
        return 'text-gray-600'
      default:
        return 'text-muted-foreground'
    }
  }

  // Column definitions
  const columns: ColumnDef<Testimonial>[] = [
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      cell: (testimonial) => (
        <div>
          <p className="font-medium">{testimonial.customer_name}</p>
          <p className="text-sm text-muted-foreground">{testimonial.customer_email}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      cell: (testimonial) => <StaticStarRating rating={testimonial.rating} size="sm" />,
    },
    {
      key: 'review_text',
      header: 'Review',
      cell: (testimonial) => (
        <p className="text-sm line-clamp-2 max-w-md">{testimonial.review_text}</p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (testimonial) => (
        <div className="flex flex-col gap-1">
          <Badge variant={getStatusBadgeVariant(testimonial.status)}>{testimonial.status}</Badge>
          {testimonial.is_featured && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      cell: (testimonial) => (
        <span className="text-sm text-muted-foreground">{formatDate(testimonial.created_at)}</span>
      ),
    },
  ]

  // Row actions
  const getRowActions = (testimonial: Testimonial): RowAction<Testimonial>[] => {
    const actions: RowAction<Testimonial>[] = []

    if (testimonial.status === 'pending') {
      actions.push({
        label: 'Approve',
        onClick: () => {
          setSelectedTestimonial(testimonial)
          setIsApproveDialogOpen(true)
        },
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      })
      actions.push({
        label: 'Reject',
        onClick: () => {
          setSelectedTestimonial(testimonial)
          setIsRejectDialogOpen(true)
        },
        icon: <XCircle className="h-4 w-4 text-red-600" />,
      })
    }

    if (testimonial.status === 'approved') {
      actions.push({
        label: 'Add Response',
        onClick: () => {
          setSelectedTestimonial(testimonial)
          setAdminResponse(testimonial.admin_response || '')
          setIsRespondDialogOpen(true)
        },
        icon: <MessageSquare className="h-4 w-4" />,
      })
      actions.push({
        label: testimonial.is_featured ? 'Unfeature' : 'Feature',
        onClick: () => handleToggleFeatured(testimonial),
        icon: (
          <Star
            className={cn('h-4 w-4', testimonial.is_featured && 'fill-yellow-400 text-yellow-400')}
          />
        ),
      })
    }

    if (testimonial.status === 'rejected') {
      actions.push({
        label: 'Restore & Approve',
        onClick: () => {
          setSelectedTestimonial(testimonial)
          setIsApproveDialogOpen(true)
        },
        icon: <RotateCcw className="h-4 w-4 text-blue-600" />,
      })
    }

    actions.push({
      label: 'Delete',
      onClick: () => {
        setSelectedTestimonial(testimonial)
        setIsDeleteDialogOpen(true)
      },
      icon: <Trash2 className="h-4 w-4" />,
      destructive: true,
      separator: true,
    })

    return actions
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Testimonials"
        description="Approve, reject, and respond to customer testimonials"
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <AdminFilterBar
          filters={filterConfig}
          onClearAll={handleClearFilters}
          showFilterIcon
        />
        <FilterPresetDropdown
          page="testimonials"
          currentFilters={filters}
          onApplyPreset={handleApplyPreset}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <AdminDataTable
        data={testimonials}
        columns={columns}
        keyField="id"
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name, email, or review..."
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyTitle="No testimonials found"
        emptyDescription="Customer testimonials will appear here once submitted."
        rowActions={getRowActions}
        onRowClick={openDetailDialog}
      />

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">Testimonial Details</DialogTitle>
          </DialogHeader>

          {selectedTestimonial && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedTestimonial.customer_name}</span>
                      {selectedTestimonial.is_verified_customer && (
                        <Badge variant="outline" className="text-xs">
                          <BadgeCheck className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a
                        href={`mailto:${selectedTestimonial.customer_email}`}
                        className="hover:underline"
                      >
                        {selectedTestimonial.customer_email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Submitted {formatDateTime(selectedTestimonial.created_at)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={getStatusBadgeVariant(selectedTestimonial.status)}
                      className="capitalize"
                    >
                      {selectedTestimonial.status}
                    </Badge>
                    {selectedTestimonial.is_featured && (
                      <Badge
                        variant="outline"
                        className="border-yellow-500 text-yellow-700 dark:text-yellow-400"
                      >
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating and Review */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <StaticStarRating rating={selectedTestimonial.rating} size="md" />
                  <span className="text-lg font-medium">{selectedTestimonial.rating}/5</span>
                </div>
                <p className="text-sm leading-relaxed">{selectedTestimonial.review_text}</p>
              </div>

              {/* Admin Response */}
              {selectedTestimonial.admin_response && (
                <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Admin Response</span>
                    {selectedTestimonial.admin_response_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(selectedTestimonial.admin_response_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{selectedTestimonial.admin_response}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedTestimonial.status === 'rejected' && selectedTestimonial.rejection_reason && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-sm text-red-700 dark:text-red-400">
                      Rejection Reason
                    </span>
                    {selectedTestimonial.rejected_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(selectedTestimonial.rejected_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{selectedTestimonial.rejection_reason}</p>
                </div>
              )}

              {/* History Timeline */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  History
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span>Created: {formatDateTime(selectedTestimonial.created_at)}</span>
                  </div>
                  {selectedTestimonial.approved_at && (
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Approved: {formatDateTime(selectedTestimonial.approved_at)}</span>
                    </div>
                  )}
                  {selectedTestimonial.rejected_at && (
                    <div className="flex items-center gap-2 text-red-600">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Rejected: {formatDateTime(selectedTestimonial.rejected_at)}</span>
                    </div>
                  )}
                  {selectedTestimonial.admin_response_at && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>
                        Response added: {formatDateTime(selectedTestimonial.admin_response_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Orders */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Customer Orders
                </h4>
                {isLoadingOrders ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading orders...
                  </div>
                ) : customerOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders found for this customer.</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((order) => (
                      <a
                        key={order.id}
                        href={`/admin/orders?search=${order.order_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm">{order.order_number}</span>
                          <span className={cn('text-sm capitalize', getOrderStatusColor(order.status))}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            ${(order.total_amount / 100).toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(order.created_at)}
                          </span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedTestimonial.status === 'pending' && (
                  <>
                    <Button onClick={() => handleApprove(true)} disabled={isPending}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsDetailDialogOpen(false)
                        setIsRejectDialogOpen(true)
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                {selectedTestimonial.status === 'approved' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAdminResponse(selectedTestimonial.admin_response || '')
                        setIsDetailDialogOpen(false)
                        setIsRespondDialogOpen(true)
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {selectedTestimonial.admin_response ? 'Edit Response' : 'Add Response'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleToggleFeatured(selectedTestimonial)}
                    >
                      <Star
                        className={cn(
                          'h-4 w-4 mr-2',
                          selectedTestimonial.is_featured && 'fill-yellow-400 text-yellow-400'
                        )}
                      />
                      {selectedTestimonial.is_featured ? 'Unfeature' : 'Feature'}
                    </Button>
                  </>
                )}
                {selectedTestimonial.status === 'rejected' && (
                  <Button onClick={() => handleApprove(true)} disabled={isPending}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore & Approve
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    setIsDetailDialogOpen(false)
                    setIsDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedTestimonial?.status === 'rejected'
                ? 'Restore & Approve Testimonial'
                : 'Approve Testimonial'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTestimonial?.status === 'rejected'
                ? 'This will restore the rejected testimonial and approve it for display.'
                : 'Are you sure you want to approve this testimonial?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleApprove(false)} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : selectedTestimonial?.status === 'rejected' ? (
                'Restore & Approve'
              ) : (
                'Approve'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Testimonial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection_reason">Rejection Reason *</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Respond Dialog */}
      <Dialog open={isRespondDialogOpen} onOpenChange={setIsRespondDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTestimonial?.admin_response ? 'Edit Admin Response' : 'Add Admin Response'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin_response">Your Response *</Label>
              <Textarea
                id="admin_response"
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Write your response..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRespondDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRespond} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this testimonial? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
