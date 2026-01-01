'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import type { DateRange } from 'react-day-picker'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  Eye,
  Package,
  DollarSign,
  Clock,
  CheckSquare,
  Truck,
  XCircle,
  Download,
  ShoppingCart,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  AdminDataTable,
  AdminFilterBar,
  PageHeader,
  FilterPresetDropdown,
  useFilters,
  type ColumnDef,
  type RowAction,
  type BulkAction,
  type FilterConfig,
} from '@/components/admin'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { exportToCSV, orderColumns, getExportFilename } from '@/lib/utils/export'
import { OrderDetailSlideOut, type Order } from '@/components/orders'
import {
  getOrdersPaginated,
  getOrderStats,
  getOrderDetails,
  getOrdersForExport,
  updateOrderStatus,
  bulkUpdateOrderStatus,
  saveProNumber as saveProNumberAction,
  saveBolNumber as saveBolNumberAction,
  saveTrackingData,
  type OrderStats,
} from './actions'

function formatPrice(amount: number | null | undefined): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0)
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'processing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'shipped':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'delivered':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'canceled':
    case 'refunded':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'paid':
    case 'succeeded':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'failed':
    case 'refunded':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'canceled', label: 'Canceled' },
]

export default function AdminOrdersPage() {
  usePageTitle('Orders')

  // Table state
  const [orders, setOrders] = useState<Order[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [sortColumn, setSortColumn] = useState('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters with URL sync
  interface OrderFilters {
    status: string
    payment: string
    dateRange: DateRange | undefined
  }

  const {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    applyPreset,
  } = useFilters<OrderFilters>({
    initialState: {
      status: 'all',
      payment: 'all',
      dateRange: undefined,
    },
    syncToUrl: true,
    urlPrefix: 'f_',
  })

  // Destructure for easier access
  const { status: statusFilter, payment: paymentFilter, dateRange } = filters

  // Stats
  const [stats, setStats] = useState<OrderStats | null>(null)

  // Order details slide-out
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  // Selection state
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [ordersResult, statsResult] = await Promise.all([
        getOrdersPaginated({
          page,
          pageSize,
          sortColumn,
          sortDirection,
          search,
          statusFilter,
          paymentFilter,
          startDate: dateRange?.from?.toISOString(),
          endDate: dateRange?.to?.toISOString(),
        }),
        getOrderStats(),
      ])

      setOrders(ordersResult.data)
      setTotalCount(ordersResult.totalCount)
      setStats(statsResult)
    } catch (err: unknown) {
      console.error('Error loading orders:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load orders'
      setError(errorMessage)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortColumn, sortDirection, search, statusFilter, paymentFilter, dateRange])

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

  const handleStatusFilterChange = (value: string) => {
    updateFilter('status', value)
    setPage(1)
  }

  const handlePaymentFilterChange = (value: string) => {
    updateFilter('payment', value)
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
      applyPreset(preset as Partial<OrderFilters>)
      setPage(1)
    }
  }

  // Build filter config for AdminFilterBar
  const filterConfig: FilterConfig[] = useMemo(() => [
    {
      type: 'select' as const,
      key: 'status',
      label: 'Order Status',
      value: statusFilter,
      onChange: handleStatusFilterChange,
      allLabel: 'All Statuses',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'canceled', label: 'Canceled' },
        { value: 'refunded', label: 'Refunded' },
      ],
    },
    {
      type: 'select' as const,
      key: 'payment',
      label: 'Payment Status',
      value: paymentFilter,
      onChange: handlePaymentFilterChange,
      allLabel: 'All Payments',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' },
        { value: 'succeeded', label: 'Succeeded' },
        { value: 'failed', label: 'Failed' },
        { value: 'refunded', label: 'Refunded' },
      ],
    },
    {
      type: 'daterange' as const,
      key: 'dateRange',
      label: 'Order Date',
      value: dateRange,
      onChange: handleDateRangeChange,
      placeholder: 'Filter by date',
      presets: true,
    },
  ], [statusFilter, paymentFilter, dateRange])

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )

      // Update selected order if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      }

      toast.success(`Order status updated to ${newStatus}`)
    } catch (err) {
      console.error('Error updating order:', err)
      toast.error('Failed to update order status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleBulkUpdateStatus = async (newStatus: string) => {
    if (selectedKeys.size === 0) return

    setBulkUpdating(true)
    try {
      const orderIds = Array.from(selectedKeys)
      await bulkUpdateOrderStatus(orderIds, newStatus)

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (orderIds.includes(o.id) ? { ...o, status: newStatus } : o))
      )

      toast.success(`Updated ${orderIds.length} orders to ${newStatus}`)
      setSelectedKeys(new Set())
    } catch (err) {
      console.error('Error bulk updating orders:', err)
      toast.error('Failed to update orders')
    } finally {
      setBulkUpdating(false)
    }
  }

  const viewOrderDetails = async (order: Order) => {
    setSelectedOrder(order)
    setDetailsOpen(true)

    try {
      const enhancedOrder = await getOrderDetails(order.id)
      setSelectedOrder(enhancedOrder)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? enhancedOrder : o)))
    } catch (err) {
      console.error('Error fetching order details:', err)
    }
  }

  const handleSaveProNumber = async (orderId: string, proNumber: string): Promise<boolean> => {
    try {
      await saveProNumberAction(orderId, proNumber)

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, pro_number: proNumber, carrier: 'tforce' } : o
        )
      )

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, pro_number: proNumber, carrier: 'tforce' } : null
        )
      }

      toast.success('PRO number saved')
      return true
    } catch (err) {
      console.error('Error saving PRO number:', err)
      toast.error('Failed to save PRO number')
      return false
    }
  }

  const handleSaveBolNumber = async (orderId: string, bolNumber: string): Promise<boolean> => {
    try {
      await saveBolNumberAction(orderId, bolNumber)

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, bol_number: bolNumber } : o))
      )

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, bol_number: bolNumber } : null))
      }

      toast.success('BOL number saved')
      return true
    } catch (err) {
      console.error('Error saving BOL number:', err)
      toast.error('Failed to save BOL number')
      return false
    }
  }

  const handleSyncTracking = async (orderId: string): Promise<Order | null> => {
    try {
      const response = await fetch(`/api/tforce-tracking?orderId=${orderId}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to sync tracking')
      }

      const trackingDetail = data.tracking
      const trackingData = {
        tracking_events: trackingDetail.events || [],
        tracking_synced_at: new Date().toISOString(),
        delivery_signature: trackingDetail.delivery?.signedBy || null,
      }

      await saveTrackingData(orderId, trackingData)

      // Refetch order details
      const updatedOrder = await getOrderDetails(orderId)
      const enhancedOrder: Order = {
        ...updatedOrder,
        ...trackingData,
      }

      // Update local state
      setOrders((prev) => prev.map((o) => (o.id === orderId ? enhancedOrder : o)))

      toast.success('Tracking synced successfully')
      return enhancedOrder
    } catch (err: unknown) {
      console.error('Error syncing tracking:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync tracking'
      toast.error(errorMessage)
      throw err
    }
  }

  const handleSearchByBol = async (orderId: string, bolNumber: string): Promise<Order | null> => {
    try {
      const order = orders.find((o) => o.id === orderId)
      if (!order) throw new Error('Order not found')

      const orderDate = new Date(order.created_at)
      const now = new Date()
      const pickupStartDate = orderDate.toISOString().split('T')[0]
      const pickupEndDate = now.toISOString().split('T')[0]

      const response = await fetch('/api/tforce-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: bolNumber,
          code: 'BL',
          pickupStartDate,
          pickupEndDate,
          orderId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'No shipment found for this BOL')
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('No shipment found for this BOL number')
      }

      const proNumber = data.results[0].pro
      if (!proNumber) {
        throw new Error('PRO number not found in response')
      }

      // Save tracking data
      await saveTrackingData(orderId, {
        bol_number: bolNumber,
        pro_number: proNumber,
        carrier: 'tforce',
      })

      // Sync full tracking data
      const trackingResponse = await fetch(`/api/tforce-tracking?orderId=${orderId}`)
      const trackingData = await trackingResponse.json()

      // Refetch order details
      const updatedOrder = await getOrderDetails(orderId)
      const enhancedOrder: Order = {
        ...updatedOrder,
        bol_number: bolNumber,
        pro_number: proNumber,
        carrier: 'tforce',
        tracking_events: trackingData.tracking?.events || [],
        tracking_synced_at: new Date().toISOString(),
        delivery_signature: trackingData.tracking?.delivery?.signedBy || null,
      }

      // Save tracking events
      await saveTrackingData(orderId, {
        tracking_events: trackingData.tracking?.events || [],
        tracking_synced_at: new Date().toISOString(),
        delivery_signature: trackingData.tracking?.delivery?.signedBy || null,
      })

      // Update local state
      setOrders((prev) => prev.map((o) => (o.id === orderId ? enhancedOrder : o)))

      toast.success(`Found PRO #${proNumber} and synced tracking`)
      return enhancedOrder
    } catch (err: unknown) {
      console.error('Error searching by BOL:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to find shipment by BOL'
      toast.error(errorMessage)
      throw err
    }
  }

  const handleExportOrders = async () => {
    try {
      let dataToExport: Order[]

      if (selectedKeys.size > 0) {
        dataToExport = orders.filter((o) => selectedKeys.has(o.id))
      } else {
        dataToExport = await getOrdersForExport(statusFilter)
      }

      exportToCSV(dataToExport, orderColumns, getExportFilename('orders'))
      toast.success(`Exported ${dataToExport.length} orders to CSV`)
    } catch (err) {
      console.error('Error exporting orders:', err)
      toast.error('Failed to export orders')
    }
  }

  // Column definitions
  const columns: ColumnDef<Order>[] = [
    {
      key: 'order_number',
      header: 'Order #',
      sortable: true,
      cell: (order) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium">{order.order_number}</span>
          {order.qbo_sync_status === 'imported' && (
            <Badge
              variant="outline"
              className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
            >
              QBO
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      cell: (order) => (
        <div>
          <div>{order.customer_name}</div>
          <div className="text-sm text-muted-foreground">{order.customer_email}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (order) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={order.status}
            onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
            disabled={updatingOrderId === order.id}
          >
            <SelectTrigger className="w-[130px] h-8">
              <Badge className={`${getStatusColor(order.status)} pointer-events-none`}>
                {order.status}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <Badge className={getStatusColor(status.value)}>{status.label}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      sortable: true,
      cell: (order) => (
        <Badge className={getPaymentStatusColor(order.payment_status)}>
          {order.payment_status}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      cell: (order) => (
        <span className="font-medium">{formatPrice(order.grand_total ?? order.total_amount)}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      cell: (order) => (
        <span className="text-muted-foreground">
          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
        </span>
      ),
    },
  ]

  // Row actions
  const getRowActions = (order: Order): RowAction<Order>[] => [
    {
      label: 'View Details',
      onClick: () => viewOrderDetails(order),
      icon: <Eye className="h-4 w-4" />,
    },
  ]

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      label: 'Mark Processing',
      onClick: () => handleBulkUpdateStatus('processing'),
      icon: <Package className="h-4 w-4" />,
      disabled: bulkUpdating,
    },
    {
      label: 'Mark Shipped',
      onClick: () => handleBulkUpdateStatus('shipped'),
      icon: <Truck className="h-4 w-4" />,
      disabled: bulkUpdating,
    },
    {
      label: 'Mark Delivered',
      onClick: () => handleBulkUpdateStatus('delivered'),
      icon: <CheckSquare className="h-4 w-4" />,
      disabled: bulkUpdating,
    },
    {
      label: 'Cancel',
      onClick: undefined, // Will be handled by the AlertDialog
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive',
      disabled: bulkUpdating,
      customRender: (
        <AlertDialog key="cancel-dialog">
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkUpdating}
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Orders</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel {selectedKeys.size} order
                {selectedKeys.size !== 1 ? 's' : ''}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Orders</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleBulkUpdateStatus('canceled')}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Cancel Orders
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ]

  // Toolbar with AdminFilterBar and Presets
  const toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      <AdminFilterBar
        filters={filterConfig}
        onClearAll={handleClearFilters}
        showFilterIcon
      />
      <FilterPresetDropdown
        page="orders"
        currentFilters={filters}
        onApplyPreset={handleApplyPreset}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Management"
        description="View and manage customer orders"
        primaryAction={
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
        secondaryActions={
          <Button variant="outline" onClick={handleExportOrders}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              Total Orders
            </div>
            <div className="text-2xl font-bold mt-1">{stats.totalOrders}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {formatPrice(stats.totalRevenue)}
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Pending
            </div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.pendingCount}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              Processing
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-600">{stats.processingCount}</div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <AdminDataTable
        data={orders}
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
        searchPlaceholder="Search by order number, name, or email..."
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyIcon={ShoppingCart}
        emptyTitle="No orders found"
        emptyDescription={
          search || statusFilter !== 'all' || paymentFilter !== 'all' || dateRange?.from
            ? 'No orders match your current filters.'
            : 'No orders found.'
        }
        rowActions={getRowActions}
        onRowClick={viewOrderDetails}
        toolbar={toolbar}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        bulkActions={bulkActions}
      />

      {/* Order Details Slide-out */}
      <OrderDetailSlideOut
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        order={selectedOrder}
        onStatusChange={handleUpdateOrderStatus}
        onProNumberSave={handleSaveProNumber}
        onBolNumberSave={handleSaveBolNumber}
        onTrackingSync={handleSyncTracking}
        onSearchByBol={handleSearchByBol}
        isUpdating={updatingOrderId === selectedOrder?.id}
        orderStatuses={ORDER_STATUSES}
      />
    </div>
  )
}
