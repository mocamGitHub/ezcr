'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type {
  ConfiguratorData,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  QuoteData,
  RampModel,
} from '@/types/configurator'
import {
  getRequiredExtensions,
  calculatePrice,
  validateMeasurements,
} from '@/lib/configurator/utils'

interface ConfiguratorContextType {
  data: ConfiguratorData
  updateStep1: (data: Partial<Step1Data>) => void
  updateStep2: (data: Partial<Step2Data>) => void
  updateStep3: (data: Partial<Step3Data>) => void
  updateStep4: (data: Partial<Step4Data>) => void
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  canProceed: () => boolean
  resetConfigurator: () => void
  saveConfiguration: () => Promise<void>
}

const ConfiguratorContext = createContext<ConfiguratorContextType | undefined>(
  undefined
)

const INITIAL_DATA: ConfiguratorData = {
  step1: {
    vehicleType: null,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    smsOptIn: true,
  },
  step2: {
    cargoArea: 0,
    totalLength: 0,
    height: 0,
    unitSystem: 'imperial',
  },
  step3: {
    motorcycleType: '',
    motorcycleWeight: 0,
    wheelbase: 0,
    length: 0,
  },
  step4: {
    rampModel: null,
    requiredExtensions: [],
    additionalAccessories: [],
    needsDemo: false,
    needsInstallation: false,
  },
  quote: null,
  currentStep: 1,
  isComplete: false,
}

export function ConfiguratorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [data, setData] = useState<ConfiguratorData>(INITIAL_DATA)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ezcr-configurator')
    if (saved) {
      try {
        setData(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load configurator data:', error)
      }
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('ezcr-configurator', JSON.stringify(data))
  }, [data])

  const updateStep1 = (updates: Partial<Step1Data>) => {
    setData((prev) => ({
      ...prev,
      step1: { ...prev.step1, ...updates },
    }))
  }

  const updateStep2 = (updates: Partial<Step2Data>) => {
    setData((prev) => ({
      ...prev,
      step2: { ...prev.step2, ...updates },
    }))
  }

  const updateStep3 = (updates: Partial<Step3Data>) => {
    setData((prev) => ({
      ...prev,
      step3: { ...prev.step3, ...updates },
    }))
  }

  const updateStep4 = (updates: Partial<Step4Data>) => {
    setData((prev) => {
      const newStep4 = { ...prev.step4, ...updates }

      // Auto-calculate required extensions when model changes
      if (updates.rampModel && prev.step4.rampModel !== updates.rampModel) {
        const requiredExtensions = getRequiredExtensions(
          prev.step2,
          updates.rampModel
        )
        newStep4.requiredExtensions = requiredExtensions
      }

      // Calculate quote
      const priceBreakdown = calculatePrice(newStep4)
      const quote: QuoteData = {
        basePrice: priceBreakdown.basePrice,
        extensionsPrice: priceBreakdown.extensionsPrice,
        accessoriesPrice: priceBreakdown.accessoriesPrice,
        servicesPrice: priceBreakdown.servicesPrice,
        subtotal: priceBreakdown.subtotal,
        tax: priceBreakdown.tax,
        total: priceBreakdown.total,
      }

      return {
        ...prev,
        step4: newStep4,
        quote,
      }
    })
  }

  const setCurrentStep = (step: number) => {
    setData((prev) => ({ ...prev, currentStep: step }))
  }

  const nextStep = () => {
    setData((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 5),
    }))
  }

  const prevStep = () => {
    setData((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }))
  }

  const canProceed = (): boolean => {
    switch (data.currentStep) {
      case 1:
        return !!(
          data.step1.vehicleType &&
          data.step1.contactName &&
          data.step1.contactEmail
        )
      case 2:
        const validation = validateMeasurements(data.step2)
        return validation.isValid
      case 3:
        return !!(
          data.step3.motorcycleType &&
          data.step3.motorcycleWeight > 0 &&
          data.step3.wheelbase > 0 &&
          data.step3.length > 0
        )
      case 4:
        return !!data.step4.rampModel
      case 5:
        return true
      default:
        return false
    }
  }

  const resetConfigurator = () => {
    setData(INITIAL_DATA)
    localStorage.removeItem('ezcr-configurator')
  }

  const saveConfiguration = async () => {
    try {
      // Save to database via API
      const response = await fetch('/api/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configuration: data,
          calculatedPrice: data.quote?.total || 0,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      return await response.json()
    } catch (error) {
      console.error('Error saving configuration:', error)
      throw error
    }
  }

  return (
    <ConfiguratorContext.Provider
      value={{
        data,
        updateStep1,
        updateStep2,
        updateStep3,
        updateStep4,
        setCurrentStep,
        nextStep,
        prevStep,
        canProceed,
        resetConfigurator,
        saveConfiguration,
      }}
    >
      {children}
    </ConfiguratorContext.Provider>
  )
}

export function useConfigurator() {
  const context = useContext(ConfiguratorContext)
  if (context === undefined) {
    throw new Error('useConfigurator must be used within ConfiguratorProvider')
  }
  return context
}
