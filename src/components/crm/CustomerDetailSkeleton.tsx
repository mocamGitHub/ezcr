export function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back Button */}
      <div className="h-6 w-32 bg-muted rounded"></div>

      {/* Profile Card */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-muted"></div>
          <div className="flex-1">
            <div className="h-8 w-48 bg-muted rounded mb-2"></div>
            <div className="h-4 w-64 bg-muted rounded mb-1"></div>
            <div className="h-4 w-48 bg-muted rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-8 w-24 bg-muted rounded mb-1"></div>
              <div className="h-3 w-32 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-32 bg-muted rounded"></div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 bg-card">
            <div className="h-6 w-48 bg-muted rounded mb-2"></div>
            <div className="h-4 w-full bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
