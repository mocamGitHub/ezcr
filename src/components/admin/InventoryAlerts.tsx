'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, PackageX, BellOff, ChevronDown, ChevronUp, VolumeX, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  sku: string
  inventory_count: number
  low_stock_threshold: number
  suppress_low_stock_alert?: boolean
  suppress_out_of_stock_alert?: boolean
}

interface InventoryAlertsProps {
  products: Product[]
  onFilterLowStock: () => void
  showingLowStock: boolean
  onToggleAlertSuppression?: (productId: string, alertType: 'low_stock' | 'out_of_stock', suppress: boolean) => Promise<void>
  showSuppressed?: boolean
}

export function InventoryAlerts({
  products,
  onFilterLowStock,
  showingLowStock,
  onToggleAlertSuppression,
  showSuppressed = false,
}: InventoryAlertsProps) {
  const [expanded, setExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [suppressingId, setSuppressingId] = useState<string | null>(null)

  // Filter out suppressed alerts unless showSuppressed is true
  const outOfStock = products.filter(p =>
    p.inventory_count <= 0 &&
    (showSuppressed || !p.suppress_out_of_stock_alert)
  )
  const critical = products.filter(p =>
    p.inventory_count > 0 &&
    p.inventory_count <= Math.floor(p.low_stock_threshold * 0.5) &&
    (showSuppressed || !p.suppress_low_stock_alert)
  )
  const lowStock = products.filter(p =>
    p.inventory_count > Math.floor(p.low_stock_threshold * 0.5) &&
    p.inventory_count <= p.low_stock_threshold &&
    (showSuppressed || !p.suppress_low_stock_alert)
  )

  // Count suppressed alerts
  const suppressedOutOfStock = products.filter(p =>
    p.inventory_count <= 0 && p.suppress_out_of_stock_alert
  ).length
  const suppressedLowStock = products.filter(p =>
    p.inventory_count > 0 &&
    p.inventory_count <= p.low_stock_threshold &&
    p.suppress_low_stock_alert
  ).length

  const totalAlerts = outOfStock.length + critical.length + lowStock.length
  const totalSuppressed = suppressedOutOfStock + suppressedLowStock

  if (totalAlerts === 0 && totalSuppressed === 0) {
    return null
  }

  if (totalAlerts === 0 && !showSuppressed) {
    // Only suppressed alerts exist, show minimal indicator
    return (
      <div className="border rounded-lg mb-6 p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <VolumeX className="h-4 w-4" />
            <span className="text-sm">
              {totalSuppressed} suppressed alert{totalSuppressed !== 1 ? 's' : ''}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFilterLowStock}
          >
            View Details
          </Button>
        </div>
      </div>
    )
  }

  if (dismissed) {
    return null
  }

  const getAlertSeverity = () => {
    if (outOfStock.length > 0) return 'destructive'
    if (critical.length > 0) return 'warning'
    return 'default'
  }

  const severity = getAlertSeverity()

  const handleToggleSuppression = async (
    e: React.MouseEvent,
    productId: string,
    alertType: 'low_stock' | 'out_of_stock',
    currentlySuppressed: boolean
  ) => {
    e.preventDefault()
    e.stopPropagation()

    if (!onToggleAlertSuppression) return

    setSuppressingId(productId)
    try {
      await onToggleAlertSuppression(productId, alertType, !currentlySuppressed)
    } finally {
      setSuppressingId(null)
    }
  }

  const renderProductItem = (
    product: Product,
    alertType: 'low_stock' | 'out_of_stock',
    badgeVariant: 'destructive' | 'warning' | 'outline',
    badgeClassName?: string
  ) => {
    const isSuppressed = alertType === 'out_of_stock'
      ? product.suppress_out_of_stock_alert
      : product.suppress_low_stock_alert
    const isProcessing = suppressingId === product.id

    return (
      <div
        key={product.id}
        className={cn(
          "flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border text-sm transition-colors",
          isSuppressed && "opacity-60 border-dashed",
          !isSuppressed && "hover:bg-gray-50 dark:hover:bg-gray-800"
        )}
      >
        <Link
          href={`/admin/inventory/${product.id}`}
          className="truncate font-medium flex-1 hover:underline"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-1 ml-2">
          {alertType === 'out_of_stock' ? (
            <Badge variant="destructive" className="text-xs">0</Badge>
          ) : (
            <Badge
              variant={badgeVariant === 'warning' ? 'default' : 'outline'}
              className={cn("text-xs", badgeClassName)}
            >
              {product.inventory_count}
            </Badge>
          )}
          {onToggleAlertSuppression && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={isProcessing}
                    onClick={(e) => handleToggleSuppression(e, product.id, alertType, !!isSuppressed)}
                  >
                    {isSuppressed ? (
                      <Volume2 className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <VolumeX className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSuppressed ? 'Enable alert' : 'Suppress alert'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    )
  }

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
              {totalSuppressed > 0 && !showSuppressed && (
                <span className="ml-1 text-xs">({totalSuppressed} suppressed)</span>
              )}
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
            title="Dismiss temporarily"
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
                {outOfStock.slice(0, 6).map(product =>
                  renderProductItem(product, 'out_of_stock', 'destructive')
                )}
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
                {critical.slice(0, 6).map(product =>
                  renderProductItem(product, 'low_stock', 'warning', 'bg-orange-500 text-white')
                )}
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
                {lowStock.slice(0, 6).map(product =>
                  renderProductItem(product, 'low_stock', 'outline', 'border-yellow-500 text-yellow-700')
                )}
              </div>
              {lowStock.length > 6 && (
                <p className="text-xs text-muted-foreground">
                  +{lowStock.length - 6} more items
                </p>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 border-t flex items-center justify-between">
            <Button
              variant={showingLowStock ? 'secondary' : 'default'}
              size="sm"
              onClick={onFilterLowStock}
            >
              {showingLowStock ? 'Show All Products' : 'View All Low Stock Items'}
            </Button>
            {totalSuppressed > 0 && (
              <span className="text-xs text-muted-foreground">
                <VolumeX className="h-3 w-3 inline mr-1" />
                {totalSuppressed} alert{totalSuppressed !== 1 ? 's' : ''} suppressed
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
