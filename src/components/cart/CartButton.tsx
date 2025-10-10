'use client'

import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'

export function CartButton() {
  const { cart, openCart } = useCart()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label="Shopping cart"
      onClick={openCart}
    >
      <ShoppingCart className="h-5 w-5" />
      {cart.totalItems > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#F78309] text-white text-xs flex items-center justify-center">
          {cart.totalItems > 9 ? '9+' : cart.totalItems}
        </span>
      )}
    </Button>
  )
}
