'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InventoryTable } from '@/components/admin/InventoryTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, Search, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

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

  const lowStockCount = products.filter(
    (p) => p.inventory_count <= p.low_stock_threshold
  ).length

  const outOfStockCount = products.filter((p) => p.inventory_count === 0).length

  const totalValue = products.reduce(
    (sum, p) => sum + p.base_price * p.inventory_count,
    0
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage product stock levels and view inventory history
          </p>
        </div>
        <Button onClick={fetchProducts} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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

      {/* Low Stock Alert */}
      {lowStockCount > 0 && !showLowStockOnly && (
        <Alert className="mb-6 border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-400">
            Low Stock Alert
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-500">
            {lowStockCount} product{lowStockCount !== 1 ? 's are' : ' is'} running low on
            stock.{' '}
            <button
              onClick={() => setShowLowStockOnly(true)}
              className="underline font-medium"
            >
              View low stock items
            </button>
          </AlertDescription>
        </Alert>
      )}

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
