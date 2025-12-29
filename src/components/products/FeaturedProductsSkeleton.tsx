export function FeaturedProductsSkeleton() {
  return (
    <section className="py-16 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">
          Featured <span className="text-[#F78309]">Ramps</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-background border rounded-lg overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-muted" />
              <div className="p-6 space-y-3">
                <div className="h-5 bg-muted rounded w-3/4 mx-auto" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
                <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
                <div className="h-10 bg-muted rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
