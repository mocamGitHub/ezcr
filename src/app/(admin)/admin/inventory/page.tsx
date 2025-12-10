'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InventoryTable } from '@/components/admin/InventoryTable'
import { InventoryAlerts } from '@/components/admin/InventoryAlerts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, Search, AlertTriangle, Download } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { exportToCSV, inventoryColumns, getExportFilename } from '@/lib/utils/export'

interface Product {
  id: string
  name: string
  sku: string
  inventory_count: number
  low_stock_threshold: number
  category_id: string | null
  base_price: number
  is_active: boolean
  suppress_low_stock_alert?: boolean
  suppress_out_of_stock_alert?: boolean
  product_categories?: {
    name: string
  } | null
}

export default function InventoryDashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          inventory_count,
          low_stock_threshold,
          category_id,
          base_price,
          is_active,
          suppress_low_stock_alert,
          suppress_out_of_stock_alert,
          product_categories (
            name
          )
        `)
        .order('name', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      setProducts(data || [])
      setFilteredProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    let filtered = products

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by low stock
    if (showLowStockOnly) {
      filtered = filtered.filter((p) => p.inventory_count <= p.low_stock_threshold)
    }

    setFilteredProducts(filtered)
  }, [searchQuery, showLowStockOnly, products])

  const handleToggleAlertSuppression = async (
    productId: string,
    alertType: 'low_stock' | 'out_of_stock',
    suppress: boolean
  ) => {
    try {
      const response = await fetch('/api/inventory/suppress-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, alertType, suppress }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update alert settings')
      }

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                suppress_low_stock_alert:
                  alertType === 'low_stock' ? suppress : p.suppress_low_stock_alert,
                suppress_out_of_stock_alert:
                  alertType === 'out_of_stock' ? suppress : p.suppress_out_of_stock_alert,
              }
            : p
        )
      )

      toast.success(data.message)
    } catch (err) {
      console.error('Error toggling alert suppression:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update alert settings')
    }
  }

  const outOfStockCount = products.filter((p) => p.inventory_count === 0).length

  const lowStockCount = products.filter(
    (p) => p.inventory_count > 0 && p.inventory_count <= p.low_stock_threshold
  ).length

  const totalValue = products.reduce(
    (sum, p) => sum + p.base_price * p.inventory_count,
    0
  )

  // Count suppressed alerts
  const suppressedCount = products.filter(
    (p) =>
      (p.inventory_count <= 0 && p.suppress_out_of_stock_alert) ||
      (p.inventory_count > 0 &&
        p.inventory_count <= p.low_stock_threshold &&
        p.suppress_low_stock_alert)
  ).length

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage product stock levels and view inventory history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              exportToCSV(filteredProducts, inventoryColumns, getExportFilename('inventory'))
              toast.success(`Exported ${filteredProducts.length} products to CSV`)
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={fetchProducts} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Products</div>
          <div className="text-2xl font-bold mt-1">{products.length}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Low Stock</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">
            {lowStockCount}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Out of Stock</div>
          <div className="text-2xl font-bold mt-1 text-red-600">
            {outOfStockCount}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Inventory Value</div>
          <div className="text-2xl font-bold mt-1">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Inventory Alerts Panel */}
      <InventoryAlerts
        products={products}
        onFilterLowStock={() => setShowLowStockOnly(!showLowStockOnly)}
        showingLowStock={showLowStockOnly}
        onToggleAlertSuppression={handleToggleAlertSuppression}
        showSuppressed={showLowStockOnly}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showLowStockOnly ? 'default' : 'outline'}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          {showLowStockOnly ? 'Show All' : 'Show Low Stock Only'}
          {suppressedCount > 0 && !showLowStockOnly && (
            <span className="ml-2 text-xs opacity-70">({suppressedCount} suppressed)</span>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Inventory Table */}
      <InventoryTable
        products={filteredProducts}
        loading={loading}
        onRefresh={fetchProducts}
      />

      {/* Empty State */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || showLowStockOnly
              ? 'No products match your filters.'
              : 'No products found.'}
          </p>
        </div>
      )}
    </div>
  )
}
