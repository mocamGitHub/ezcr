'use client'

import React from 'react'
import { useConfigurator } from '@/contexts/ConfiguratorContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { RampModel } from '@/types/configurator'
import { PRODUCT_PRICES } from '@/types/configurator'
import { formatPrice } from '@/lib/configurator/utils'

const RAMP_MODELS: {
  value: RampModel
  label: string
  price: number
  description: string
}[] = [
  {
    value: 'AUN250',
    label: 'AUN250 Folding Ramp',
    price: PRODUCT_PRICES.AUN250,
    description: 'Premium folding ramp with enhanced features',
  },
  {
    value: 'AUN210',
    label: 'AUN210 Standard Ramp',
    price: PRODUCT_PRICES.AUN210,
    description: 'Standard model with proven reliability',
  },
  {
    value: 'AUN200',
    label: 'AUN200 Basic Ramp',
    price: PRODUCT_PRICES.AUN200,
    description: 'Budget-friendly option without compromising quality',
  },
  {
    value: 'AUN150',
    label: 'AUN150 Hybrid Ramp',
    price: PRODUCT_PRICES.AUN150,
    description: 'Coming March 1, 2025 - Hybrid design',
  },
]

export default function Step4Configuration() {
  const { data, updateStep4, nextStep, prevStep, canProceed } =
    useConfigurator()
  const step4 = data.step4

  const handleModelSelect = (model: RampModel) => {
    updateStep4({ rampModel: model })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canProceed()) {
      nextStep()
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Select Your Configuration
        </h2>
        <p className="text-gray-600">
          Choose your ramp model and any additional services.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Ramp Model Selection */}
        <div>
          <Label className="text-lg font-semibold mb-4 block">
            Choose Ramp Model *
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RAMP_MODELS.map((ramp) => (
              <button
                key={ramp.value}
                type="button"
                onClick={() => handleModelSelect(ramp.value)}
                disabled={ramp.value === 'AUN150'}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  step4.rampModel === ramp.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${ramp.value === 'AUN150' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-bold text-lg mb-1">{ramp.label}</div>
                <div className="text-2xl font-bold text-orange-500 mb-2">
                  {formatPrice(ramp.price)}
                </div>
                <div className="text-sm text-gray-600">{ramp.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Auto-Selected Extensions */}
        {step4.requiredExtensions.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              Required Extensions (Auto-Selected)
            </h4>
            <ul className="space-y-1">
              {step4.requiredExtensions.map((ext) => (
                <li key={ext} className="text-sm text-green-800">
                  • {ext} - {formatPrice(PRODUCT_PRICES[ext])}
                </li>
              ))}
            </ul>
            <p className="text-xs text-green-700 mt-2">
              These extensions are automatically included based on your
              measurements.
            </p>
          </div>
        )}

        {/* Additional Services */}
        <div>
          <Label className="text-lg font-semibold mb-4 block">
            Additional Services
          </Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="demo"
                checked={step4.needsDemo}
                onCheckedChange={(checked) =>
                  updateStep4({ needsDemo: checked as boolean })
                }
              />
              <Label htmlFor="demo" className="flex-1 cursor-pointer">
                <div className="font-semibold">Product Demonstration</div>
                <div className="text-sm text-gray-600">
                  On-site demo with product specialist (+$50)
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="installation"
                checked={step4.needsInstallation}
                onCheckedChange={(checked) =>
                  updateStep4({ needsInstallation: checked as boolean })
                }
              />
              <Label htmlFor="installation" className="flex-1 cursor-pointer">
                <div className="font-semibold">Professional Installation</div>
                <div className="text-sm text-gray-600">
                  Expert installation service (+$150)
                </div>
              </Label>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button type="button" variant="outline" size="lg" onClick={prevStep}>
            Back
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={!canProceed()}
            className="bg-orange-500 hover:bg-orange-600"
          >
            View Quote
          </Button>
        </div>
      </form>
    </div>
  )
}
