'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, PackageX, Bell, BellOff, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  sku: string
  inventory_count: number
  low_stock_threshold: number
}

interface InventoryAlertsProps {
  products: Product[]
  onFilterLowStock: () => void
  showingLowStock: boolean
}

export function InventoryAlerts({ products, onFilterLowStock, showingLowStock }: InventoryAlertsProps) {
  const [expanded, setExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  const outOfStock = products.filter(p => p.inventory_count <= 0)
  const critical = products.filter(p =>
    p.inventory_count > 0 &&
    p.inventory_count <= Math.floor(p.low_stock_threshold * 0.5)
  )
  const lowStock = products.filter(p =>
    p.inventory_count > Math.floor(p.low_stock_threshold * 0.5) &&
    p.inventory_count <= p.low_stock_threshold
  )

  const totalAlerts = outOfStock.length + critical.length + lowStock.length

  if (totalAlerts === 0 || dismissed) {
    return null
  }

  const getAlertSeverity = () => {
    if (outOfStock.length > 0) return 'destructive'
    if (critical.length > 0) return 'warning'
    return 'default'
  }

  const severity = getAlertSeverity()

  return (
    <div className={cn(
      'border rounded-lg mb-6 overflow-hidden',
      severity === 'destructive' && 'border-red-500 bg-red-50 dark:bg-red-950/20',
      severity === 'warning' && 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
      severity === 'default' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
    )}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {outOfStock.length > 0 ? (
            <PackageX className="h-5 w-5 text-red-600" />
          ) : (
            <AlertTriangle className={cn(
              'h-5 w-5',
              severity === 'warning' ? 'text-orange-600' : 'text-yellow-600'
            )} />
          )}
          <div>
            <h3 className={cn(
              'font-semibold',
              severity === 'destructive' && 'text-red-800 dark:text-red-400',
              severity === 'warning' && 'text-orange-800 dark:text-orange-400',
              severity === 'default' && 'text-yellow-800 dark:text-yellow-400'
            )}>
              Inventory Alerts
            </h3>
            <p className="text-sm text-muted-foreground">
              {totalAlerts} item{totalAlerts !== 1 ? 's' : ''} need attention
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setDismissed(true)
            }}
          >
            <BellOff className="h-4 w-4" />
          </Button>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Out of Stock Section */}
          {outOfStock.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  OUT OF STOCK
                </Badge>
                <span className="text-sm font-medium">{outOfStock.length} products</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {outOfStock.slice(0, 6).map(product => (
                  <Link
                    key={product.id}
                    href={`/admin/inventory/${product.id}`}
                    className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="truncate font-medium">{product.name}</span>
                    <Badge variant="destructive" className="ml-2 text-xs">0</Badge>
                  </Link>
                ))}
              </div>
              {outOfStock.length > 6 && (
                <p className="text-xs text-muted-foreground">
                  +{outOfStock.length - 6} more items
                </p>
              )}
            </div>
          )}

          {/* Critical Stock Section */}
          {critical.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500 text-white text-xs">CRITICAL</Badge>
                <span className="text-sm font-medium">{critical.length} products</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {critical.slice(0, 6).map(product => (
                  <Link
                    key={product.id}
                    href={`/admin/inventory/${product.id}`}
                    className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="truncate font-medium">{product.name}</span>
                    <Badge className="ml-2 bg-orange-500 text-white text-xs">
                      {product.inventory_count}
                    </Badge>
                  </Link>
                ))}
              </div>
              {critical.length > 6 && (
                <p className="text-xs text-muted-foreground">
                  +{critical.length - 6} more items
                </p>
              )}
            </div>
          )}

          {/* Low Stock Section */}
          {lowStock.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400 text-xs">
                  LOW STOCK
                </Badge>
                <span className="text-sm font-medium">{lowStock.length} products</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {lowStock.slice(0, 6).map(product => (
                  <Link
                    key={product.id}
                    href={`/admin/inventory/${product.id}`}
                    className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="truncate font-medium">{product.name}</span>
                    <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-700 text-xs">
                      {product.inventory_count}
                    </Badge>
                  </Link>
                ))}
              </div>
              {lowStock.length > 6 && (
                <p className="text-xs text-muted-foreground">
                  +{lowStock.length - 6} more items
                </p>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 border-t">
            <Button
              variant={showingLowStock ? 'secondary' : 'default'}
              size="sm"
              onClick={onFilterLowStock}
            >
              {showingLowStock ? 'Show All Products' : 'View All Low Stock Items'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
