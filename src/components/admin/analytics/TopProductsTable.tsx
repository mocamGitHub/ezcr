'use client'

import type { TopProduct } from '@/actions/analytics'

interface TopProductsTableProps {
  products: TopProduct[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function TopProductsTable({ products }: TopProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No product data available
      </div>
    )
  }

  const maxRevenue = Math.max(...products.map(p => p.revenue))

  return (
    <div className="space-y-3">
      {products.map((product, index) => (
        <div key={product.id} className="flex items-center gap-4">
          <span className="text-lg font-bold text-muted-foreground w-6">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium truncate">{product.name}</span>
              <span className="text-sm font-medium ml-2">
                {formatCurrency(product.revenue)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(product.revenue / maxRevenue) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {product.quantity} sold
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
