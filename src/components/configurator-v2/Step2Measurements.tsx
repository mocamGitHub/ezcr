'use client'

import React, { useState } from 'react'
import { useConfigurator } from './ConfiguratorProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MEASUREMENT_RANGES, CONTACT } from '@/types/configurator-v2'
import { AlertCircle, Info } from 'lucide-react'

export function Step2Measurements() {
  const {
    configData,
    units,
    updateMeasurements,
    nextStep,
    previousStep,
    convertToInches,
    calculateAC001Extension,
    checkCargoExtension,
  } = useConfigurator()

  const [bedLengthClosed, setBedLengthClosed] = useState(configData.measurements.bedLengthClosed || 0)
  const [bedLengthOpen, setBedLengthOpen] = useState(configData.measurements.bedLengthOpen || 0)
  const [cargoLength, setCargoLength] = useState(configData.measurements.cargoLength || 0)
  const [loadHeight, setLoadHeight] = useState(configData.measurements.loadHeight || 0)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showHeightWarning, setShowHeightWarning] = useState(false)
  const [showCargoWarning, setShowCargoWarning] = useState(false)
  const [requiredExtension, setRequiredExtension] = useState<string | null>(null)

  const isPickup = configData.vehicle === 'pickup'
  const unitLabel = units === 'imperial' ? 'inches' : 'cm'

  // Convert ranges to current units for display
  const getRange = (minInches: number, maxInches: number) => {
    if (units === 'metric') {
      return {
        min: (minInches * 2.54).toFixed(2),
        max: (maxInches * 2.54).toFixed(2),
      }
    }
    return {
      min: minInches.toFixed(3),
      max: maxInches.toFixed(3),
    }
  }

  // Validate measurement
  const validateMeasurement = (
    value: number,
    minInches: number,
    maxInches: number,
    fieldName: string,
    label: string
  ): boolean => {
    const valueInInches = convertToInches(value)

    if (!value || value <= 0) {
      setErrors((prev) => ({ ...prev, [fieldName]: `Please enter the ${label.toLowerCase()}` }))
      return false
    }

    if (valueInInches < minInches || valueInInches > maxInches) {
      const range = getRange(minInches, maxInches)
      setErrors((prev) => ({
        ...prev,
        [fieldName]: `Please enter a valid ${label.toLowerCase()} (${range.min}-${range.max} ${unitLabel})`,
      }))
      return false
    }

    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
    return true
  }

  // Validate height and check for AC001 extension
  const validateHeight = (value: number): boolean => {
    const valueInInches = convertToInches(value)
    const range = getRange(0, MEASUREMENT_RANGES.heightMax)

    if (!value || value <= 0) {
      setErrors((prev) => ({ ...prev, loadHeight: 'Please enter the height from ground' }))
      setShowHeightWarning(false)
      return false
    }

    if (valueInInches > MEASUREMENT_RANGES.heightMax) {
      setErrors((prev) => ({
        ...prev,
        loadHeight: `Please enter a valid height (max: ${range.max} ${unitLabel})`,
      }))
      setShowHeightWarning(false)
      return false
    }

    // Check for AC001 extension requirement
    const extension = calculateAC001Extension(valueInInches)
    if (extension) {
      setShowHeightWarning(true)
      setRequiredExtension(extension)
    } else {
      setShowHeightWarning(false)
      setRequiredExtension(null)
    }

    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.loadHeight
      return newErrors
    })
    return true
  }

  // Check cargo extension requirement
  const checkCargo = (value: number) => {
    const valueInInches = convertToInches(value)
    if (valueInInches > MEASUREMENT_RANGES.cargoExtensionThreshold) {
      setShowCargoWarning(true)
    } else {
      setShowCargoWarning(false)
    }
  }

  // Handle input changes
  const handleBedLengthClosedChange = (value: string) => {
    const num = parseFloat(value) || 0
    setBedLengthClosed(num)
    if (num > 0) {
      validateMeasurement(
        num,
        MEASUREMENT_RANGES.cargoMin,
        MEASUREMENT_RANGES.cargoMax,
        'bedLengthClosed',
        'Cargo area'
      )
      checkCargo(num)
    }
  }

  const handleBedLengthOpenChange = (value: string) => {
    const num = parseFloat(value) || 0
    setBedLengthOpen(num)
    if (num > 0) {
      validateMeasurement(
        num,
        MEASUREMENT_RANGES.totalLengthMin,
        MEASUREMENT_RANGES.totalLengthMax,
        'bedLengthOpen',
        'Total length'
      )
    }
  }

  const handleCargoLengthChange = (value: string) => {
    const num = parseFloat(value) || 0
    setCargoLength(num)
    if (num > 0) {
      validateMeasurement(
        num,
        MEASUREMENT_RANGES.cargoMin,
        MEASUREMENT_RANGES.cargoMax,
        'cargoLength',
        'Cargo area'
      )
      checkCargo(num)
    }
  }

  const handleLoadHeightChange = (value: string) => {
    const num = parseFloat(value) || 0
    setLoadHeight(num)
    if (num > 0) {
      validateHeight(num)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let isValid = true

    if (isPickup) {
      if (!validateMeasurement(
        bedLengthClosed,
        MEASUREMENT_RANGES.cargoMin,
        MEASUREMENT_RANGES.cargoMax,
        'bedLengthClosed',
        'Cargo area'
      )) {
        isValid = false
      }

      if (!validateMeasurement(
        bedLengthOpen,
        MEASUREMENT_RANGES.totalLengthMin,
        MEASUREMENT_RANGES.totalLengthMax,
        'bedLengthOpen',
        'Total length'
      )) {
        isValid = false
      }
    } else {
      if (!validateMeasurement(
        cargoLength,
        MEASUREMENT_RANGES.cargoMin,
        MEASUREMENT_RANGES.cargoMax,
        'cargoLength',
        'Cargo area'
      )) {
        isValid = false
      }
    }

    if (!validateHeight(loadHeight)) {
      isValid = false
    }

    if (!isValid) {
      const errorMessages = Object.values(errors).join('\n')
      alert(`Please correct the following errors:\n\n${errorMessages}`)
      return
    }

    // Save measurements
    const heightInInches = convertToInches(loadHeight)
    const extension = calculateAC001Extension(heightInInches)
    const cargoInInches = isPickup ? convertToInches(bedLengthClosed) : convertToInches(cargoLength)
    const needsCargoExtension = checkCargoExtension(cargoInInches)

    updateMeasurements({
      bedLengthClosed: isPickup ? bedLengthClosed : undefined,
      bedLengthOpen: isPickup ? bedLengthOpen : undefined,
      cargoLength: isPickup ? undefined : cargoLength,
      loadHeight,
      requiredAC001: extension,
      requiresCargoExtension: needsCargoExtension,
    })

    nextStep()
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium text-muted-foreground mb-6">
          Accurate measurements ensure your ramp fits <span className="text-[hsl(var(--secondary))] font-semibold">perfectly</span>
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8">
        {/* Measurement Guide (for Pickup) */}
        {isPickup && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">How to Measure Your <span className="text-[hsl(var(--primary))]">Pickup Truck</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-8 bg-black/40 rounded-xl border border-[hsl(var(--primary)/30%)]">
                <div className="text-6xl mb-4">📏</div>
                <p className="text-base font-semibold mb-2">Measure from bulkhead to end of closed tailgate</p>
              </div>
              <div className="text-center p-8 bg-black/40 rounded-xl border border-[hsl(var(--primary)/30%)]">
                <div className="text-6xl mb-4">📐</div>
                <p className="text-base font-semibold mb-2">Measure from bulkhead to end of open tailgate</p>
              </div>
              <div className="text-center p-8 bg-black/40 rounded-xl border border-[hsl(var(--primary)/30%)]">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-base font-semibold mb-2">Measure ground to top of open tailgate</p>
              </div>
            </div>
          </div>
        )}

        {/* Measurement Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isPickup ? (
            <>
              {/* Bed Length Closed */}
              <div>
                <Label htmlFor="bedLengthClosed">
                  Cargo Area (closed tailgate) ({unitLabel}) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="bedLengthClosed"
                  type="number"
                  step="0.01"
                  placeholder={`Min: ${getRange(MEASUREMENT_RANGES.cargoMin, MEASUREMENT_RANGES.cargoMax).min}, Max: ${getRange(MEASUREMENT_RANGES.cargoMin, MEASUREMENT_RANGES.cargoMax).max}`}
                  value={bedLengthClosed || ''}
                  onChange={(e) => handleBedLengthClosedChange(e.target.value)}
                  className={`mt-1.5 ${errors.bedLengthClosed ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {errors.bedLengthClosed && (
                  <p className="text-sm text-destructive mt-1.5 flex items-center gap-1 animate-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.bedLengthClosed}
                  </p>
                )}
              </div>

              {/* Bed Length Open */}
              <div>
                <Label htmlFor="bedLengthOpen">
                  Total Length (open tailgate) ({unitLabel}) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="bedLengthOpen"
                  type="number"
                  step="0.01"
                  placeholder={`Min: ${getRange(MEASUREMENT_RANGES.totalLengthMin, MEASUREMENT_RANGES.totalLengthMax).min}, Max: ${getRange(MEASUREMENT_RANGES.totalLengthMin, MEASUREMENT_RANGES.totalLengthMax).max}`}
                  value={bedLengthOpen || ''}
                  onChange={(e) => handleBedLengthOpenChange(e.target.value)}
                  className={`mt-1.5 ${errors.bedLengthOpen ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {errors.bedLengthOpen && (
                  <p className="text-sm text-destructive mt-1.5 flex items-center gap-1 animate-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.bedLengthOpen}
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Cargo Length for Van/Trailer */
            <div>
              <Label htmlFor="cargoLength">
                Cargo Area Length ({unitLabel}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cargoLength"
                type="number"
                step="0.01"
                placeholder={`Min: ${getRange(MEASUREMENT_RANGES.cargoMin, MEASUREMENT_RANGES.cargoMax).min}, Max: ${getRange(MEASUREMENT_RANGES.cargoMin, MEASUREMENT_RANGES.cargoMax).max}`}
                value={cargoLength || ''}
                onChange={(e) => handleCargoLengthChange(e.target.value)}
                className={`mt-1.5 ${errors.cargoLength ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {errors.cargoLength && (
                <p className="text-sm text-destructive mt-1.5 flex items-center gap-1 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.cargoLength}
                </p>
              )}
            </div>
          )}

          {/* Load Height */}
          <div>
            <Label htmlFor="loadHeight">
              Height from Ground ({unitLabel}) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="loadHeight"
              type="number"
              step="0.01"
              placeholder={`Max: ${getRange(0, MEASUREMENT_RANGES.heightMax).max}`}
              value={loadHeight || ''}
              onChange={(e) => handleLoadHeightChange(e.target.value)}
              className={`mt-1.5 ${errors.loadHeight ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {errors.loadHeight && (
              <p className="text-sm text-destructive mt-1.5 flex items-center gap-1 animate-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4" />
                {errors.loadHeight}
              </p>
            )}
          </div>
        </div>

        {/* Height Warning */}
        {showHeightWarning && requiredExtension && (
          <div className="bg-secondary/10 border border-secondary rounded-xl p-4 flex gap-3 animate-in slide-in-from-top-2">
            <Info className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-secondary">Extension Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                Based on your height measurement, you will need the <strong>{requiredExtension} Extension</strong>.
                This will be automatically included in your configuration.
              </p>
            </div>
          </div>
        )}

        {/* Cargo Warning */}
        {showCargoWarning && (
          <div className="bg-secondary/10 border border-secondary rounded-xl p-4 flex gap-3 animate-in slide-in-from-top-2">
            <Info className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-secondary">Special Extension Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your cargo area exceeds 80 inches. A special cargo extension will be automatically included based
                on your selected ramp model.
              </p>
            </div>
          </div>
        )}

        {/* Out of Range Help */}
        <div className="text-center text-sm text-muted-foreground">
          Have measurements outside these ranges?{' '}
          <a href={`tel:${CONTACT.phone}`} className="text-primary hover:underline font-medium">
            Call us at {CONTACT.phone}
          </a>{' '}
          to discuss your specific situation.
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6">
          <Button
            type="button"
            onClick={previousStep}
            variant="outline"
            className="rounded-full"
          >
            Previous
          </Button>

          <Button
            type="submit"
            className="rounded-full px-8"
            style={{ backgroundColor: 'hsl(203 79% 57%)' }}
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  )
}
