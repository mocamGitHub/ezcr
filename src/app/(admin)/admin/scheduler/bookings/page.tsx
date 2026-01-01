'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import type { DateRange } from 'react-day-picker'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  PageHeader,
  AdminDataTable,
  AdminDataTableSkeleton,
  AdminFilterBar,
  FilterPresetDropdown,
  useFilters,
  type ColumnDef,
  type RowAction,
  type BulkAction,
  type FilterConfig,
} from '@/components/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  bulkCancelBookings,
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

  // URL-synced filters with presets
  type BookingFilters = {
    status: 'all' | 'scheduled' | 'cancelled' | 'rescheduled'
    dateRange: DateRange | undefined
    [key: string]: unknown
  }

  const {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    applyPreset,
  } = useFilters<BookingFilters>({
    initialState: {
      status: 'all',
      dateRange: undefined,
    },
    syncToUrl: true,
    urlPrefix: 'f_',
  })

  const { status: statusFilter, dateRange } = filters

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<SchedulerBooking | null>(null)
  const [cancelling, setCancelling] = useState(false)

  // Bulk selection state
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [bulkCancelDialogOpen, setBulkCancelDialogOpen] = useState(false)

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
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
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
  }, [page, pageSize, sortColumn, sortDirection, searchValue, statusFilter, dateRange])

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
    updateFilter('status', value as BookingFilters['status'])
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
      applyPreset(preset as Partial<BookingFilters>)
      setPage(1)
    }
  }

  // Build filter config for AdminFilterBar
  const filterConfig: FilterConfig[] = useMemo(() => [
    {
      type: 'select' as const,
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: handleStatusFilterChange,
      allLabel: 'All Statuses',
      options: [
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'rescheduled', label: 'Rescheduled' },
      ],
    },
    {
      type: 'daterange' as const,
      key: 'dateRange',
      label: 'Booking Date',
      value: dateRange,
      onChange: handleDateRangeChange,
      placeholder: 'Filter by date',
      presets: true,
    },
  ], [statusFilter, dateRange])

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

  const handleBulkCancel = async () => {
    if (selectedKeys.size === 0) return

    setCancelling(true)
    try {
      const result = await bulkCancelBookings(Array.from(selectedKeys))
      toast.success(`${result.cancelledCount} booking(s) cancelled successfully`)
      setBulkCancelDialogOpen(false)
      setSelectedKeys(new Set())
      fetchBookings()
    } catch (err) {
      console.error('Error bulk cancelling bookings:', err)
      toast.error('Failed to cancel bookings')
    } finally {
      setCancelling(false)
    }
  }

  // Get selected bookings that are scheduled (can be cancelled)
  const getScheduledSelectedCount = useCallback(() => {
    return bookings.filter(
      (b) => selectedKeys.has(b.id) && b.status === 'scheduled'
    ).length
  }, [bookings, selectedKeys])

  const bulkActions: BulkAction[] = [
    {
      label: 'Cancel Selected',
      icon: <XCircle className="h-4 w-4" />,
      destructive: true,
      onClick: () => setBulkCancelDialogOpen(true),
      disabled: getScheduledSelectedCount() === 0,
    },
  ]

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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <AdminFilterBar
          filters={filterConfig}
          onClearAll={handleClearFilters}
          showFilterIcon
        />
        <FilterPresetDropdown
          page="scheduler-bookings"
          currentFilters={filters}
          onApplyPreset={handleApplyPreset}
          hasActiveFilters={hasActiveFilters}
        />
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
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          bulkActions={bulkActions}
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

      {/* Bulk Cancel Confirmation Dialog */}
      <AlertDialog open={bulkCancelDialogOpen} onOpenChange={setBulkCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Multiple Bookings</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel {getScheduledSelectedCount()} scheduled booking(s)?
              {selectedKeys.size > getScheduledSelectedCount() && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Note: {selectedKeys.size - getScheduledSelectedCount()} selected booking(s) are
                  already cancelled or rescheduled and will be skipped.
                </div>
              )}
              <div className="mt-2 text-destructive">This action cannot be undone.</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Bookings</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkCancel}
              disabled={cancelling || getScheduledSelectedCount() === 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? 'Cancelling...' : `Cancel ${getScheduledSelectedCount()} Booking(s)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
