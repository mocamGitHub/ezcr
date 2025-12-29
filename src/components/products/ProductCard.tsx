// src/components/products/ProductCard.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { formatPrice } from '@/lib/utils/format'
import type { Product } from '@/lib/supabase/queries'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const router = useRouter()
  const productUrl = `/products/${product.slug}`
  const isOutOfStock = product.inventory_count <= 0
  const isLowStock = product.inventory_count > 0 && product.inventory_count <= 5
  const isComingSoon = product.coming_soon
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price

  // Get primary image or first image
  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0]

  return (
    <div
      className="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-background flex flex-col h-full"
      onMouseEnter={() => router.prefetch(productUrl)}
    >
      {/* Image */}
      <Link href={productUrl}>
        <div className="aspect-[4/3] relative bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text || product.name}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}

          {/* Badges - Top Left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {product.is_featured && (
              <Badge className="bg-[#0B5394] text-white shadow-md">Featured</Badge>
            )}
            {isOutOfStock && (
              <Badge className="bg-red-600 text-white shadow-md">Out of Stock</Badge>
            )}
            {isComingSoon && (
              <Badge className="bg-purple-600 text-white shadow-md">Coming Soon</Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge className="bg-yellow-500 text-white shadow-md">
                Only {product.inventory_count} Left!
              </Badge>
            )}
          </div>

          {/* Wishlist Button & Discount Badge - Top Right */}
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 items-end">
            <WishlistButton
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.base_price,
                image: primaryImage?.url,
              }}
              size="sm"
            />
            {hasDiscount && (
              <Badge className="bg-[#F78309] text-white shadow-md hover:bg-[#F78309]/90">
                Save {Math.round(((product.compare_at_price! - product.base_price) / product.compare_at_price!) * 100)}%
              </Badge>
            )}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-6 text-center flex flex-col flex-1">
        <Link href={productUrl}>
          <h3 className="font-semibold text-lg mb-2 hover:text-[#F78309] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Short Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
          {product.short_description || '\u00A0'}
        </p>

        {/* Price - Always at bottom */}
        <div className="flex items-baseline justify-center space-x-2 mb-4">
          <span className="text-2xl font-bold text-[#F78309]">
            {formatPrice(product.base_price)}
          </span>
          {hasDiscount && (
            <span className="text-muted-foreground line-through">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>

        {/* Actions - Always at bottom */}
        <div className="flex gap-2 mt-auto">
          <Button asChild className="flex-1 bg-[#0B5394] hover:bg-[#0B5394]/90">
            <Link href={productUrl}>
              View Details
            </Link>
          </Button>
          <Button
            size="icon"
            variant="outline"
            disabled={isOutOfStock || isComingSoon}
            className="hover:bg-[#F78309] hover:text-white hover:border-[#F78309]"
            onClick={() => addItem({
              productId: product.id,
              productName: product.name,
              productSlug: product.slug,
              productImage: primaryImage?.url || null,
              price: product.base_price,
              sku: product.sku,
            })}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
