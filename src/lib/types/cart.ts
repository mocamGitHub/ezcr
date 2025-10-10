// src/lib/types/cart.ts

export interface CartItem {
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  price: number
  quantity: number
  sku: string | null
}

export interface Cart {
  items: CartItem[]
  totalItems: number
  totalPrice: number
}
