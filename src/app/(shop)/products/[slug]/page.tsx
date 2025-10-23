// src/app/(shop)/products/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getProductBySlug, getProducts } from '@/lib/supabase/queries'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/format'
import { ArrowLeft, Check, X } from 'lucide-react'
import { ProductImageGallery } from '@/components/gallery/ProductImageGallery'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

// Disable static generation to allow dynamic cookies()
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: `${product.name} - EZ Cycle Ramp`,
    description: product.meta_description || product.short_description || product.description,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const isOutOfStock = product.inventory_count <= 0
  const isLowStock = product.inventory_count > 0 && product.inventory_count <= 5
  const isComingSoon = product.coming_soon
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price

  // Get product images for gallery
  const productImages = product.product_images || []

  // Get primary image for cart/meta
  const primaryImage = productImages.find(img => img.is_primary) || productImages[0]

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button asChild variant="ghost" className="hover:text-[#0B5394]">
          <Link href="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images - Interactive Gallery */}
        <div className="relative">
          <ProductImageGallery images={productImages} productName={product.name} />

          {/* Status Badges Overlay */}
          <div className="absolute top-4 left-4 space-y-2 z-10 pointer-events-none">
            {product.is_featured && (
              <Badge variant="secondary">Featured</Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
            {isComingSoon && (
              <Badge variant="secondary">Coming Soon</Badge>
            )}
          </div>

          {/* Discount Badge Overlay */}
          {hasDiscount && (
            <div className="absolute top-4 right-4 z-10 pointer-events-none">
              <Badge className="bg-[#F78309] text-white">
                Save {Math.round(((product.compare_at_price! - product.base_price) / product.compare_at_price!) * 100)}%
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

          {/* Price */}
          <div className="flex items-baseline space-x-3 mb-6">
            <span className="text-4xl font-bold text-[#0B5394]">
              {formatPrice(product.base_price)}
            </span>
            {hasDiscount && (
              <span className="text-2xl text-muted-foreground line-through">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {isLowStock && !isOutOfStock && (
            <div className="mb-6">
              <Badge className="bg-yellow-500 text-white">
                Only {product.inventory_count} left in stock!
              </Badge>
            </div>
          )}

          {/* Short Description */}
          {product.short_description && (
            <p className="text-lg text-muted-foreground mb-6">
              {product.short_description}
            </p>
          )}

          {/* Add to Cart */}
          <div className="flex gap-4 mb-8">
            <AddToCartButton
              product={product}
              primaryImage={primaryImage}
              isOutOfStock={isOutOfStock}
              isComingSoon={isComingSoon}
            />
            <Button size="lg" variant="outline" className="hover:bg-[#F78309] hover:text-white">
              Contact Us
            </Button>
          </div>

          {/* Features */}
          <div className="border-t pt-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Key Features</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-[#0B5394] mt-0.5" />
                <span>Free shipping on orders over $500</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-[#0B5394] mt-0.5" />
                <span>30-day money-back guarantee</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-[#0B5394] mt-0.5" />
                <span>Veteran-owned business</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-[#0B5394] mt-0.5" />
                <span>A+ BBB rating</span>
              </li>
            </ul>
          </div>

          {/* Product Details */}
          {product.sku && (
            <div className="text-sm text-muted-foreground">
              SKU: {product.sku}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold mb-4">Description</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground">{product.description}</p>
          </div>
        </div>
      )}
    </div>
  )
}
