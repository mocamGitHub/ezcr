'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { StaticStarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  SortableTableHead,
  type SortDirection,
} from '@/components/ui/table';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  MessageSquareText,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Search,
  RotateCcw,
  ShoppingCart,
  Clock,
  User,
  Mail,
  CalendarDays,
  ExternalLink,
  BadgeCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// =====================================================
// TYPES
// =====================================================

interface Testimonial {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_avatar_url: string | null;
  rating: number;
  review_text: string;
  product_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  is_verified_customer: boolean;
  admin_response: string | null;
  admin_response_by: string | null;
  admin_response_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
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
// ADMIN TESTIMONIALS PAGE
// =====================================================

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isRespondDialogOpen, setIsRespondDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Customer orders for detail view
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Form states
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sorted testimonials
  const sortedTestimonials = useMemo(() => {
    if (!sortColumn || !sortDirection) return testimonials;

    return [...testimonials].sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortColumn) {
        case 'customer':
          aVal = a.customer_name;
          bVal = b.customer_name;
          break;
        case 'rating':
          aVal = a.rating;
          bVal = b.rating;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'date':
          aVal = a.created_at;
          bVal = b.created_at;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const comparison = String(aVal || '').localeCompare(String(bVal || ''));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [testimonials, sortColumn, sortDirection]);

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch testimonials
  useEffect(() => {
    fetchTestimonials();
  }, [statusFilter, currentPage]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTestimonials();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: statusFilter,
      });

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const response = await fetch(`/api/admin/testimonials?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setTestimonials(data.testimonials);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch testimonials');
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch customer orders
  const fetchCustomerOrders = async (email: string) => {
    setIsLoadingOrders(true);
    setCustomerOrders([]);
    try {
      const response = await fetch(`/api/admin/orders?search=${encodeURIComponent(email)}&limit=10`);
      const data = await response.json();
      if (response.ok && data.orders) {
        setCustomerOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Open detail dialog
  const openDetailDialog = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setIsDetailDialogOpen(true);
    fetchCustomerOrders(testimonial.customer_email);
  };

  // Handle approve (also used for un-reject)
  const handleApprove = async (fromDetail = false) => {
    if (!selectedTestimonial) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/testimonials/${selectedTestimonial.id}/approve`,
        { method: 'POST' }
      );

      if (response.ok) {
        const wasRejected = selectedTestimonial.status === 'rejected';
        setSuccessMessage(wasRejected ? 'Testimonial restored and approved' : 'Testimonial approved successfully');
        setIsApproveDialogOpen(false);
        if (fromDetail) {
          // Update the selected testimonial in detail view
          const data = await response.json();
          setSelectedTestimonial(data.testimonial);
        }
        fetchTestimonials();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to approve testimonial');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedTestimonial || !rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/testimonials/${selectedTestimonial.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejection_reason: rejectionReason }),
        }
      );

      if (response.ok) {
        setSuccessMessage('Testimonial rejected');
        setIsRejectDialogOpen(false);
        setRejectionReason('');
        fetchTestimonials();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reject testimonial');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle respond
  const handleRespond = async () => {
    if (!selectedTestimonial || !adminResponse.trim()) {
      setError('Please provide a response');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/testimonials/${selectedTestimonial.id}/respond`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_response: adminResponse }),
        }
      );

      if (response.ok) {
        setSuccessMessage('Response added successfully');
        setIsRespondDialogOpen(false);
        setAdminResponse('');
        fetchTestimonials();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add response');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle featured with optimistic update
  const handleToggleFeatured = async (testimonial: Testimonial, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent row click

    const newFeaturedState = !testimonial.is_featured;

    // Optimistic update
    setTestimonials(prev => prev.map(t =>
      t.id === testimonial.id ? { ...t, is_featured: newFeaturedState } : t
    ));

    // Also update selected testimonial if open in detail
    if (selectedTestimonial?.id === testimonial.id) {
      setSelectedTestimonial(prev => prev ? { ...prev, is_featured: newFeaturedState } : null);
    }

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/testimonials/${testimonial.id}/feature`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_featured: newFeaturedState }),
          }
        );

        if (response.ok) {
          setSuccessMessage(`Testimonial ${newFeaturedState ? 'featured' : 'unfeatured'}`);
        } else {
          // Revert on error
          setTestimonials(prev => prev.map(t =>
            t.id === testimonial.id ? { ...t, is_featured: !newFeaturedState } : t
          ));
          if (selectedTestimonial?.id === testimonial.id) {
            setSelectedTestimonial(prev => prev ? { ...prev, is_featured: !newFeaturedState } : null);
          }
          setError('Failed to update featured status');
        }
      } catch (error) {
        // Revert on error
        setTestimonials(prev => prev.map(t =>
          t.id === testimonial.id ? { ...t, is_featured: !newFeaturedState } : t
        ));
        if (selectedTestimonial?.id === testimonial.id) {
          setSelectedTestimonial(prev => prev ? { ...prev, is_featured: !newFeaturedState } : null);
        }
        setError('Failed to update featured status');
      }
    });
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTestimonial) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/testimonials/${selectedTestimonial.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setSuccessMessage('Testimonial deleted successfully');
        setIsDeleteDialogOpen(false);
        setIsDetailDialogOpen(false);
        fetchTestimonials();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete testimonial');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format date with time
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Order status colors
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600';
      case 'shipped':
        return 'text-blue-600';
      case 'processing':
        return 'text-yellow-600';
      case 'pending':
        return 'text-gray-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <MessageSquareText className="h-8 w-8" />
          Testimonials Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Approve, reject, and respond to customer testimonials
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or review..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground">
            {pagination?.total ?? 0} testimonial{(pagination?.total ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquareText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No testimonials found</p>
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortKey="customer"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Customer
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="rating"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Rating
                  </SortableTableHead>
                  <TableHead>Review</TableHead>
                  <SortableTableHead
                    sortKey="status"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Status
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="date"
                    currentSort={sortColumn}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Date
                  </SortableTableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTestimonials.map((testimonial) => (
                  <TableRow
                    key={testimonial.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetailDialog(testimonial)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{testimonial.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StaticStarRating rating={testimonial.rating} size="sm" />
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm line-clamp-2">{testimonial.review_text}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={getStatusBadgeVariant(testimonial.status)}>
                          {testimonial.status}
                        </Badge>
                        {testimonial.is_featured && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(testimonial.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {testimonial.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Approve"
                              onClick={() => {
                                setSelectedTestimonial(testimonial);
                                setIsApproveDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Reject"
                              onClick={() => {
                                setSelectedTestimonial(testimonial);
                                setIsRejectDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {testimonial.status === 'approved' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Add Response"
                              onClick={() => {
                                setSelectedTestimonial(testimonial);
                                setAdminResponse(testimonial.admin_response || '');
                                setIsRespondDialogOpen(true);
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              title={testimonial.is_featured ? 'Unfeature' : 'Feature'}
                              onClick={(e) => handleToggleFeatured(testimonial, e)}
                            >
                              <Star
                                className={cn(
                                  'h-4 w-4',
                                  testimonial.is_featured && 'fill-yellow-400 text-yellow-400'
                                )}
                              />
                            </Button>
                          </>
                        )}
                        {testimonial.status === 'rejected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Restore & Approve"
                            onClick={() => {
                              setSelectedTestimonial(testimonial);
                              setIsApproveDialogOpen(true);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          title="Delete"
                          onClick={() => {
                            setSelectedTestimonial(testimonial);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="border-t p-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={!pagination.has_prev_page}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!pagination.has_next_page}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              Testimonial Details
            </DialogTitle>
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
                      <a href={`mailto:${selectedTestimonial.customer_email}`} className="hover:underline">
                        {selectedTestimonial.customer_email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Submitted {formatDateTime(selectedTestimonial.created_at)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={getStatusBadgeVariant(selectedTestimonial.status)} className="capitalize">
                      {selectedTestimonial.status}
                    </Badge>
                    {selectedTestimonial.is_featured && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
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
                    <span className="font-medium text-sm text-red-700 dark:text-red-400">Rejection Reason</span>
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
                      <span>Response added: {formatDateTime(selectedTestimonial.admin_response_at)}</span>
                    </div>
                  )}
                  {selectedTestimonial.updated_at !== selectedTestimonial.created_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span>Last updated: {formatDateTime(selectedTestimonial.updated_at)}</span>
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
                    <Button
                      onClick={() => handleApprove(true)}
                      disabled={isSubmitting}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsDetailDialogOpen(false);
                        setIsRejectDialogOpen(true);
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
                        setAdminResponse(selectedTestimonial.admin_response || '');
                        setIsDetailDialogOpen(false);
                        setIsRespondDialogOpen(true);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {selectedTestimonial.admin_response ? 'Edit Response' : 'Add Response'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleToggleFeatured(selectedTestimonial)}
                    >
                      <Star className={cn(
                        'h-4 w-4 mr-2',
                        selectedTestimonial.is_featured && 'fill-yellow-400 text-yellow-400'
                      )} />
                      {selectedTestimonial.is_featured ? 'Unfeature' : 'Feature'}
                    </Button>
                  </>
                )}
                {selectedTestimonial.status === 'rejected' && (
                  <Button
                    onClick={() => handleApprove(true)}
                    disabled={isSubmitting}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore & Approve
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    setIsDeleteDialogOpen(true);
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
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTestimonial?.status === 'rejected' ? 'Restore & Approve Testimonial' : 'Approve Testimonial'}
            </DialogTitle>
          </DialogHeader>
          <p>
            {selectedTestimonial?.status === 'rejected'
              ? 'This will restore the rejected testimonial and approve it for display.'
              : 'Are you sure you want to approve this testimonial?'
            }
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleApprove(false)} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                selectedTestimonial?.status === 'rejected' ? 'Restore & Approve' : 'Approve'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
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
            <Button onClick={handleRespond} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Testimonial</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this testimonial? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
