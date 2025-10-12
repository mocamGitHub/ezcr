'use client'

import React from 'react'
import { useConfigurator } from '@/contexts/ConfiguratorContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Step3Motorcycle() {
  const { data, updateStep3, nextStep, prevStep, canProceed } =
    useConfigurator()
  const step3 = data.step3

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canProceed()) {
      nextStep()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Motorcycle Information
        </h2>
        <p className="text-gray-600">
          Tell us about the motorcycle you'll be loading.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="motorcycle-type">Motorcycle Type/Model *</Label>
          <Input
            id="motorcycle-type"
            type="text"
            value={step3.motorcycleType}
            onChange={(e) => updateStep3({ motorcycleType: e.target.value })}
            placeholder="e.g., Harley-Davidson Street Glide"
            required
          />
        </div>

        <div>
          <Label htmlFor="motorcycle-weight">Weight (lbs) *</Label>
          <Input
            id="motorcycle-weight"
            type="number"
            step="0.1"
            value={step3.motorcycleWeight || ''}
            onChange={(e) =>
              updateStep3({ motorcycleWeight: parseFloat(e.target.value) || 0 })
            }
            placeholder="e.g., 800"
            required
          />
        </div>

        <div>
          <Label htmlFor="wheelbase">Wheelbase (inches) *</Label>
          <Input
            id="wheelbase"
            type="number"
            step="0.1"
            value={step3.wheelbase || ''}
            onChange={(e) =>
              updateStep3({ wheelbase: parseFloat(e.target.value) || 0 })
            }
            placeholder="e.g., 64"
            required
          />
        </div>

        <div>
          <Label htmlFor="length">Total Length (inches) *</Label>
          <Input
            id="length"
            type="number"
            step="0.1"
            value={step3.length || ''}
            onChange={(e) =>
              updateStep3({ length: parseFloat(e.target.value) || 0 })
            }
            placeholder="e.g., 96"
            required
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            Need Help Finding Specs?
          </h4>
          <p className="text-sm text-blue-800">
            Check your motorcycle's owner manual or manufacturer website for
            exact specifications.
          </p>
        </div>

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
            Continue to Configuration
          </Button>
        </div>
      </form>
    </div>
  )
}
