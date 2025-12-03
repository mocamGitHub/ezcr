// src/app/(shop)/products/page.tsx
import { searchProducts, getProductCategories, ProductSortOption } from '@/lib/supabase/queries'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductSearch } from '@/components/products/ProductSearch'
import { ProductFilterBar } from '@/components/products/ProductFilterBar'

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
    sort?: ProductSortOption
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
      sort: params.sort,
    }),
    getProductCategories(),
  ])

  // Get the active category name for display
  const activeCategory = params.category
    ? categories.find(c => c.slug === params.category)
    : null

  const hasActiveFilters = params.q || params.minPrice || params.maxPrice || params.available

  return (
    <>
      {/* Hero Section - Full Width */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16 -mt-6 mb-8" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {activeCategory ? activeCategory.name : 'All Products'}
            </h1>
            <p className="text-xl text-blue-100">
              {activeCategory?.description || 'Premium motorcycle loading ramps and accessories for trucks, vans, and trailers.'}
            </p>
          </div>
        </div>
      </section>

    <div>

      {/* Search Bar */}
      <div className="mb-6">
        <ProductSearch />
      </div>

      {/* Filter Bar */}
      {categories.length > 0 && (
        <ProductFilterBar categories={categories} />
      )}

      {/* Product Grid */}
      <div className="mt-6">
        {products.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {products.length} product{products.length !== 1 ? 's' : ''} found
              {hasActiveFilters && ' (filtered)'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
    </>
  )
}
