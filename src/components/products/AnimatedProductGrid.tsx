'use client'

import { useAutoAnimate } from '@formkit/auto-animate/react'
import { ProductCard } from './ProductCard'
import type { Product } from '@/lib/supabase/queries'
import Lottie from 'lottie-react'
import noResultsAnimation from '@/public/animations/no-results.json'

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
        <div className="flex justify-center mb-6">
          <div className="w-48 h-48">
            <Lottie
              animationData={noResultsAnimation}
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
        <h3 className="font-semibold text-xl mb-2">
          {hasActiveFilters ? 'No Results Found' : 'No Products Available'}
        </h3>
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
