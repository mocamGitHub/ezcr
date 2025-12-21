'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency } from '@/lib/utils'
import { ChevronUp, ChevronDown, X, Package, Truck, Calendar, CreditCard } from 'lucide-react'
import { updateOrderStatus } from '@/actions/crm'
import { toast } from 'sonner'

interface Order {
  id: string
  order_number: string
  created_at: string
  status: string
  grand_total?: number
  total_amount?: number
  tracking_number?: string
  expected_delivery_date?: string
  delivered_at?: string
  shipped_at?: string
  appointment_date?: string
  billing_address?: any
  shipping_address?: any
  order_items?: any[]
  notes?: string
  payment_status?: string
}

interface CustomerOrdersProps {
  orders: Order[]
  onOrderUpdate?: () => void
}

type SortField = 'order_number' | 'created_at' | 'status' | 'grand_total' | 'delivery'
type SortDirection = 'asc' | 'desc'

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', className: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
  { value: 'confirmed', label: 'Confirmed', className: 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  { value: 'processing', label: 'Processing', className: 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' },
  { value: 'shipped', label: 'Shipped', className: 'bg-sky-200 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300' },
  { value: 'delivered', label: 'Delivered', className: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' },
  { value: 'cancelled', label: 'Cancelled', className: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
]

export function CustomerOrders({ orders, onOrderUpdate }: CustomerOrdersProps) {
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedOrder) {
        setSelectedOrder(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedOrder])

  if (orders.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No orders found for this customer.</p>
      </div>
    )
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getDeliveryDate = (order: Order): Date | null => {
    if (order.delivered_at) return new Date(order.delivered_at)
    if (order.shipped_at) return new Date(order.shipped_at)
    if (order.expected_delivery_date) return new Date(order.expected_delivery_date)
    return null
  }

  const sortedOrders = [...orders].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'order_number':
        comparison = a.order_number.localeCompare(b.order_number)
        break
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
      case 'grand_total':
        comparison = (a.grand_total ?? a.total_amount ?? 0) - (b.grand_total ?? b.total_amount ?? 0)
        break
      case 'delivery':
        const dateA = getDeliveryDate(a)
        const dateB = getDeliveryDate(b)
        if (!dateA && !dateB) comparison = 0
        else if (!dateA) comparison = 1
        else if (!dateB) comparison = -1
        else comparison = dateA.getTime() - dateB.getTime()
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId)
      await updateOrderStatus(orderId, newStatus)
      toast.success('Order status updated')
      onOrderUpdate?.()
    } catch (err) {
      console.error('Failed to update status:', err)
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const SortableHeader = ({ field, children, className = '' }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <th
      className={`px-4 py-3 font-medium text-sm cursor-pointer hover:bg-muted/50 transition-colors select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : ''}`}>
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </th>
  )

  const formatDeliveryDate = (order: Order): string => {
    if (order.delivered_at) {
      return new Date(order.delivered_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
    if (order.shipped_at) {
      return new Date(order.shipped_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }) + ' (shipped)'
    }
    if (order.expected_delivery_date) {
      return new Date(order.expected_delivery_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }) + ' (expected)'
    }
    return '-'
  }

  return (
    <>
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <SortableHeader field="order_number">Order Number</SortableHeader>
                <SortableHeader field="created_at">Order Date</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <SortableHeader field="grand_total" className="text-right">Total</SortableHeader>
                <SortableHeader field="delivery">Delivery</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.order_number}</div>
                    {order.tracking_number && (
                      <div className="text-xs text-muted-foreground">
                        Tracking: {order.tracking_number}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updatingStatus === order.id}
                      className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-primary/20 ${
                        ORDER_STATUSES.find(s => s.value === order.status)?.className || 'bg-gray-100 text-gray-700'
                      } ${updatingStatus === order.id ? 'opacity-50' : ''}`}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(order.grand_total ?? order.total_amount ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDeliveryDate(order)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Slide-out - rendered via portal to avoid z-index issues */}
      {mounted && selectedOrder && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedOrder(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-background shadow-xl animate-in slide-in-from-right duration-300">
            <div className="h-full overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Order {selectedOrder.order_number}</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Status & Total */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      ORDER_STATUSES.find(s => s.value === selectedOrder.status)?.className || 'bg-gray-100 text-gray-700'
                    }`}>
                      {ORDER_STATUSES.find(s => s.value === selectedOrder.status)?.label || selectedOrder.status}
                    </span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatCurrency(selectedOrder.grand_total ?? selectedOrder.total_amount ?? 0)}
                  </div>
                </div>

                {/* Payment Status */}
                {selectedOrder.payment_status && (
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{selectedOrder.payment_status}</span>
                  </div>
                )}

                {/* Tracking */}
                {selectedOrder.tracking_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>Tracking: {selectedOrder.tracking_number}</span>
                  </div>
                )}

                {/* Delivery Date */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Delivery: {formatDeliveryDate(selectedOrder)}</span>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shipping_address && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2">Shipping Address</h3>
                    <div className="text-sm text-muted-foreground">
                      {selectedOrder.shipping_address.line1 && <div>{selectedOrder.shipping_address.line1}</div>}
                      {selectedOrder.shipping_address.line2 && <div>{selectedOrder.shipping_address.line2}</div>}
                      <div>
                        {[
                          selectedOrder.shipping_address.city,
                          selectedOrder.shipping_address.state,
                          selectedOrder.shipping_address.postal_code
                        ].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-3">Items</h3>
                    <div className="space-y-3">
                      {selectedOrder.order_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <div>
                            <div className="font-medium">{item.product_name || 'Item'}</div>
                            <div className="text-muted-foreground">Qty: {item.quantity}</div>
                          </div>
                          <div className="font-medium">
                            {formatCurrency(item.total_price || item.unit_price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
