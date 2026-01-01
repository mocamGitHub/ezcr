'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { InventoryAlerts } from '@/components/admin/InventoryAlerts'
import { InventoryAdjustmentDialog } from '@/components/admin/InventoryAdjustmentDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  RefreshCw,
  Download,
  AlertTriangle,
  PackagePlus,
  PackageMinus,
  History,
  SlidersHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportToCSV, inventoryColumns, getExportFilename } from '@/lib/utils/export'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  AdminDataTable,
  AdminFilterBar,
  FilterPresetDropdown,
  PageHeader,
  useFilters,
  type ColumnDef,
  type RowAction,
  type FilterConfig,
} from '@/components/admin'
import {
  getInventoryPaginated,
  getInventoryStats,
  getProductsForAlerts,
  getProductsForExport,
  toggleConfiguratorRules,
  toggleAlertSuppression,
  type Product,
  type InventoryStats,
} from './actions'

export default function InventoryDashboardPage() {
  usePageTitle('Inventory')

  // Table state
  const [products, setProducts] = useState<Product[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [sortColumn, setSortColumn] = useState('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // URL-synced filters with presets
  type InventoryFilters = {
    stockFilter: 'all' | 'low_stock'
    [key: string]: unknown
  }

  const {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    applyPreset,
  } = useFilters<InventoryFilters>({
    initialState: {
      stockFilter: 'all',
    },
    syncToUrl: true,
    urlPrefix: 'f_',
  })

  const showLowStockOnly = filters.stockFilter === 'low_stock'

  // Stats and alerts
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [alertProducts, setAlertProducts] = useState<Product[]>([])

  // Adjustment dialog
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [inventoryResult, statsResult, alertsResult] = await Promise.all([
        getInventoryPaginated({
          page,
          pageSize,
          sortColumn,
          sortDirection,
          search,
          showLowStockOnly,
        }),
        getInventoryStats(),
        getProductsForAlerts(),
      ])

      setProducts(inventoryResult.data)
      setTotalCount(inventoryResult.totalCount)
      setStats(statsResult)
      setAlertProducts(alertsResult)
    } catch (err: any) {
      console.error('Error loading inventory:', err)
      setError(err.message || 'Failed to load inventory')
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortColumn, sortDirection, search, showLowStockOnly])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleFilterChange = (value: string) => {
    updateFilter('stockFilter', value as InventoryFilters['stockFilter'])
    setPage(1)
  }

  const handleClearFilters = () => {
    resetFilters()
    setPage(1)
  }

  const handleApplyPreset = (preset: Record<string, unknown>) => {
    if (applyPreset) {
      applyPreset(preset as Partial<InventoryFilters>)
      setPage(1)
    }
  }

  const handleAdjust = (product: Product, type: 'increase' | 'decrease') => {
    setSelectedProduct(product)
    setAdjustmentType(type)
  }

  const handleToggleConfiguratorRules = async (productId: string, hasRules: boolean) => {
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, has_configurator_rules: hasRules } : p))
    )

    try {
      await toggleConfiguratorRules(productId, hasRules)
      toast.success(
        hasRules ? 'Product marked for configurator rules' : 'Configurator rules disabled'
      )
    } catch (err) {
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, has_configurator_rules: !hasRules } : p))
      )
      toast.error('Failed to update configurator rules')
    }
  }

  const handleToggleAlertSuppression = async (
    productId: string,
    alertType: 'low_stock' | 'out_of_stock',
    suppress: boolean
  ) => {
    try {
      await toggleAlertSuppression(productId, alertType, suppress)

      // Update both products and alertProducts
      const updateFn = (p: Product) =>
        p.id === productId
          ? {
              ...p,
              suppress_low_stock_alert:
                alertType === 'low_stock' ? suppress : p.suppress_low_stock_alert,
              suppress_out_of_stock_alert:
                alertType === 'out_of_stock' ? suppress : p.suppress_out_of_stock_alert,
            }
          : p

      setProducts((prev) => prev.map(updateFn))
      setAlertProducts((prev) => prev.map(updateFn))

      toast.success(suppress ? 'Alert suppressed' : 'Alert enabled')
    } catch (err) {
      toast.error('Failed to update alert settings')
    }
  }

  const handleExport = async () => {
    try {
      const allProducts = await getProductsForExport()
      exportToCSV(allProducts, inventoryColumns, getExportFilename('inventory'))
      toast.success(`Exported ${allProducts.length} products to CSV`)
    } catch (err) {
      toast.error('Failed to export inventory')
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.inventory_count === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const, className: '' }
    }
    if (product.inventory_count <= product.low_stock_threshold) {
      return {
        label: 'Low Stock',
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      }
    }
    return { label: 'In Stock', variant: 'default' as const, className: '' }
  }

  // Column definitions
  const columns: ColumnDef<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      cell: (product) => (
        <div className="flex flex-col">
          <span className="font-medium line-clamp-1">{product.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{product.sku}</span>
          {!product.is_active && (
            <Badge variant="outline" className="w-fit mt-1 text-xs">
              Inactive
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'product_categories',
      header: 'Category',
      cell: (product) => (
        <span className="text-sm">
          {product.product_categories?.name || (
            <span className="text-muted-foreground">Uncategorized</span>
          )}
        </span>
      ),
    },
    {
      key: 'inventory_count',
      header: 'Stock',
      sortable: true,
      cell: (product) => (
        <span
          className={`font-semibold ${
            product.inventory_count === 0
              ? 'text-red-600'
              : product.inventory_count <= product.low_stock_threshold
                ? 'text-yellow-600'
                : ''
          }`}
        >
          {product.inventory_count}
        </span>
      ),
    },
    {
      key: 'low_stock_threshold',
      header: 'Threshold',
      sortable: true,
      cell: (product) => (
        <span className="text-muted-foreground">{product.low_stock_threshold}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (product) => {
        const status = getStockStatus(product)
        return (
          <Badge
            variant={status.variant}
            className={`flex items-center gap-1 w-fit whitespace-nowrap ${status.className}`}
          >
            {(product.inventory_count === 0 ||
              product.inventory_count <= product.low_stock_threshold) && (
              <AlertTriangle className="h-3 w-3" />
            )}
            {status.label}
          </Badge>
        )
      },
    },
    {
      key: 'has_configurator_rules',
      header: (
        <div className="flex items-center gap-1" title="Has Configurator Rules">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Rules</span>
        </div>
      ),
      cell: (product) => (
        <Switch
          checked={product.has_configurator_rules || false}
          onCheckedChange={(checked) => handleToggleConfiguratorRules(product.id, checked)}
          onClick={(e) => e.stopPropagation()}
          className={
            product.has_configurator_rules
              ? 'data-[state=checked]:bg-green-600'
              : 'data-[state=unchecked]:bg-muted'
          }
        />
      ),
    },
    {
      key: 'base_price',
      header: 'Unit Price',
      sortable: true,
      cell: (product) => (
        <span>
          $
          {product.base_price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      key: 'total_value',
      header: 'Total Value',
      cell: (product) => {
        const totalValue = product.base_price * product.inventory_count
        return (
          <span className="font-medium">
            $
            {totalValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        )
      },
    },
  ]

  // Row actions
  const getRowActions = (product: Product): RowAction<Product>[] => [
    {
      label: 'Increase Stock',
      onClick: () => handleAdjust(product, 'increase'),
      icon: <PackagePlus className="h-4 w-4" />,
    },
    {
      label: 'Decrease Stock',
      onClick: () => handleAdjust(product, 'decrease'),
      icon: <PackageMinus className="h-4 w-4" />,
    },
    {
      label: 'View History',
      href: `/admin/inventory/${product.id}`,
      icon: <History className="h-4 w-4" />,
      separator: true,
    },
  ]

  // Filter configuration for AdminFilterBar
  const filterConfig: FilterConfig[] = useMemo(() => [
    {
      type: 'select' as const,
      key: 'stockFilter',
      label: 'Stock',
      value: filters.stockFilter,
      onChange: handleFilterChange,
      allLabel: 'All Products',
      options: [
        { value: 'low_stock', label: 'Low Stock Only' },
      ],
    },
  ], [filters.stockFilter])

  return (
    <div className="p-8">
      <PageHeader
        title="Inventory Management"
        description="Manage product stock levels and view inventory history"
        primaryAction={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground">Total Products</div>
            <div className="text-2xl font-bold mt-1">{stats.totalProducts}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground">Low Stock</div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.lowStockCount}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground">Out of Stock</div>
            <div className="text-2xl font-bold mt-1 text-red-600">{stats.outOfStockCount}</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground">Total Inventory Value</div>
            <div className="text-2xl font-bold mt-1">
              ${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Alerts Panel */}
      <InventoryAlerts
        products={alertProducts}
        onFilterLowStock={() => updateFilter('stockFilter', showLowStockOnly ? 'all' : 'low_stock')}
        showingLowStock={showLowStockOnly}
        onToggleAlertSuppression={handleToggleAlertSuppression}
        showSuppressed={showLowStockOnly}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <AdminFilterBar
          filters={filterConfig}
          onClearAll={handleClearFilters}
          showFilterIcon
        />
        <FilterPresetDropdown
          page="inventory"
          currentFilters={filters}
          onApplyPreset={handleApplyPreset}
          hasActiveFilters={hasActiveFilters}
        />
        {stats && stats.suppressedCount > 0 && !showLowStockOnly && (
          <span className="text-xs text-muted-foreground">({stats.suppressedCount} suppressed)</span>
        )}
      </div>

      {/* Inventory Table */}
      <AdminDataTable
        data={products}
        columns={columns}
        keyField="id"
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by product name or SKU..."
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyTitle="No products found"
        emptyDescription={
          search || showLowStockOnly
            ? 'No products match your current filters.'
            : 'No products found in inventory.'
        }
        rowActions={getRowActions}
      />

      {/* Adjustment Dialog */}
      {selectedProduct && (
        <InventoryAdjustmentDialog
          product={selectedProduct}
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={() => {
            setSelectedProduct(null)
            loadData()
          }}
          defaultType={adjustmentType}
        />
      )}
    </div>
  )
}
