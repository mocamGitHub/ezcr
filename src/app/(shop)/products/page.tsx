// src/app/(shop)/products/page.tsx
import { getProducts, getProductCategories, getProductsByCategory } from '@/lib/supabase/queries'
import { ProductCard } from '@/components/products/ProductCard'
import { CategoryFilter } from '@/components/products/CategoryFilter'

export const metadata = {
  title: 'All Products - EZ Cycle Ramp',
  description: 'Browse our complete collection of premium motorcycle loading ramps and accessories.',
}

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category: categorySlug } = await searchParams

  const [products, categories] = await Promise.all([
    categorySlug ? getProductsByCategory(categorySlug) : getProducts(),
    getProductCategories(),
  ])

  // Get the active category name for display
  const activeCategory = categorySlug
    ? categories.find(c => c.slug === categorySlug)
    : null

  // Debug logging
  console.log('Categories fetched:', categories.length)
  console.log('Products fetched:', products.length)

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

      {/* Category Filter */}
      {categories.length > 0 && (
        <CategoryFilter categories={categories} />
      )}

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {activeCategory
              ? `No products available in ${activeCategory.name} at this time.`
              : 'No products available at this time.'
            }
          </p>
        </div>
      )}
    </div>
  )
}
