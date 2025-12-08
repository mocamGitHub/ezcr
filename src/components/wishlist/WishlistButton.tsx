'use client'

import { Heart } from 'lucide-react'
import { useWishlist } from '@/contexts/WishlistContext'
import { cn } from '@/lib/utils'

interface WishlistButtonProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    image?: string
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function WishlistButton({ product, className, size = 'md' }: WishlistButtonProps) {
  const { addItem, removeItem, isInWishlist } = useWishlist()
  const inWishlist = isInWishlist(product.id)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (inWishlist) {
      removeItem(product.id)
    } else {
      addItem(product)
    }
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center justify-center rounded-full transition-all',
        'bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800',
        'shadow-sm hover:shadow-md',
        sizeClasses[size],
        className
      )}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn(
          iconSizes[size],
          'transition-colors',
          inWishlist
            ? 'fill-red-500 text-red-500'
            : 'text-gray-500 hover:text-red-500'
        )}
      />
    </button>
  )
}
