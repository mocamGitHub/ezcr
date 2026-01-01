'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  SortableTableHead,
  type SortDirection,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RefreshCw, Search, Eye, Package, DollarSign, Clock, CheckSquare, Truck, XCircle, Download, ShoppingCart } from 'lucide-react'
import { EmptyStateInline } from '@/components/ui/empty-state'
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
import { PageHeader } from '@/components/admin'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { exportToCSV, orderColumns, getExportFilename } from '@/lib/utils/export'
import { OrderDetailSlideOut, type Order, type OrderItem } from '@/components/orders'

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
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)
    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error

      // Update local state without refetching
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ))

      // Update selected order if it's the one being updated
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
      }

      toast.success(`Order status updated to ${newStatus}`)
    } catch (err) {
      console.error('Error updating order:', err)
      toast.error('Failed to update order status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      order.order_number?.toLowerCase().includes(query) ||
      order.customer_name?.toLowerCase().includes(query) ||
      order.customer_email?.toLowerCase().includes(query)
    )
  })

  // Sorted orders
  const sortedOrders = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredOrders

    return [...filteredOrders].sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      switch (sortColumn) {
        case 'order_number':
          aVal = a.order_number
          bVal = b.order_number
          break
        case 'customer':
          aVal = a.customer_name
          bVal = b.customer_name
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        case 'payment':
          aVal = a.payment_status
          bVal = b.payment_status
          break
        case 'total':
          aVal = a.grand_total ?? a.total_amount ?? 0
          bVal = b.grand_total ?? b.total_amount ?? 0
          break
        case 'date':
          aVal = a.created_at
          bVal = b.created_at
          break
        default:
          return 0
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      const comparison = String(aVal || '').localeCompare(String(bVal || ''))
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredOrders, sortColumn, sortDirection])

  // Stats
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid' || o.payment_status === 'succeeded')
    .reduce((sum, o) => sum + (o.grand_total ?? o.total_amount ?? 0), 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const processingOrders = orders.filter((o) => o.status === 'processing').length

  const viewOrderDetails = async (order: Order) => {
    setSelectedOrder(order)
    setDetailsOpen(true)

    const supabase = createClient()
    let updatedOrder = { ...order }
    let needsUpdate = false

    // Fetch order_items if not already loaded
    if (!order.order_items || order.order_items.length === 0) {
      try {
        const { data: items, error } = await supabase
          .from('order_items')
          .select('id, product_name, product_sku, quantity, unit_price, total_price')
          .eq('order_id', order.id)

        if (!error && items && items.length > 0) {
          updatedOrder = { ...updatedOrder, order_items: items }
          needsUpdate = true
        }
      } catch (err) {
        console.error('Error fetching order items:', err)
      }
    }

    // Fetch phone from contacts if missing on order
    if (!order.customer_phone && order.customer_email) {
      try {
        const { data: contacts, error } = await supabase
          .from('contacts')
          .select('phone')
          .ilike('email', order.customer_email)
          .limit(1)

        if (!error && contacts && contacts.length > 0 && contacts[0].phone) {
          updatedOrder = { ...updatedOrder, customer_phone: contacts[0].phone }
          needsUpdate = true
        }
      } catch (err) {
        console.error('Error fetching contact phone:', err)
      }
    }

    // Fetch configuration - first try by configuration_id FK, then by email match
    if (!order.configuration && order.customer_email) {
      try {
        // If order has configuration_id, use it directly
        if (order.configuration_id) {
          const { data: config, error } = await supabase
            .from('product_configurations')
            .select('configuration')
            .eq('id', order.configuration_id)
            .single()

          if (!error && config?.configuration) {
            updatedOrder = { ...updatedOrder, configuration: config.configuration }
            needsUpdate = true
          }
        } else {
          // Fall back to email matching for legacy orders
          const { data: configs, error } = await supabase
            .from('product_configurations')
            .select('configuration')
            .limit(100)

          if (!error && configs) {
            // Find matching configuration by email
            const matchingConfig = configs.find((c: any) =>
              c.configuration?.contact?.email?.toLowerCase() === order.customer_email?.toLowerCase()
            )
            if (matchingConfig) {
              updatedOrder = { ...updatedOrder, configuration: matchingConfig.configuration }
              needsUpdate = true
            }
          }
        }
      } catch (err) {
        console.error('Error fetching configuration:', err)
      }
    }

    if (needsUpdate) {
      setSelectedOrder(updatedOrder)
      setOrders(prev => prev.map(o =>
        o.id === order.id ? updatedOrder : o
      ))
    }
  }

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders)
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId)
    } else {
      newSelection.add(orderId)
    }
    setSelectedOrders(newSelection)
  }

  const toggleAllOrders = () => {
    if (selectedOrders.size === sortedOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(sortedOrders.map(o => o.id)))
    }
  }

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedOrders.size === 0) return

    setBulkUpdating(true)
    try {
      const supabase = createClient()
      const orderIds = Array.from(selectedOrders)

      const { error } = await (supabase as any)
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .in('id', orderIds)

      if (error) throw error

      // Update local state
      setOrders(prev => prev.map(o =>
        orderIds.includes(o.id) ? { ...o, status: newStatus } : o
      ))

      toast.success(`Updated ${orderIds.length} orders to ${newStatus}`)
      setSelectedOrders(new Set())
    } catch (err) {
      console.error('Error bulk updating orders:', err)
      toast.error('Failed to update orders')
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleExportOrders = () => {
    const dataToExport = selectedOrders.size > 0
      ? sortedOrders.filter(o => selectedOrders.has(o.id))
      : sortedOrders
    exportToCSV(dataToExport, orderColumns, getExportFilename('orders'))
    toast.success(`Exported ${dataToExport.length} orders to CSV`)
  }

  // Save PRO number to database
  const saveProNumber = async (orderId: string, proNumber: string): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({
          pro_number: proNumber,
          carrier: 'tforce',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // Update local state
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, pro_number: proNumber, carrier: 'tforce' } : o
      ))

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, pro_number: proNumber, carrier: 'tforce' } : null)
      }

      toast.success('PRO number saved')
      return true
    } catch (err) {
      console.error('Error saving PRO number:', err)
      toast.error('Failed to save PRO number')
      return false
    }
  }

  // Save BOL number to database
  const saveBolNumber = async (orderId: string, bolNumber: string): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({
          bol_number: bolNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // Update local state
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, bol_number: bolNumber } : o
      ))

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, bol_number: bolNumber } : null)
      }

      toast.success('BOL number saved')
      return true
    } catch (err) {
      console.error('Error saving BOL number:', err)
      toast.error('Failed to save BOL number')
      return false
    }
  }

  // Sync tracking from TForce API
  const syncTracking = async (orderId: string): Promise<Order | null> => {
    try {
      const response = await fetch(`/api/tforce-tracking?orderId=${orderId}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to sync tracking')
      }

      // Fetch updated order from database
      const supabase = createClient()
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) throw error

      // Map TForce tracking data to our order format
      const trackingDetail = data.tracking
      const enhancedOrder: Order = {
        ...updatedOrder,
        tracking_events: trackingDetail.events || [],
        tracking_synced_at: new Date().toISOString(),
        delivery_signature: trackingDetail.delivery?.signedBy || updatedOrder.delivery_signature,
      }

      // Update the tracking_synced_at in database
      await supabase
        .from('orders')
        .update({
          tracking_events: trackingDetail.events || [],
          tracking_synced_at: new Date().toISOString(),
          delivery_signature: trackingDetail.delivery?.signedBy || null,
        })
        .eq('id', orderId)

      // Update local state
      setOrders(prev => prev.map(o =>
        o.id === orderId ? enhancedOrder : o
      ))

      toast.success('Tracking synced successfully')
      return enhancedOrder
    } catch (err: any) {
      console.error('Error syncing tracking:', err)
      toast.error(err.message || 'Failed to sync tracking')
      throw err
    }
  }

  // Search for PRO number by BOL number
  const searchByBol = async (orderId: string, bolNumber: string): Promise<Order | null> => {
    try {
      // Get the order's creation date to set the date range
      const order = orders.find(o => o.id === orderId)
      if (!order) throw new Error('Order not found')

      // Calculate date range: from order creation to now
      const orderDate = new Date(order.created_at)
      const now = new Date()
      const pickupStartDate = orderDate.toISOString().split('T')[0]
      const pickupEndDate = now.toISOString().split('T')[0]

      const response = await fetch('/api/tforce-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: bolNumber,
          code: 'BL', // Bill of Lading
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

      // Get the first result's PRO number
      const proNumber = data.results[0].pro
      if (!proNumber) {
        throw new Error('PRO number not found in response')
      }

      // Save the BOL number, PRO number, and carrier to the order
      const supabase = createClient()
      await supabase
        .from('orders')
        .update({
          bol_number: bolNumber, // Save the BOL number too
          pro_number: proNumber,
          carrier: 'tforce',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      // Now sync the full tracking data
      const trackingResponse = await fetch(`/api/tforce-tracking?orderId=${orderId}`)
      const trackingData = await trackingResponse.json()

      // Fetch the updated order
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) throw error

      // Enhance with tracking events if available
      const enhancedOrder: Order = {
        ...updatedOrder,
        bol_number: bolNumber,
        pro_number: proNumber,
        carrier: 'tforce',
        tracking_events: trackingData.tracking?.events || [],
        tracking_synced_at: new Date().toISOString(),
        delivery_signature: trackingData.tracking?.delivery?.signedBy || null,
      }

      // Save tracking events to database
      await supabase
        .from('orders')
        .update({
          tracking_events: trackingData.tracking?.events || [],
          tracking_synced_at: new Date().toISOString(),
          delivery_signature: trackingData.tracking?.delivery?.signedBy || null,
        })
        .eq('id', orderId)

      // Update local state
      setOrders(prev => prev.map(o =>
        o.id === orderId ? enhancedOrder : o
      ))

      toast.success(`Found PRO #${proNumber} and synced tracking`)
      return enhancedOrder
    } catch (err: any) {
      console.error('Error searching by BOL:', err)
      toast.error(err.message || 'Failed to find shipment by BOL')
      throw err
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Management"
        description="View and manage customer orders"
        primaryAction={
          <Button onClick={fetchOrders} disabled={loading}>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            Total Orders
          </div>
          <div className="text-2xl font-bold mt-1">{orders.length}</div>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Total Revenue
          </div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {formatPrice(totalRevenue)}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Pending
          </div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">
            {pendingOrders}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            Processing
          </div>
          <div className="text-2xl font-bold mt-1 text-blue-600">
            {processingOrders}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by order number, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkUpdateStatus('processing')}
              disabled={bulkUpdating}
            >
              <Package className="h-4 w-4 mr-1" />
              Mark Processing
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkUpdateStatus('shipped')}
              disabled={bulkUpdating}
            >
              <Truck className="h-4 w-4 mr-1" />
              Mark Shipped
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkUpdateStatus('delivered')}
              disabled={bulkUpdating}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              Mark Delivered
            </Button>
            <AlertDialog>
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
                    Are you sure you want to cancel {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''}?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Orders</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => bulkUpdateStatus('canceled')}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Cancel Orders
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrders(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedOrders.size === sortedOrders.length && sortedOrders.length > 0}
                  onCheckedChange={toggleAllOrders}
                  aria-label="Select all"
                />
              </TableHead>
              <SortableTableHead
                sortKey="order_number"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Order #
              </SortableTableHead>
              <SortableTableHead
                sortKey="customer"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Customer
              </SortableTableHead>
              <SortableTableHead
                sortKey="status"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Status
              </SortableTableHead>
              <SortableTableHead
                sortKey="payment"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Payment
              </SortableTableHead>
              <SortableTableHead
                sortKey="total"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                className="text-right"
              >
                Total
              </SortableTableHead>
              <SortableTableHead
                sortKey="date"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Date
              </SortableTableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : sortedOrders.length === 0 ? (
              <EmptyStateInline
                colSpan={8}
                icon={ShoppingCart}
                message="No orders found matching your filters"
              />
            ) : (
              sortedOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className={`cursor-pointer hover:bg-muted/50 ${selectedOrders.has(order.id) ? 'bg-primary/5' : ''}`}
                  onClick={() => viewOrderDetails(order)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={() => toggleOrderSelection(order.id)}
                      aria-label={`Select order ${order.order_number}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    <div className="flex items-center gap-2">
                      {order.order_number}
                      {order.qbo_sync_status === 'imported' && (
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                          QBO
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{order.customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.customer_email}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
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
                            <Badge className={getStatusColor(status.value)}>
                              {status.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColor(order.payment_status)}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(order.grand_total ?? order.total_amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(order.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        viewOrderDetails(order)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Slide-out */}
      <OrderDetailSlideOut
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        order={selectedOrder}
        onStatusChange={updateOrderStatus}
        onProNumberSave={saveProNumber}
        onBolNumberSave={saveBolNumber}
        onTrackingSync={syncTracking}
        onSearchByBol={searchByBol}
        isUpdating={updatingOrderId === selectedOrder?.id}
        orderStatuses={ORDER_STATUSES}
      />
    </div>
  )
}
