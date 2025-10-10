'use client'

import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import type { Product, ProductImage } from '@/lib/supabase/queries'

interface AddToCartButtonProps {
  product: Product
  primaryImage: ProductImage | undefined
  isOutOfStock: boolean
  isComingSoon: boolean
}

export function AddToCartButton({ product, primaryImage, isOutOfStock, isComingSoon }: AddToCartButtonProps) {
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: primaryImage?.url || null,
      price: product.base_price,
      sku: product.sku,
    })
  }

  return (
    <Button
      size="lg"
      className="flex-1 bg-[#0B5394] hover:bg-[#0B5394]/90"
      disabled={isOutOfStock || isComingSoon}
      onClick={handleAddToCart}
    >
      <ShoppingCart className="h-5 w-5 mr-2" />
      {isOutOfStock ? 'Out of Stock' : isComingSoon ? 'Coming Soon' : 'Add to Cart'}
    </Button>
  )
}
