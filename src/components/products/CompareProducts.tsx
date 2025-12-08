'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChatCTA } from '@/components/chat/ChatCTA'
import { Check, X, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { formatPrice } from '@/lib/utils/format'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  base_price: number
  images?: { url: string; alt_text: string | null }[]
  specifications?: Record<string, string | number | boolean>
}

interface CompareProductsProps {
  products: Product[]
}

// Default specifications for comparison if not in database
const defaultSpecs: Record<string, Record<string, string | number | boolean>> = {
  'AUN250': {
    'Weight Capacity': '1,500 lbs',
    'Ramp Length': '10 ft',
    'Folding': true,
    'Material': 'Aircraft-grade Aluminum',
    'Surface': 'Non-slip textured',
    'Adjustable Height': true,
    'Weight': '65 lbs',
    'Warranty': '2 Years',
  },
  'AUN210': {
    'Weight Capacity': '1,500 lbs',
    'Ramp Length': '9 ft',
    'Folding': false,
    'Material': 'Aircraft-grade Aluminum',
    'Surface': 'Non-slip textured',
    'Adjustable Height': true,
    'Weight': '55 lbs',
    'Warranty': '2 Years',
  },
  'AUN200': {
    'Weight Capacity': '1,200 lbs',
    'Ramp Length': '8 ft',
    'Folding': false,
    'Material': 'Heavy-duty Aluminum',
    'Surface': 'Non-slip textured',
    'Adjustable Height': false,
    'Weight': '45 lbs',
    'Warranty': '1 Year',
  },
}

export function CompareProducts({ products }: CompareProductsProps) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const { addItem } = useCart()
  const maxComparison = 3

  const getSpecsForProduct = (product: Product): Record<string, string | number | boolean> => {
    // Try to find matching default specs by product name
    for (const key of Object.keys(defaultSpecs)) {
      if (product.name.includes(key)) {
        return defaultSpecs[key]
      }
    }
    return product.specifications || {}
  }

  const addToComparison = (product: Product) => {
    if (selectedProducts.length < maxComparison && !selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product])
    }
  }

  const removeFromComparison = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId))
  }

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.base_price,
      quantity: 1,
      image: product.images?.[0]?.url,
    })
  }

  // Get all unique spec keys from selected products
  const allSpecKeys = selectedProducts.length > 0
    ? [...new Set(selectedProducts.flatMap(p => Object.keys(getSpecsForProduct(p))))]
    : []

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Compare Ramps</h1>
          <p className="text-xl text-blue-100">
            Select up to {maxComparison} ramps to compare features and specifications
          </p>
        </div>
      </section>

      {/* Product Selection */}
      <section className="py-8 bg-muted/50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold mb-4">Select Products to Compare</h2>
          <div className="flex flex-wrap gap-3">
            {products.map((product) => {
              const isSelected = selectedProducts.some(p => p.id === product.id)
              return (
                <button
                  key={product.id}
                  onClick={() => isSelected ? removeFromComparison(product.id) : addToComparison(product)}
                  disabled={!isSelected && selectedProducts.length >= maxComparison}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#0B5394] text-white'
                      : selectedProducts.length >= maxComparison
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 border hover:border-[#0B5394] hover:text-[#0B5394]'
                  }`}
                >
                  {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {product.name}
                </button>
              )
            })}
          </div>
          {selectedProducts.length === 0 && (
            <p className="text-muted-foreground mt-4 text-sm">
              Click on products above to add them to comparison
            </p>
          )}
        </div>
      </section>

      {/* Comparison Table */}
      {selectedProducts.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                {/* Product Headers */}
                <thead>
                  <tr>
                    <th className="p-4 text-left bg-muted/50 border-b font-semibold min-w-[150px]">
                      Feature
                    </th>
                    {selectedProducts.map((product) => (
                      <th key={product.id} className="p-4 text-center bg-muted/50 border-b min-w-[200px]">
                        <div className="relative">
                          <button
                            onClick={() => removeFromComparison(product.id)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            aria-label={`Remove ${product.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="aspect-[4/3] mb-3 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.images?.[0]?.url || 'https://ezcycleramp.com/images/ramp6.webp'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Link
                            href={`/products/${product.slug}`}
                            className="font-semibold hover:text-[#0B5394] transition-colors"
                          >
                            {product.name}
                          </Link>
                          <p className="text-2xl font-bold text-[#F78309] mt-2">
                            {formatPrice(product.base_price)}
                          </p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Specifications */}
                <tbody>
                  {allSpecKeys.map((specKey, index) => (
                    <tr key={specKey} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="p-4 font-medium border-b">{specKey}</td>
                      {selectedProducts.map((product) => {
                        const specs = getSpecsForProduct(product)
                        const value = specs[specKey]
                        return (
                          <td key={product.id} className="p-4 text-center border-b">
                            {typeof value === 'boolean' ? (
                              value ? (
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-red-400 mx-auto" />
                              )
                            ) : value !== undefined ? (
                              <span>{String(value)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  {/* Add to Cart Row */}
                  <tr className="bg-muted/50">
                    <td className="p-4 font-medium border-t"></td>
                    {selectedProducts.map((product) => (
                      <td key={product.id} className="p-4 text-center border-t">
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="bg-[#F78309] hover:bg-[#F78309]/90 text-white"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {selectedProducts.length === 0 && (
        <section className="py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-muted/30 rounded-xl p-12">
              <h2 className="text-2xl font-semibold mb-4">Select Products to Compare</h2>
              <p className="text-muted-foreground mb-6">
                Choose up to {maxComparison} products from the list above to see a side-by-side comparison
                of features, specifications, and pricing.
              </p>
              <Link href="/products">
                <Button className="bg-[#0B5394] hover:bg-[#0B5394]/90">
                  Browse All Products
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Chat CTA */}
      <section className="py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChatCTA
            variant="card"
            title="Not Sure Which Ramp to Choose?"
            description="Tell Charli about your truck and motorcycle, and get a personalized recommendation."
            buttonText="Ask Charli"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Help Deciding?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Use our configurator to find the perfect ramp for your specific setup.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90">
              <Link href="/configure-smooth">Configure Your Ramp</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
