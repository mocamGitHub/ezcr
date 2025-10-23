export function ProductCardSkeleton() {
  return (
    <div className="group relative border rounded-lg overflow-hidden bg-background">
      {/* Image skeleton */}
      <div className="aspect-square relative bg-muted animate-shimmer" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Category badge skeleton */}
        <div className="h-5 w-24 bg-muted rounded-full animate-shimmer" />

        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded animate-shimmer" />
          <div className="h-5 bg-muted rounded w-3/4 animate-shimmer" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-shimmer" />
          <div className="h-4 bg-muted rounded w-5/6 animate-shimmer" />
        </div>

        {/* Price skeleton */}
        <div className="h-6 w-32 bg-muted rounded animate-shimmer" />

        {/* Buttons skeleton */}
        <div className="flex gap-2 pt-2">
          <div className="h-10 flex-1 bg-muted rounded animate-shimmer" />
          <div className="h-10 w-10 bg-muted rounded animate-shimmer" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
