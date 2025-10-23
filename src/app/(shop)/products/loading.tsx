import { ProductGridSkeleton } from '@/components/products/ProductCardSkeleton'

export default function ProductsLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-10 w-64 bg-muted rounded animate-shimmer mb-4" />
        <div className="h-6 w-full max-w-2xl bg-muted rounded animate-shimmer" />
      </div>

      {/* Search bar skeleton */}
      <div className="mb-6">
        <div className="h-12 w-full bg-muted rounded-lg animate-shimmer" />
      </div>

      {/* Category filter skeleton */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-32 bg-muted rounded-full animate-shimmer flex-shrink-0" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Filters sidebar skeleton */}
        <aside className="lg:col-span-1">
          <div className="space-y-6">
            {/* Price range filter */}
            <div className="space-y-3">
              <div className="h-5 w-24 bg-muted rounded animate-shimmer" />
              <div className="h-10 bg-muted rounded animate-shimmer" />
              <div className="h-10 bg-muted rounded animate-shimmer" />
            </div>

            {/* Availability filter */}
            <div className="space-y-3">
              <div className="h-5 w-32 bg-muted rounded animate-shimmer" />
              <div className="h-10 bg-muted rounded animate-shimmer" />
            </div>
          </div>
        </aside>

        {/* Product grid skeleton */}
        <div className="lg:col-span-3">
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </div>
  )
}
