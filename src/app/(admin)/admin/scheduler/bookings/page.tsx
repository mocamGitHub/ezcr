'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  PageHeader,
  AdminDataTable,
  AdminDataTableSkeleton,
  type ColumnDef,
  type RowAction,
} from '@/components/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { RefreshCw, XCircle, Eye } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  getAdminBookings,
  cancelBooking,
  type SchedulerBooking,
  type GetAdminBookingsParams,
} from '@/actions/scheduler-admin'

function getStatusColor(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'rescheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

const columns: ColumnDef<SchedulerBooking>[] = [
  {
    key: 'start_at',
    header: 'Date/Time',
    sortable: true,
    cell: (booking) => (
      <div>
        <div className="font-medium">
          {format(new Date(booking.start_at), 'MMM d, yyyy')}
        </div>
        <div className="text-sm text-muted-foreground">
          {format(new Date(booking.start_at), 'h:mm a')}
          {booking.end_at && ` - ${format(new Date(booking.end_at), 'h:mm a')}`}
        </div>
      </div>
    ),
  },
  {
    key: 'title',
    header: 'Appointment',
    cell: (booking) => (
      <div>
        <div className="font-medium">{booking.title || 'Untitled'}</div>
        <div className="text-sm text-muted-foreground">
          {booking.host_email && `Host: ${booking.host_email}`}
        </div>
      </div>
    ),
  },
  {
    key: 'attendee_email',
    header: 'Attendee',
    sortable: true,
    cell: (booking) => (
      <div className="text-sm">{booking.attendee_email}</div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    cell: (booking) => (
      <Badge className={getStatusColor(booking.status)}>
        {booking.status}
      </Badge>
    ),
  },
  {
    key: 'created_at',
    header: 'Booked',
    sortable: true,
    cell: (booking) => (
      <span className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
      </span>
    ),
  },
]

export default function AdminSchedulerBookingsPage() {
  usePageTitle('Bookings')

  const [bookings, setBookings] = useState<SchedulerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [sortColumn, setSortColumn] = useState('start_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'cancelled' | 'rescheduled'>('all')

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<SchedulerBooking | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: GetAdminBookingsParams = {
        page,
        pageSize,
        sortColumn,
        sortDirection,
        search: searchValue,
        statusFilter,
      }
      const result = await getAdminBookings(params)
      setBookings(result.data)
      setTotalCount(result.totalCount)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load bookings')
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortColumn, sortDirection, searchValue, statusFilter])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

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
    setSearchValue(value)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as typeof statusFilter)
    setPage(1)
  }

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return

    setCancelling(true)
    try {
      await cancelBooking(bookingToCancel.id)
      toast.success('Booking cancelled successfully')
      setCancelDialogOpen(false)
      setBookingToCancel(null)
      fetchBookings()
    } catch (err) {
      console.error('Error cancelling booking:', err)
      toast.error('Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const rowActions = (booking: SchedulerBooking): RowAction<SchedulerBooking>[] => {
    const actions: RowAction<SchedulerBooking>[] = [
      {
        label: 'View Details',
        icon: <Eye className="h-4 w-4" />,
        onClick: () => {
          toast.info('Booking details view coming soon!')
        },
      },
    ]

    if (booking.status === 'scheduled') {
      actions.push({
        label: 'Cancel Booking',
        icon: <XCircle className="h-4 w-4" />,
        destructive: true,
        onClick: () => {
          setBookingToCancel(booking)
          setCancelDialogOpen(true)
        },
      })
    }

    return actions
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduled Bookings"
        description="View and manage all scheduled appointments"
        primaryAction={
          <Button onClick={fetchBookings} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Status Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="rescheduled">Rescheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      {loading && bookings.length === 0 ? (
        <AdminDataTableSkeleton columns={5} rows={10} />
      ) : (
        <AdminDataTable
          data={bookings}
          columns={columns}
          keyField="id"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by email, title, or host..."
          loading={loading}
          error={error}
          onRetry={fetchBookings}
          emptyTitle="No bookings found"
          emptyDescription="There are no scheduled appointments matching your filters."
          rowActions={rowActions}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking?
              {bookingToCancel && (
                <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                  <div><strong>Title:</strong> {bookingToCancel.title || 'Untitled'}</div>
                  <div><strong>Attendee:</strong> {bookingToCancel.attendee_email}</div>
                  <div><strong>Date:</strong> {format(new Date(bookingToCancel.start_at), 'PPP p')}</div>
                </div>
              )}
              <div className="mt-2 text-destructive">
                This action cannot be undone.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
