'use client'

import React, { useState } from 'react'
import { useConfigurator } from './ConfiguratorProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BikeType } from '@/types/configurator-v2'
import { AlertCircle } from 'lucide-react'

const BIKE_TYPES = [
  {
    type: 'sport' as BikeType,
    icon: '🏍️',
    name: 'Sport Bike',
    description: 'CBR, R1, GSX-R',
  },
  {
    type: 'cruiser' as BikeType,
    icon: '🏍️',
    name: 'Cruiser',
    description: 'Harley, Indian',
  },
  {
    type: 'adventure' as BikeType,
    icon: '🏍️',
    name: 'Adventure',
    description: 'GS, Africa Twin',
  },
]

export function Step3Motorcycle() {
  const {
    configData,
    units,
    selectBikeType,
    updateMotorcycle,
    nextStep,
    previousStep,
    canProceedFromStep,
  } = useConfigurator()

  const [showTypeError, setShowTypeError] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const weightUnit = units === 'imperial' ? 'lbs' : 'kg'
  const lengthUnit = units === 'imperial' ? 'inches' : 'cm'

  const validateField = (field: string, value: number, label: string): boolean => {
    if (!value || value <= 0) {
      setErrors((prev) => ({ ...prev, [field]: `Please enter the ${label.toLowerCase()}` }))
      return false
    }
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
    return true
  }

  const handleBikeTypeSelect = (type: BikeType) => {
    selectBikeType(type)
    setShowTypeError(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let isValid = true

    // Validate bike type
    if (!configData.motorcycle.type) {
      setShowTypeError(true)
      isValid = false
    }

    // Validate all fields
    if (!validateField('weight', configData.motorcycle.weight, 'Motorcycle weight')) {
      isValid = false
    }
    if (!validateField('wheelbase', configData.motorcycle.wheelbase, 'Wheelbase measurement')) {
      isValid = false
    }
    if (!validateField('length', configData.motorcycle.length, 'Total length')) {
      isValid = false
    }

    if (!isValid) {
      const errorMessages = [
        showTypeError ? 'Please select a motorcycle type' : '',
        ...Object.values(errors),
      ].filter(Boolean)
      alert(`Please correct the following errors:\n\n${errorMessages.join('\n')}`)
      return
    }

    nextStep()
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Motorcycle Information</h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Tell us about your motorcycle so we can ensure the ramp can safely handle its weight and dimensions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        {/* Motorcycle Type Error Banner */}
        {showTypeError && (
          <div className="bg-destructive/10 border border-destructive rounded-xl p-4 flex gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Motorcycle Type Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please select a motorcycle type to continue
              </p>
            </div>
          </div>
        )}

        {/* Motorcycle Type Selection */}
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Select Motorcycle Type <span className="text-destructive">*</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BIKE_TYPES.map((bike) => (
              <button
                key={bike.type}
                type="button"
                onClick={() => handleBikeTypeSelect(bike.type)}
                className={`
                  group relative p-6 rounded-xl border-2 transition-all duration-300
                  hover:shadow-lg hover:-translate-y-1
                  ${
                    configData.motorcycle.type === bike.type
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-border bg-card hover:border-primary/50'
                  }
                `}
              >
                <div className="text-center">
                  <div className="text-5xl mb-3">{bike.icon}</div>
                  <h4 className="text-lg font-semibold mb-1">{bike.name}</h4>
                  <p className="text-sm text-muted-foreground">{bike.description}</p>
                </div>

                {configData.motorcycle.type === bike.type && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Motorcycle Details */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-xl font-semibold mb-6">Motorcycle Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Weight */}
            <div>
              <Label htmlFor="weight">
                Weight ({weightUnit}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder={`e.g., ${units === 'imperial' ? '500' : '226.8'}`}
                value={configData.motorcycle.weight || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  updateMotorcycle({ weight: value })
                  if (value > 0) validateField('weight', value, 'Motorcycle weight')
                }}
                onBlur={() => validateField('weight', configData.motorcycle.weight, 'Motorcycle weight')}
                className={`mt-1.5 ${errors.weight ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {errors.weight && (
                <p className="text-sm text-destructive mt-1.5 flex items-center gap-1 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.weight}
                </p>
              )}
            </div>

            {/* Wheelbase */}
            <div>
              <Label htmlFor="wheelbase">
                Wheelbase ({lengthUnit}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wheelbase"
                type="number"
                step="0.1"
                placeholder={`e.g., ${units === 'imperial' ? '58.0' : '147.32'}`}
                value={configData.motorcycle.wheelbase || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  updateMotorcycle({ wheelbase: value })
                  if (value > 0) validateField('wheelbase', value, 'Wheelbase measurement')
                }}
                onBlur={() => validateField('wheelbase', configData.motorcycle.wheelbase, 'Wheelbase measurement')}
                className={`mt-1.5 ${errors.wheelbase ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {errors.wheelbase && (
                <p className="text-sm text-destructive mt-1.5 flex items-center gap-1 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.wheelbase}
                </p>
              )}
            </div>

            {/* Total Length */}
            <div>
              <Label htmlFor="length">
                Total Length ({lengthUnit}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                placeholder={`e.g., ${units === 'imperial' ? '82.0' : '208.28'}`}
                value={configData.motorcycle.length || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  updateMotorcycle({ length: value })
                  if (value > 0) validateField('length', value, 'Total length')
                }}
                onBlur={() => validateField('length', configData.motorcycle.length, 'Total length')}
                className={`mt-1.5 ${errors.length ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {errors.length && (
                <p className="text-sm text-destructive mt-1.5 flex items-center gap-1 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.length}
                </p>
              )}
            </div>
          </div>
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
            className="rounded-full bg-primary hover:bg-primary-dark px-8"
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  )
}
