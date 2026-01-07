'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Cart, CartItem } from '@/lib/types/cart'
import { trackEcommerceEvent } from '@/components/analytics/GoogleAnalytics'
import { trackMetaEvent } from '@/components/analytics/MetaPixel'

interface CartContextType {
  cart: Cart
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'ezcr-cart'

function calculateTotals(items: CartItem[]): { totalItems: number; totalPrice: number } {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return { totalItems, totalPrice }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setItems(parsed)
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isHydrated])

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.productId === newItem.productId)

      if (existingIndex >= 0) {
        // Item exists, increment quantity
        const updated = [...current]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        }
        return updated
      } else {
        // New item
        return [...current, { ...newItem, quantity: 1 }]
      }
    })
    setIsOpen(true)

    // Track add to cart event
    trackEcommerceEvent('add_to_cart', {
      currency: 'USD',
      value: newItem.price,
      items: [{
        item_id: newItem.sku || newItem.productId,
        item_name: newItem.productName,
        price: newItem.price,
        quantity: 1,
      }],
    })
    trackMetaEvent('AddToCart', {
      content_ids: [newItem.sku || newItem.productId],
      content_name: newItem.productName,
      content_type: 'product',
      currency: 'USD',
      value: newItem.price,
    })
  }

  const removeItem = (productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  const { totalItems, totalPrice } = calculateTotals(items)

  const cart: Cart = {
    items,
    totalItems,
    totalPrice,
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
