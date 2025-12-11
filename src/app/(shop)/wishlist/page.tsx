// src/app/(shop)/wishlist/page.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChatCTA } from '@/components/chat/ChatCTA'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { Heart, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlist()
  const { addItem } = useCart()

  const handleAddToCart = (item: typeof items[0]) => {
    addItem({
      productId: item.id,
      productName: item.name,
      productSlug: item.slug,
      productImage: item.image || null,
      price: item.price,
      sku: null,
    })
  }

  const handleAddAllToCart = () => {
    items.forEach(item => {
      addItem({
        productId: item.id,
        productName: item.name,
        productSlug: item.slug,
        productImage: item.image || null,
        price: item.price,
        sku: null,
      })
    })
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Heart className="w-10 h-10 fill-white" />
            <h1 className="text-4xl md:text-5xl font-bold">My Wishlist</h1>
          </div>
          <p className="text-xl text-blue-100 mt-4">
            {items.length === 0
              ? 'Save products you love for later'
              : `${items.length} item${items.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>
      </section>

      {/* Wishlist Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <Heart className="w-16 h-16 mx-auto text-gray-300 mb-6" />
              <h2 className="text-2xl font-semibold mb-4">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Start adding products to your wishlist by clicking the heart icon on any product.
              </p>
              <Button asChild size="lg" className="bg-[#0B5394] hover:bg-[#0B5394]/90">
                <Link href="/products">
                  Browse Products
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-8 justify-between items-center">
                <Button
                  onClick={handleAddAllToCart}
                  className="bg-[#F78309] hover:bg-[#F78309]/90"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add All to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={clearWishlist}
                  className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Wishlist
                </Button>
              </div>

              {/* Wishlist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    <Link href={`/products/${item.slug}`}>
                      <div className="aspect-[4/3] relative bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image || 'https://ezcycleramp.com/images/ramp6.webp'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            removeItem(item.id)
                          }}
                          className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          aria-label="Remove from wishlist"
                        >
                          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                        </button>
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/products/${item.slug}`}>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-[#0B5394] transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-2xl font-bold text-[#F78309] mb-4">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAddToCart(item)}
                          className="flex-1 bg-[#0B5394] hover:bg-[#0B5394]/90"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Chat CTA */}
      <section className="py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChatCTA
            variant="card"
            title="Need Help Deciding?"
            description="Tell Charli about your setup and get personalized recommendations."
            buttonText="Ask Charli"
          />
        </div>
      </section>

      {/* Continue Shopping */}
      <section className="py-12 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Continue Shopping</h2>
          <p className="text-muted-foreground mb-6">
            Explore more products or configure your perfect ramp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90">
              <Link href="/products">Browse Products</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/configure-smooth">Configure Ramp</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
