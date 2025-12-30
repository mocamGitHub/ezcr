'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InventoryTableSkeleton } from '@/components/ui/table-skeleton'
import { Edit, History, PackagePlus, PackageMinus, AlertTriangle, RefreshCw } from 'lucide-react'
import { InventoryAdjustmentDialog } from './InventoryAdjustmentDialog'

interface Product {
  id: string
  name: string
  sku: string
  inventory_count: number
  low_stock_threshold: number
  category_id: string | null
  base_price: number
  is_active: boolean
  product_categories?: {
    name: string
  } | null
}

interface InventoryTableProps {
  products: Product[]
  loading: boolean
  error?: string | null
  onRefresh: () => void
}

export function InventoryTable({ products, loading, error, onRefresh }: InventoryTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase')

  const handleAdjust = (product: Product, type: 'increase' | 'decrease') => {
    setSelectedProduct(product)
    setAdjustmentType(type)
  }

  const getStockStatus = (product: Product) => {
    if (product.inventory_count === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const, icon: AlertTriangle }
    }
    if (product.inventory_count <= product.low_stock_threshold) {
      return { label: 'Low Stock', variant: 'secondary' as const, icon: AlertTriangle, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    }
    return { label: 'In Stock', variant: 'default' as const, icon: null, className: '' }
  }

  if (error) {
    return (
      <div className="border border-destructive/50 rounded-lg p-12 text-center bg-destructive/5">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="font-medium text-lg mb-1 text-destructive">Failed to load inventory</h3>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <Button variant="outline" onClick={onRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  if (loading) {
    return <InventoryTableSkeleton />
  }

  if (products.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <PackagePlus className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-1">No products found</h3>
        <p className="text-muted-foreground text-sm">
          There are no products matching your current filters.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Responsive: horizontal scroll on mobile, hide non-essential columns */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="hidden sm:table-cell">SKU</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right hidden md:table-cell">Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Unit Price</TableHead>
              <TableHead className="text-right hidden md:table-cell">Total Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const status = getStockStatus(product)
              const totalValue = product.base_price * product.inventory_count

              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="line-clamp-1">{product.name}</span>
                      {/* Show SKU on mobile since column is hidden */}
                      <span className="text-xs text-muted-foreground font-mono sm:hidden">
                        {product.sku}
                      </span>
                      {!product.is_active && (
                        <Badge variant="outline" className="w-fit mt-1 text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm hidden sm:table-cell">
                    {product.sku}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {product.product_categories?.name || (
                      <span className="text-muted-foreground">Uncategorized</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${
                      product.inventory_count === 0
                        ? 'text-red-600'
                        : product.inventory_count <= product.low_stock_threshold
                        ? 'text-yellow-600'
                        : ''
                    }`}>
                      {product.inventory_count}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                    {product.low_stock_threshold}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className={`flex items-center gap-1 w-fit whitespace-nowrap ${status.className || ''}`}>
                      {status.icon && <status.icon className="h-3 w-3" />}
                      <span className="hidden sm:inline">{status.label}</span>
                      {/* Short label on mobile */}
                      <span className="sm:hidden">{status.label === 'Out of Stock' ? 'OOS' : status.label === 'Low Stock' ? 'Low' : 'OK'}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell">
                    ${product.base_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-medium hidden md:table-cell">
                    ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <Button
                        size="icon-touch"
                        variant="outline"
                        onClick={() => handleAdjust(product, 'increase')}
                        title="Increase inventory"
                        aria-label={`Increase inventory for ${product.name}`}
                        className="sm:size-8"
                      >
                        <PackagePlus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-touch"
                        variant="outline"
                        onClick={() => handleAdjust(product, 'decrease')}
                        title="Decrease inventory"
                        aria-label={`Decrease inventory for ${product.name}`}
                        className="sm:size-8"
                      >
                        <PackageMinus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-touch"
                        variant="outline"
                        asChild
                        title="View history"
                        aria-label={`View inventory history for ${product.name}`}
                        className="sm:size-8"
                      >
                        <Link href={`/admin/inventory/${product.id}`}>
                          <History className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Adjustment Dialog */}
      {selectedProduct && (
        <InventoryAdjustmentDialog
          product={selectedProduct}
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={() => {
            setSelectedProduct(null)
            onRefresh()
          }}
          defaultType={adjustmentType}
        />
      )}
    </>
  )
}
