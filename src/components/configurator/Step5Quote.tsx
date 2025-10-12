'use client'

import React, { useState } from 'react'
import { useConfigurator } from '@/contexts/ConfiguratorContext'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/configurator/utils'
import { CheckCircle } from 'lucide-react'

export default function Step5Quote() {
  const { data, prevStep, resetConfigurator, saveConfiguration } =
    useConfigurator()
  const { addToCart } = useCart()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const quote = data.quote
  const step1 = data.step1
  const step2 = data.step2
  const step3 = data.step3
  const step4 = data.step4

  const handleAddToCart = async () => {
    if (!step4.rampModel || !quote) return

    try {
      setIsSaving(true)

      // Save configuration to database
      await saveConfiguration()

      // Add to cart
      addToCart({
        productId: step4.rampModel, // You'll need to map this to actual product ID
        productName: step4.rampModel,
        productSku: step4.rampModel,
        price: quote.total,
        quantity: 1,
        configuration: {
          vehicleType: step1.vehicleType,
          measurements: step2,
          motorcycle: step3,
          extensions: step4.requiredExtensions,
          services: {
            demo: step4.needsDemo,
            installation: step4.needsInstallation,
          },
        },
      })

      // Reset configurator
      resetConfigurator()

      // Redirect to cart
      router.push('/cart')
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add to cart. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleContactSales = () => {
    // TODO: Implement contact sales flow
    window.location.href = `mailto:support@ezcycleramp.com?subject=Custom Quote Request&body=I would like to discuss my ramp configuration.`
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Calculating quote...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Your Custom Quote
        </h2>
        <p className="text-gray-600">
          Review your configuration and pricing details below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Summary */}
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">Configuration Summary</h3>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-gray-600">Vehicle Type</div>
                <div className="font-semibold capitalize">
                  {step1.vehicleType}
                </div>
              </div>

              <div>
                <div className="text-gray-600">Ramp Model</div>
                <div className="font-semibold">{step4.rampModel}</div>
              </div>

              <div>
                <div className="text-gray-600">Measurements</div>
                <div className="font-semibold">
                  Cargo: {step2.cargoArea}
                  {step2.unitSystem === 'imperial' ? '"' : 'cm'} | Height:{' '}
                  {step2.height}
                  {step2.unitSystem === 'imperial' ? '"' : 'cm'}
                </div>
              </div>

              <div>
                <div className="text-gray-600">Motorcycle</div>
                <div className="font-semibold">
                  {step3.motorcycleType} ({step3.motorcycleWeight} lbs)
                </div>
              </div>

              {step4.requiredExtensions.length > 0 && (
                <div>
                  <div className="text-gray-600">Required Extensions</div>
                  <div className="font-semibold">
                    {step4.requiredExtensions.join(', ')}
                  </div>
                </div>
              )}

              {(step4.needsDemo || step4.needsInstallation) && (
                <div>
                  <div className="text-gray-600">Services</div>
                  <div className="font-semibold">
                    {step4.needsDemo && 'Demonstration'}
                    {step4.needsDemo && step4.needsInstallation && ' + '}
                    {step4.needsInstallation && 'Installation'}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">Contact Information</h3>
            <div className="space-y-2 text-sm">
              <div>{step1.contactName}</div>
              <div className="text-gray-600">{step1.contactEmail}</div>
              {step1.contactPhone && (
                <div className="text-gray-600">{step1.contactPhone}</div>
              )}
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div>
          <div className="bg-white border rounded-lg p-6 sticky top-4">
            <h3 className="font-bold text-lg mb-4">Price Breakdown</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Base Ramp</span>
                <span className="font-semibold">
                  {formatPrice(quote.basePrice)}
                </span>
              </div>

              {quote.extensionsPrice > 0 && (
                <div className="flex justify-between">
                  <span>Extensions</span>
                  <span className="font-semibold">
                    {formatPrice(quote.extensionsPrice)}
                  </span>
                </div>
              )}

              {quote.accessoriesPrice > 0 && (
                <div className="flex justify-between">
                  <span>Accessories</span>
                  <span className="font-semibold">
                    {formatPrice(quote.accessoriesPrice)}
                  </span>
                </div>
              )}

              {quote.servicesPrice > 0 && (
                <div className="flex justify-between">
                  <span>Services</span>
                  <span className="font-semibold">
                    {formatPrice(quote.servicesPrice)}
                  </span>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">
                    {formatPrice(quote.subtotal)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <span>Tax (8.9%)</span>
                <span className="font-semibold">{formatPrice(quote.tax)}</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-orange-500">
                    {formatPrice(quote.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                onClick={handleAddToCart}
                disabled={isSaving}
                size="lg"
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isSaving ? 'Adding...' : 'Add to Cart'}
              </Button>

              <Button
                onClick={handleContactSales}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Contact Sales
              </Button>
            </div>

            {quote.subtotal >= 500 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm font-semibold text-green-800">
                  🎉 Free Shipping Included!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-8 mt-8 border-t">
        <Button type="button" variant="outline" size="lg" onClick={prevStep}>
          Back to Configuration
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (confirm('Are you sure you want to start over?')) {
              resetConfigurator()
            }
          }}
        >
          Start Over
        </Button>
      </div>
    </div>
  )
}
