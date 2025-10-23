// src/components/products/ProductCard.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/format'
import type { Product } from '@/lib/supabase/queries'
import { motion } from 'framer-motion'
import { AddToCartButton } from './AddToCartButton'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.inventory_count <= 0
  const isLowStock = product.inventory_count > 0 && product.inventory_count <= 5
  const isComingSoon = product.coming_soon
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price

  // Get primary image or first image
  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-background"
    >
      {/* Image */}
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-square relative bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}

          {/* Badges - Top Left */}
          <div className="absolute top-2 left-2 space-y-2">
            {product.is_featured && (
              <Badge variant="secondary">Featured</Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
            {isComingSoon && (
              <Badge variant="secondary">Coming Soon</Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge className="bg-yellow-500 text-white">
                Only {product.inventory_count} Left!
              </Badge>
            )}
          </div>

          {/* Discount Badge - Top Right */}
          {hasDiscount && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-[#F78309] text-white hover:bg-[#F78309]/90">
                Save {Math.round(((product.compare_at_price! - product.base_price) / product.compare_at_price!) * 100)}%
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-[#F78309] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Short Description */}
        {product.short_description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {product.short_description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline space-x-2 mb-4">
          <span className="text-2xl font-bold text-[#0B5394]">
            {formatPrice(product.base_price)}
          </span>
          {hasDiscount && (
            <span className="text-muted-foreground line-through">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.base_price,
              sku: product.sku,
              images: primaryImage ? [primaryImage.url] : [],
            }}
            variant="default"
            className="w-full"
            showIcon={true}
          />
          <Button asChild variant="outline" className="w-full">
            <Link href={`/products/${product.slug}`}>
              View Details
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
