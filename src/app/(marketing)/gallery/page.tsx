import { Suspense } from 'react'
import { getGalleryItems, getGalleryCategories } from '@/lib/supabase/queries'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Gallery - EZ Cycle Ramp',
  description: 'View our collection of custom cycle ramps, installations, and customer testimonials.',
}

interface GalleryPageProps {
  searchParams: Promise<{
    category?: string
  }>
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const params = await searchParams
  const categorySlug = params.category

  // Fetch data
  const [items, categories] = await Promise.all([
    getGalleryItems(categorySlug),
    getGalleryCategories(),
  ])

  const activeCategory = categories.find(cat => cat.slug === categorySlug)

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Gallery</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore our custom cycle ramps, installations, and see what our customers have to say
        </p>
      </div>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <Link href="/gallery">
            <Button
              variant={!categorySlug ? 'default' : 'outline'}
              className={!categorySlug ? 'bg-[#0B5394] hover:bg-[#0B5394]/90' : ''}
            >
              All Categories
            </Button>
          </Link>
          {categories.map((category) => (
            <Link key={category.id} href={`/gallery?category=${category.slug}`}>
              <Button
                variant={categorySlug === category.slug ? 'default' : 'outline'}
                className={categorySlug === category.slug ? 'bg-[#0B5394] hover:bg-[#0B5394]/90' : ''}
              >
                {category.name}
              </Button>
            </Link>
          ))}
        </div>
      )}

      {/* Active Category Info */}
      {activeCategory && (
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">{activeCategory.name}</h2>
          {activeCategory.description && (
            <p className="text-muted-foreground">{activeCategory.description}</p>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      <Suspense fallback={<GalleryGridSkeleton />}>
        <GalleryGrid items={items} columns={3} showFilters={true} />
      </Suspense>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-2xl font-semibold mb-2">No items yet</h3>
          <p className="text-muted-foreground mb-6">
            Check back soon for photos and videos of our work
          </p>
          <Link href="/products">
            <Button className="bg-[#0B5394] hover:bg-[#0B5394]/90">
              View Products
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

function GalleryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
