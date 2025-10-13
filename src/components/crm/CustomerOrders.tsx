import { formatCurrency } from '@/lib/utils'

interface CustomerOrdersProps {
  orders: any[]
}

export function CustomerOrders({ orders }: CustomerOrdersProps) {
  if (orders.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No orders found for this customer.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Orders ({orders.length})</h3>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-sm">Order Number</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Date</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Status</th>
              <th className="text-right px-4 py-3 font-medium text-sm">Total</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Delivery</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t hover:bg-muted/30 transition-colors">
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
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(order.total_amount)}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {order.expected_delivery_date
                    ? new Date(order.expected_delivery_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : order.appointment_date
                    ? `Appointment: ${new Date(order.appointment_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}`
                    : 'TBD'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
    processing: { label: 'Processing', className: 'bg-purple-100 text-purple-700' },
    shipped: { label: 'Shipped', className: 'bg-green-100 text-green-700' },
    delivered: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  }

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  )
}
