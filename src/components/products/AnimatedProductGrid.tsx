'use client'

import { useAutoAnimate } from '@formkit/auto-animate/react'
import { ProductCard } from './ProductCard'
import type { Product } from '@/types/database'

interface AnimatedProductGridProps {
  products: Product[]
  hasActiveFilters: boolean
  activeCategory?: { name: string } | null
}

export function AnimatedProductGrid({
  products,
  hasActiveFilters,
  activeCategory,
}: AnimatedProductGridProps) {
  const [parent] = useAutoAnimate()

  if (products.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground mb-4">
          {hasActiveFilters
            ? 'No products match your search criteria.'
            : activeCategory
            ? `No products available in ${activeCategory.name} at this time.`
            : 'No products available at this time.'}
        </p>
        {hasActiveFilters && (
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 text-sm text-muted-foreground">
        {products.length} product{products.length !== 1 ? 's' : ''} found
        {hasActiveFilters && ' (filtered)'}
      </div>
      <div
        ref={parent}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}
