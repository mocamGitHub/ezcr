'use client'

import type { CustomerProfile } from '@/types/crm'
import { formatCurrency } from '@/lib/utils'
import { HealthScoreBadge } from './HealthScoreBadge'
import { CustomerTagBadges } from './CustomerTagBadges'

interface CustomerTableProps {
  customers: CustomerProfile[]
  loading: boolean
  sortBy: 'lifetime_value' | 'last_order_date' | 'order_count'
  sortOrder: 'asc' | 'desc'
  onSortChange: (column: 'lifetime_value' | 'last_order_date' | 'order_count') => void
  onCustomerClick: (email: string) => void
}

export function CustomerTable({
  customers,
  loading,
  sortBy,
  sortOrder,
  onSortChange,
  onCustomerClick,
}: CustomerTableProps) {
  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) {
      return <span className="text-muted-foreground ml-1">↕</span>
    }
    return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  if (loading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-muted"></div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 border-t bg-card"></div>
          ))}
        </div>
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No customers found matching your filters.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-sm">Customer</th>
            <th className="text-left px-4 py-3 font-medium text-sm">Health</th>
            <th className="text-left px-4 py-3 font-medium text-sm">Tags</th>
            <th 
              className="text-right px-4 py-3 font-medium text-sm cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => onSortChange('order_count')}
            >
              Orders
              <SortIcon column="order_count" />
            </th>
            <th 
              className="text-right px-4 py-3 font-medium text-sm cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => onSortChange('lifetime_value')}
            >
              Lifetime Value
              <SortIcon column="lifetime_value" />
            </th>
            <th 
              className="text-left px-4 py-3 font-medium text-sm cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => onSortChange('last_order_date')}
            >
              Last Order
              <SortIcon column="last_order_date" />
            </th>
            <th className="text-center px-4 py-3 font-medium text-sm">Tasks</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.customer_email}
              onClick={() => onCustomerClick(customer.customer_email)}
              className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium">{customer.name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">{customer.customer_email}</div>
                  {customer.phone && (
                    <div className="text-sm text-muted-foreground">{customer.phone}</div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                {customer.health_score !== undefined && (
                  <HealthScoreBadge score={customer.health_score} />
                )}
              </td>
              <td className="px-4 py-3">
                <CustomerTagBadges tags={customer.tags || []} />
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {customer.order_count}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {formatCurrency(customer.lifetime_value)}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {customer.last_order_date
                  ? new Date(customer.last_order_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Never'}
              </td>
              <td className="px-4 py-3 text-center">
                {customer.open_task_count > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    {customer.open_task_count}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
