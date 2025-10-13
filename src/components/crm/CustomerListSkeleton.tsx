export function CustomerListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 bg-card">
            <div className="h-6 w-6 bg-muted rounded mb-2"></div>
            <div className="h-8 w-16 bg-muted rounded mb-1"></div>
            <div className="h-3 w-24 bg-muted rounded"></div>
          </div>
        ))}
      </div>

      {/* Segment Tabs Skeleton */}
      <div className="border-b">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-32 bg-muted rounded"></div>
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="border rounded-lg p-4">
        <div className="h-6 w-32 bg-muted rounded"></div>
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-lg overflow-hidden">
        <div className="h-12 bg-muted"></div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-16 border-t bg-card"></div>
        ))}
      </div>
    </div>
  )
}
