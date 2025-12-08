'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/contexts/WishlistContext'

export function WishlistHeaderButton() {
  const { itemCount } = useWishlist()

  return (
    <Link href="/wishlist" className="hidden sm:block">
      <Button variant="ghost" size="icon" aria-label="Wishlist" className="relative">
        <Heart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-[#F78309] text-white text-xs font-bold rounded-full">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </Button>
    </Link>
  )
}
