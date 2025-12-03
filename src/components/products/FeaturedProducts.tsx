// src/components/products/FeaturedProducts.tsx
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getFeaturedProducts } from '@/lib/supabase/queries'
import { formatPrice } from '@/lib/utils/format'

export async function FeaturedProducts() {
  const products = await getFeaturedProducts(3)

  // If no featured products in database, show empty state
  if (products.length === 0) {
    return (
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Featured <span className="text-[#F78309]">Ramps</span>
          </h2>
          <p className="text-center text-muted-foreground">
            No featured products available at this time.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">
          Featured <span className="text-[#F78309]">Ramps</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => {
            const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0]

            return (
              <div
                key={product.id}
                className="bg-background border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[4/3] relative bg-gray-100 flex items-center justify-center p-4">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.alt_text || product.name}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="text-muted-foreground">No Image</div>
                  )}
                </div>
                <div className="p-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  {product.short_description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {product.short_description}
                    </p>
                  )}
                  <p className="text-2xl font-bold text-[#F78309] mb-4">
                    {formatPrice(product.base_price)}
                  </p>
                  <Button asChild className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90">
                    <Link href={`/products/${product.slug}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
