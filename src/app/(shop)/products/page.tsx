// src/app/(shop)/products/page.tsx
import { searchProducts, getProductCategories } from '@/lib/supabase/queries'
import { ProductCard } from '@/components/products/ProductCard'
import { CategoryFilter } from '@/components/products/CategoryFilter'
import { ProductSearch } from '@/components/products/ProductSearch'
import { ProductFilters } from '@/components/products/ProductFilters'

export const metadata = {
  title: 'All Products - EZ Cycle Ramp',
  description: 'Browse our complete collection of premium motorcycle loading ramps and accessories.',
}

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    q?: string
    minPrice?: string
    maxPrice?: string
    available?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams

  const [products, categories] = await Promise.all([
    searchProducts({
      category: params.category,
      search: params.q,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      availableOnly: params.available === 'true',
    }),
    getProductCategories(),
  ])

  // Get the active category name for display
  const activeCategory = params.category
    ? categories.find(c => c.slug === params.category)
    : null

  const hasActiveFilters = params.q || params.minPrice || params.maxPrice || params.available

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">
          {activeCategory ? activeCategory.name : 'All Products'}
        </h1>
        <p className="text-lg text-muted-foreground">
          {activeCategory?.description || 'Premium motorcycle loading ramps and accessories for trucks, vans, and trailers.'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <ProductSearch />
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <CategoryFilter categories={categories} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <ProductFilters />
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {products.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                {products.length} product{products.length !== 1 ? 's' : ''} found
                {hasActiveFilters && ' (filtered)'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'No products match your search criteria.'
                  : activeCategory
                  ? `No products available in ${activeCategory.name} at this time.`
                  : 'No products available at this time.'
                }
              </p>
              {hasActiveFilters && (
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
