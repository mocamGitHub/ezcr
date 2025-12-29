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
import { Edit, History, PackagePlus, PackageMinus, AlertTriangle } from 'lucide-react'
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
  onRefresh: () => void
}

export function InventoryTable({ products, loading, onRefresh }: InventoryTableProps) {
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

  if (loading) {
    return <InventoryTableSkeleton />
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="text-right">Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
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
                      <span>{product.name}</span>
                      {!product.is_active && (
                        <Badge variant="outline" className="w-fit mt-1 text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {product.sku}
                  </TableCell>
                  <TableCell>
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
                  <TableCell className="text-right text-muted-foreground">
                    {product.low_stock_threshold}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className={`flex items-center gap-1 w-fit ${status.className || ''}`}>
                      {status.icon && <status.icon className="h-3 w-3" />}
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${product.base_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-medium">
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
