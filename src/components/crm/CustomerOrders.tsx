'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { updateOrderStatus } from '@/actions/crm'
import { toast } from 'sonner'
import { OrderDetailSlideOut, type Order } from '@/components/orders'

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
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

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

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setDetailsOpen(true)
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
                  onClick={() => handleViewOrder(order)}
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

      {/* Order Details Slide-out */}
      <OrderDetailSlideOut
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        order={selectedOrder}
        onStatusChange={handleStatusChange}
        isUpdating={updatingStatus === selectedOrder?.id}
        orderStatuses={ORDER_STATUSES}
      />
    </>
  )
}
