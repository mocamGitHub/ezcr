'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { RefreshCw, Search, Eye, Package, DollarSign, Clock, CheckSquare, Truck, XCircle, Download, Phone, Mail, MapPin, Calendar } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'
import { exportToCSV, orderColumns, getExportFilename } from '@/lib/utils/export'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string | null
  status: string
  payment_status: string
  total_amount: number
  created_at: string
  updated_at?: string
  shipping_address: any
  billing_address?: any
  order_items?: OrderItem[]
  // QBO link fields
  qbo_invoice_id?: string | null
  qbo_sync_status?: string | null
  qbo_synced_at?: string | null
  // Product info (for QBO imports without order_items)
  product_name?: string | null
  product_sku?: string | null
  product_price?: number | null
  quantity?: number | null
  grand_total?: number | null
  subtotal?: number | null
  shipping_total?: number | null
  tax_total?: number | null
  discount_total?: number | null
  delivery_method?: string | null
}

interface OrderItem {
  id: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
}

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

    // Fetch order_items if not already loaded
    if (!order.order_items || order.order_items.length === 0) {
      try {
        const supabase = createClient()
        const { data: items, error } = await supabase
          .from('order_items')
          .select('id, product_name, product_sku, quantity, unit_price, total_price')
          .eq('order_id', order.id)

        if (!error && items && items.length > 0) {
          const updatedOrder = { ...order, order_items: items }
          setSelectedOrder(updatedOrder)
          // Also update the order in the list
          setOrders(prev => prev.map(o =>
            o.id === order.id ? updatedOrder : o
          ))
        }
      } catch (err) {
        console.error('Error fetching order items:', err)
      }
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

  const formatAddress = (address: any) => {
    if (!address) return null
    const parts = [
      address.line1,
      address.line2,
      [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
      address.country !== 'US' ? address.country : null
    ].filter(Boolean)
    return parts.length > 0 ? parts : null
  }

  return (
    <div className="py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground mt-1">
            View and manage customer orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportOrders}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkUpdateStatus('canceled')}
              disabled={bulkUpdating}
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
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
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
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

      {/* Order Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Order {selectedOrder?.order_number}
              {selectedOrder?.qbo_sync_status === 'imported' && (
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                  QBO Import
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          {selectedOrder && (
            <div className="space-y-6 mt-6">
              {/* QBO Import Info */}
              {selectedOrder.qbo_sync_status === 'imported' && selectedOrder.qbo_invoice_id && (
                <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                  <div className="text-sm text-emerald-700 dark:text-emerald-400">
                    Imported from QuickBooks Invoice #{selectedOrder.qbo_invoice_id}
                    {selectedOrder.qbo_synced_at && (
                      <span className="ml-2 text-emerald-600 dark:text-emerald-500">
                        on {format(new Date(selectedOrder.qbo_synced_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Status Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Order Status</div>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                    disabled={updatingOrderId === selectedOrder.id}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Payment Status</div>
                  <Badge className={`${getPaymentStatusColor(selectedOrder.payment_status)} text-sm`}>
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {format(new Date(selectedOrder.created_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
                {selectedOrder.updated_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Updated: {format(new Date(selectedOrder.updated_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Customer Information</h3>
                <div className="space-y-2">
                  <p className="font-medium text-lg">{selectedOrder.customer_name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${selectedOrder.customer_email}`} className="hover:underline">
                      {selectedOrder.customer_email}
                    </a>
                  </div>
                  {selectedOrder.customer_phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${selectedOrder.customer_phone}`} className="hover:underline">
                        {selectedOrder.customer_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Shipping Address */}
                {selectedOrder.shipping_address && formatAddress(selectedOrder.shipping_address) && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Shipping Address</h3>
                    </div>
                    <div className="text-sm space-y-1">
                      {formatAddress(selectedOrder.shipping_address)?.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                    {selectedOrder.delivery_method && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Method: {selectedOrder.delivery_method}
                      </p>
                    )}
                  </div>
                )}

                {/* Billing Address */}
                {selectedOrder.billing_address && formatAddress(selectedOrder.billing_address) && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Billing Address</h3>
                    </div>
                    <div className="text-sm space-y-1">
                      {formatAddress(selectedOrder.billing_address)?.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="divide-y">
                  {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                    selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <p className="font-medium">{item.product_name}</p>
                            {item.product_sku && (
                              <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} x {formatPrice(item.unit_price)}
                            </p>
                          </div>
                          <p className="font-medium">{formatPrice(item.total_price)}</p>
                        </div>
                      </div>
                    ))
                  ) : selectedOrder.product_name ? (
                    <div className="py-3 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
                          <p className="font-medium">{selectedOrder.product_name}</p>
                          {selectedOrder.product_sku && (
                            <p className="text-xs text-muted-foreground">SKU: {selectedOrder.product_sku}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {selectedOrder.quantity || 1} x {formatPrice(selectedOrder.product_price)}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatPrice((selectedOrder.quantity || 1) * (selectedOrder.product_price || 0))}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-3">No items found</p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                {selectedOrder.subtotal !== undefined && selectedOrder.subtotal !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                )}
                {selectedOrder.shipping_total !== undefined && selectedOrder.shipping_total !== null && selectedOrder.shipping_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatPrice(selectedOrder.shipping_total)}</span>
                  </div>
                )}
                {selectedOrder.tax_total !== undefined && selectedOrder.tax_total !== null && selectedOrder.tax_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatPrice(selectedOrder.tax_total)}</span>
                  </div>
                )}
                {selectedOrder.discount_total !== undefined && selectedOrder.discount_total !== null && selectedOrder.discount_total > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(selectedOrder.discount_total)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.grand_total ?? selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
