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
    return (
      <div className="border rounded-lg">
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    )
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
                    ${product.base_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${totalValue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdjust(product, 'increase')}
                        title="Increase inventory"
                      >
                        <PackagePlus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdjust(product, 'decrease')}
                        title="Decrease inventory"
                      >
                        <PackageMinus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        title="View history"
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
