'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import type { Product } from '@/lib/supabase/queries'

interface AddToCartButtonProps {
  product: Product
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  successDuration?: number
}

export function AddToCartButton({
  product,
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  successDuration = 2000,
}: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAddToCart = async () => {
    // Prevent double-clicks
    if (isAdding || showSuccess) return

    setIsAdding(true)

    // Add item to cart
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images?.[0] || '',
      price: product.price,
      quantity: 1,
      sku: product.sku || undefined,
    })

    // Simulate slight delay for animation
    await new Promise((resolve) => setTimeout(resolve, 300))

    setIsAdding(false)
    setShowSuccess(true)

    // Hide success state after duration
    setTimeout(() => {
      setShowSuccess(false)
    }, successDuration)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCart}
      disabled={isAdding || showSuccess}
      className={`relative overflow-hidden ${className} ${
        variant === 'default' ? 'bg-[#0B5394] hover:bg-[#0B5394]/90' : ''
      }`}
      asChild={false}
    >
      <motion.div
        className="flex items-center justify-center gap-2"
        initial={false}
        animate={{
          scale: isAdding ? 0.95 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Success Background Animation */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="absolute inset-0 bg-green-500"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </AnimatePresence>

        {/* Icon Animation */}
        <AnimatePresence mode="wait">
          {showIcon && (
            <motion.span
              key={showSuccess ? 'check' : 'cart'}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
              className="relative z-10"
            >
              {showSuccess ? (
                <Check className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Text Animation */}
        <AnimatePresence mode="wait">
          <motion.span
            key={showSuccess ? 'added' : isAdding ? 'adding' : 'add'}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            {showSuccess ? 'Added!' : isAdding ? 'Adding...' : 'Add to Cart'}
          </motion.span>
        </AnimatePresence>

        {/* Ripple Effect on Click */}
        <AnimatePresence>
          {isAdding && (
            <motion.span
              className="absolute inset-0 bg-white/20 rounded-md"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </Button>
  )
}
