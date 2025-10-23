'use client'

import { useCart } from '@/contexts/CartContext'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils/format'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import Lottie from 'lottie-react'
import emptyCartAnimation from '@/animations/empty-cart.json'

export function CartSheet() {
  const { cart, isOpen, closeCart, updateQuantity, removeItem } = useCart()
  const [parent] = useAutoAnimate()

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({cart.totalItems})
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-48 h-48 mb-4">
              <Lottie
                animationData={emptyCartAnimation}
                loop={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-4">
              Add some products to get started!
            </p>
            <Button asChild onClick={closeCart} className="bg-[#0B5394] hover:bg-[#0B5394]/90">
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div ref={parent} className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.productSlug}`}
                        onClick={closeCart}
                        className="font-medium hover:text-[#0B5394] line-clamp-2"
                      >
                        {item.productName}
                      </Link>
                      {item.sku && (
                        <p className="text-xs text-muted-foreground mt-1">
                          SKU: {item.sku}
                        </p>
                      )}
                      <p className="text-sm font-semibold mt-2">
                        {formatPrice(item.price)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-auto text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            <SheetFooter className="flex-col gap-4">
              {/* Cart Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span>
                    {cart.totalPrice >= 500 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      'Calculated at checkout'
                    )}
                  </span>
                </div>
                {cart.totalPrice < 500 && (
                  <p className="text-xs text-muted-foreground">
                    Add {formatPrice(500 - cart.totalPrice)} more for free shipping!
                  </p>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(cart.totalPrice)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90"
                  asChild
                >
                  <Link href="/checkout" onClick={closeCart}>
                    Proceed to Checkout
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={closeCart}
                  asChild
                >
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
