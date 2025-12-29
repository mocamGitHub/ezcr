'use client'

interface ChartSkeletonProps {
  height?: number
  type?: 'area' | 'bar' | 'pie'
}

export function ChartSkeleton({ height = 300, type = 'area' }: ChartSkeletonProps) {
  return (
    <div
      className="w-full animate-pulse bg-muted/50 rounded-lg flex items-center justify-center"
      style={{ height }}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        {type === 'pie' ? (
          <div className="w-24 h-24 rounded-full border-8 border-muted" />
        ) : (
          <div className="flex items-end gap-1 h-16">
            {[40, 60, 30, 80, 50, 70, 45].map((h, i) => (
              <div
                key={i}
                className="w-4 bg-muted rounded-t"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        )}
        <span className="text-sm">Loading chart...</span>
      </div>
    </div>
  )
}
