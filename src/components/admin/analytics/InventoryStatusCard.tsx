'use client'

import Link from 'next/link'
import { AlertTriangle, PackageX, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface InventoryStatusCardProps {
  status: {
    total: number
    healthy: number
    lowStock: number
    outOfStock: number
    lowStockProducts: Array<{
      id: string
      name: string
      inventory_count: number
      low_stock_threshold: number | null
    }>
  }
}

export function InventoryStatusCard({ status }: InventoryStatusCardProps) {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">{status.healthy}</div>
          <div className="text-xs text-muted-foreground">Healthy</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-yellow-600">{status.lowStock}</div>
          <div className="text-xs text-muted-foreground">Low Stock</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <PackageX className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{status.outOfStock}</div>
          <div className="text-xs text-muted-foreground">Out of Stock</div>
        </div>
      </div>

      {/* Low Stock Items */}
      {status.lowStockProducts.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Items Needing Attention</h4>
          <div className="space-y-2">
            {status.lowStockProducts.slice(0, 3).map(product => (
              <div key={product.id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{product.name}</span>
                <Badge
                  variant={product.inventory_count <= 0 ? 'destructive' : 'outline'}
                  className="ml-2"
                >
                  {product.inventory_count} left
                </Badge>
              </div>
            ))}
          </div>
          {status.lowStockProducts.length > 3 && (
            <p className="text-xs text-muted-foreground mt-2">
              +{status.lowStockProducts.length - 3} more items
            </p>
          )}
        </div>
      )}

      {/* View All Link */}
      <div className="border-t pt-4">
        <Link href="/admin/inventory">
          <Button variant="outline" size="sm" className="w-full">
            View Inventory
          </Button>
        </Link>
      </div>
    </div>
  )
}
