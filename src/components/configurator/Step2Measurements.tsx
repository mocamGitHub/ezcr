'use client'

import React, { useState, useEffect } from 'react'
import { useConfigurator } from '@/contexts/ConfiguratorContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  validateMeasurements,
  convertMeasurement,
  selectHeightExtension,
} from '@/lib/configurator/utils'
import type { UnitSystem } from '@/types/configurator'
import { MEASUREMENT_RANGES, CONVERSIONS } from '@/types/configurator'

export default function Step2Measurements() {
  const { data, updateStep2, nextStep, prevStep, canProceed } =
    useConfigurator()
  const step2 = data.step2

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validate on change
  useEffect(() => {
    const validation = validateMeasurements(step2)
    setErrors(validation.errors)
  }, [step2])

  const handleUnitToggle = () => {
    const newUnit: UnitSystem =
      step2.unitSystem === 'imperial' ? 'metric' : 'imperial'

    // Convert existing values
    const convertedCargoArea = convertMeasurement(
      step2.cargoArea,
      step2.unitSystem,
      newUnit
    )
    const convertedLength = convertMeasurement(
      step2.totalLength,
      step2.unitSystem,
      newUnit
    )
    const convertedHeight = convertMeasurement(
      step2.height,
      step2.unitSystem,
      newUnit
    )

    updateStep2({
      unitSystem: newUnit,
      cargoArea: Math.round(convertedCargoArea * 100) / 100,
      totalLength: Math.round(convertedLength * 100) / 100,
      height: Math.round(convertedHeight * 100) / 100,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canProceed()) {
      nextStep()
    }
  }

  const unit = step2.unitSystem === 'imperial' ? 'inches' : 'cm'
  const heightInInches =
    step2.unitSystem === 'metric'
      ? step2.height * CONVERSIONS.cmToInches
      : step2.height
  const suggestedExtension = selectHeightExtension(heightInInches)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Measurements</h2>
        <p className="text-gray-600">
          Please provide accurate measurements of your vehicle's cargo area.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Unit Toggle */}
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <span className="font-medium">Measurement Unit</span>
          <button
            type="button"
            onClick={handleUnitToggle}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-orange-500 transition-colors"
          >
            <span
              className={
                step2.unitSystem === 'imperial'
                  ? 'font-bold text-orange-500'
                  : 'text-gray-500'
              }
            >
              Imperial (in)
            </span>
            <span className="text-gray-400">|</span>
            <span
              className={
                step2.unitSystem === 'metric'
                  ? 'font-bold text-orange-500'
                  : 'text-gray-500'
              }
            >
              Metric (cm)
            </span>
          </button>
        </div>

        {/* Measurements */}
        <div className="space-y-6">
          {/* Cargo Area */}
          <div>
            <Label htmlFor="cargo-area">
              Cargo Area Width * ({unit})
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Range: {MEASUREMENT_RANGES.cargoArea.min}" -{' '}
              {MEASUREMENT_RANGES.cargoArea.max}" (
              {(MEASUREMENT_RANGES.cargoArea.min * CONVERSIONS.inchesToCm).toFixed(2)}
              cm - {(MEASUREMENT_RANGES.cargoArea.max * CONVERSIONS.inchesToCm).toFixed(2)}
              cm)
            </p>
            <Input
              id="cargo-area"
              type="number"
              step="0.01"
              value={step2.cargoArea || ''}
              onChange={(e) =>
                updateStep2({ cargoArea: parseFloat(e.target.value) || 0 })
              }
              placeholder={`Enter width in ${unit}`}
              required
              className={errors.cargoArea ? 'border-red-500' : ''}
            />
            {errors.cargoArea && (
              <p className="text-sm text-red-600 mt-1">{errors.cargoArea}</p>
            )}
          </div>

          {/* Total Length */}
          <div>
            <Label htmlFor="total-length">
              Total Vehicle Length * ({unit})
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Range: {MEASUREMENT_RANGES.totalLength.min}" -{' '}
              {MEASUREMENT_RANGES.totalLength.max}" (
              {(MEASUREMENT_RANGES.totalLength.min * CONVERSIONS.inchesToCm).toFixed(2)}
              cm -{' '}
              {(MEASUREMENT_RANGES.totalLength.max * CONVERSIONS.inchesToCm).toFixed(2)}cm)
            </p>
            <Input
              id="total-length"
              type="number"
              step="0.01"
              value={step2.totalLength || ''}
              onChange={(e) =>
                updateStep2({ totalLength: parseFloat(e.target.value) || 0 })
              }
              placeholder={`Enter length in ${unit}`}
              required
              className={errors.totalLength ? 'border-red-500' : ''}
            />
            {errors.totalLength && (
              <p className="text-sm text-red-600 mt-1">{errors.totalLength}</p>
            )}
          </div>

          {/* Height */}
          <div>
            <Label htmlFor="height">
              Cargo Bed Height from Ground * ({unit})
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Range: {MEASUREMENT_RANGES.height.min}" -{' '}
              {MEASUREMENT_RANGES.height.max}" (
              {(MEASUREMENT_RANGES.height.max * CONVERSIONS.inchesToCm).toFixed(2)}cm)
            </p>
            <Input
              id="height"
              type="number"
              step="0.01"
              value={step2.height || ''}
              onChange={(e) =>
                updateStep2({ height: parseFloat(e.target.value) || 0 })
              }
              placeholder={`Enter height in ${unit}`}
              required
              className={errors.height ? 'border-red-500' : ''}
            />
            {errors.height && (
              <p className="text-sm text-red-600 mt-1">{errors.height}</p>
            )}

            {/* Extension suggestion */}
            {suggestedExtension && !errors.height && step2.height > 0 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Recommended Extension:</strong> {suggestedExtension}
                  {suggestedExtension === 'AC001-1' &&
                    ' (35-42" height range)'}
                  {suggestedExtension === 'AC001-2' &&
                    ' (43-51" height range)'}
                  {suggestedExtension === 'AC001-3' &&
                    ' (52-60" height range)'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">
            Measurement Tips
          </h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Measure the cargo area width at the narrowest point</li>
            <li>• Include the tailgate in the total length measurement</li>
            <li>• Measure height from the ground to the cargo bed floor</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={prevStep}
          >
            Back
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={!canProceed()}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Continue to Motorcycle Info
          </Button>
        </div>
      </form>
    </div>
  )
}
