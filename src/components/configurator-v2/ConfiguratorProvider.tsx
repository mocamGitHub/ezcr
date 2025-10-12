'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  ConfigData,
  VehicleType,
  BikeType,
  UnitSystem,
  Theme,
  AC001Extension,
  CONVERSION_FACTORS,
  PRICING,
  PRODUCT_NAMES,
  MEASUREMENT_RANGES,
} from '@/types/configurator-v2'

interface ConfiguratorContextType {
  // State
  currentStep: number
  completedSteps: number[]
  units: UnitSystem
  theme: Theme
  configData: ConfigData
  pendingAction: 'cart' | 'email' | 'print' | null
  showContactModal: boolean

  // Navigation
  goToStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void

  // Theme & Units
  toggleTheme: () => void
  toggleUnits: () => void

  // Contact
  updateContact: (contact: Partial<ConfigData['contact']>) => void
  setShowContactModal: (show: boolean) => void
  setPendingAction: (action: 'cart' | 'email' | 'print' | null) => void

  // Vehicle
  selectVehicle: (vehicle: VehicleType) => void

  // Measurements
  updateMeasurements: (measurements: Partial<ConfigData['measurements']>) => void
  calculateAC001Extension: (heightInInches: number) => AC001Extension | null
  checkCargoExtension: (cargoInInches: number) => boolean

  // Motorcycle
  selectBikeType: (type: BikeType) => void
  updateMotorcycle: (motorcycle: Partial<ConfigData['motorcycle']>) => void

  // Products
  selectModel: (id: string, name: string, price: number) => void
  selectExtension: (id: string, name: string, price: number) => void
  selectDelivery: (id: string, name: string, price: number) => void
  selectService: (id: string, name: string, price: number) => void
  selectBoltlessKit: (id: string, name: string, price: number) => void
  selectTiedown: (id: string, name: string, price: number) => void

  // Validation
  canProceedFromStep: (step: number) => boolean

  // Conversion helpers
  convertToInches: (value: number) => number
  convertToCm: (value: number) => number
  convertToLbs: (value: number) => number
  convertToKg: (value: number) => number
}

const ConfiguratorContext = createContext<ConfiguratorContextType | undefined>(undefined)

export function useConfigurator() {
  const context = useContext(ConfiguratorContext)
  if (!context) {
    throw new Error('useConfigurator must be used within ConfiguratorProvider')
  }
  return context
}

interface ConfiguratorProviderProps {
  children: ReactNode
}

export function ConfiguratorProvider({ children }: ConfiguratorProviderProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [units, setUnits] = useState<UnitSystem>('imperial')
  const [theme, setTheme] = useState<Theme>('dark')
  const [showContactModal, setShowContactModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'cart' | 'email' | 'print' | null>(null)

  const [configData, setConfigData] = useState<ConfigData>({
    vehicle: null,
    contact: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      smsOptIn: false,
    },
    measurements: {
      loadHeight: 0,
      requiredAC001: null,
      requiresCargoExtension: false,
    },
    motorcycle: {
      type: null,
      weight: 0,
      wheelbase: 0,
      length: 0,
    },
    // Defaults: AUN250 + Extension 1 (as RECOMMENDED)
    selectedModel: {
      id: 'AUN250',
      name: PRODUCT_NAMES.models.AUN250,
      price: PRICING.models.AUN250,
    },
    extension: {
      id: 'ext1',
      name: PRODUCT_NAMES.extensions.ext1,
      price: PRICING.extensions.ext1,
    },
    boltlessKit: {
      id: 'no-kit',
      name: PRODUCT_NAMES.boltlessKit['no-kit'],
      price: PRICING.boltlessKit['no-kit'],
    },
    tiedown: {
      id: 'no-tiedown',
      name: PRODUCT_NAMES.tiedown['no-tiedown'],
      price: PRICING.tiedown['no-tiedown'],
    },
    service: {
      id: 'not-assembled',
      name: PRODUCT_NAMES.services['not-assembled'],
      price: PRICING.services['not-assembled'],
    },
    delivery: {
      id: 'pickup',
      name: PRODUCT_NAMES.delivery.pickup,
      price: PRICING.delivery.pickup,
    },
  })

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Conversion helpers
  const convertToInches = (value: number): number => {
    return units === 'metric' ? value / CONVERSION_FACTORS.inchesToCm : value
  }

  const convertToCm = (value: number): number => {
    return units === 'imperial' ? value * CONVERSION_FACTORS.inchesToCm : value
  }

  const convertToLbs = (value: number): number => {
    return units === 'metric' ? value / CONVERSION_FACTORS.lbsToKg : value
  }

  const convertToKg = (value: number): number => {
    return units === 'imperial' ? value * CONVERSION_FACTORS.lbsToKg : value
  }

  // Theme toggle
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Unit toggle with conversion
  const toggleUnits = () => {
    const newUnits: UnitSystem = units === 'imperial' ? 'metric' : 'imperial'

    setConfigData((prev) => {
      const converted = { ...prev }

      // Convert measurements
      if (units === 'imperial') {
        // Converting to metric
        if (prev.measurements.bedLengthClosed) {
          converted.measurements.bedLengthClosed = prev.measurements.bedLengthClosed * CONVERSION_FACTORS.inchesToCm
        }
        if (prev.measurements.bedLengthOpen) {
          converted.measurements.bedLengthOpen = prev.measurements.bedLengthOpen * CONVERSION_FACTORS.inchesToCm
        }
        if (prev.measurements.cargoLength) {
          converted.measurements.cargoLength = prev.measurements.cargoLength * CONVERSION_FACTORS.inchesToCm
        }
        converted.measurements.loadHeight = prev.measurements.loadHeight * CONVERSION_FACTORS.inchesToCm

        // Convert motorcycle
        converted.motorcycle.weight = prev.motorcycle.weight * CONVERSION_FACTORS.lbsToKg
        converted.motorcycle.wheelbase = prev.motorcycle.wheelbase * CONVERSION_FACTORS.inchesToCm
        converted.motorcycle.length = prev.motorcycle.length * CONVERSION_FACTORS.inchesToCm
      } else {
        // Converting to imperial
        if (prev.measurements.bedLengthClosed) {
          converted.measurements.bedLengthClosed = prev.measurements.bedLengthClosed / CONVERSION_FACTORS.inchesToCm
        }
        if (prev.measurements.bedLengthOpen) {
          converted.measurements.bedLengthOpen = prev.measurements.bedLengthOpen / CONVERSION_FACTORS.inchesToCm
        }
        if (prev.measurements.cargoLength) {
          converted.measurements.cargoLength = prev.measurements.cargoLength / CONVERSION_FACTORS.inchesToCm
        }
        converted.measurements.loadHeight = prev.measurements.loadHeight / CONVERSION_FACTORS.inchesToCm

        // Convert motorcycle
        converted.motorcycle.weight = prev.motorcycle.weight / CONVERSION_FACTORS.lbsToKg
        converted.motorcycle.wheelbase = prev.motorcycle.wheelbase / CONVERSION_FACTORS.inchesToCm
        converted.motorcycle.length = prev.motorcycle.length / CONVERSION_FACTORS.inchesToCm
      }

      return converted
    })

    setUnits(newUnits)
  }

  // AC001 Extension calculation
  const calculateAC001Extension = (heightInInches: number): AC001Extension | null => {
    if (heightInInches >= 35 && heightInInches <= 42) return 'AC001-1'
    if (heightInInches >= 43 && heightInInches <= 51) return 'AC001-2'
    if (heightInInches >= 52 && heightInInches <= 60) return 'AC001-3'
    return null
  }

  // Cargo extension check
  const checkCargoExtension = (cargoInInches: number): boolean => {
    return cargoInInches > MEASUREMENT_RANGES.cargoExtensionThreshold
  }

  // Navigation
  const goToStep = (step: number) => {
    if (step < 1 || step > 5) return
    if (step > 1 && !completedSteps.includes(step - 1)) return // Can't skip ahead
    setCurrentStep(step)
  }

  const nextStep = () => {
    if (currentStep < 5) {
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])])
      setCurrentStep(currentStep + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Contact
  const updateContact = (contact: Partial<ConfigData['contact']>) => {
    setConfigData((prev) => ({
      ...prev,
      contact: { ...prev.contact, ...contact },
    }))
  }

  // Vehicle
  const selectVehicle = (vehicle: VehicleType) => {
    setConfigData((prev) => ({
      ...prev,
      vehicle,
      // Reset measurements when vehicle changes
      measurements: {
        loadHeight: 0,
        requiredAC001: null,
        requiresCargoExtension: false,
      },
    }))
  }

  // Measurements
  const updateMeasurements = (measurements: Partial<ConfigData['measurements']>) => {
    setConfigData((prev) => ({
      ...prev,
      measurements: { ...prev.measurements, ...measurements },
    }))
  }

  // Motorcycle
  const selectBikeType = (type: BikeType) => {
    setConfigData((prev) => ({
      ...prev,
      motorcycle: { ...prev.motorcycle, type },
    }))
  }

  const updateMotorcycle = (motorcycle: Partial<ConfigData['motorcycle']>) => {
    setConfigData((prev) => ({
      ...prev,
      motorcycle: { ...prev.motorcycle, ...motorcycle },
    }))
  }

  // Products
  const selectModel = (id: string, name: string, price: number) => {
    setConfigData((prev) => ({
      ...prev,
      selectedModel: { id, name, price },
    }))
  }

  const selectExtension = (id: string, name: string, price: number) => {
    setConfigData((prev) => ({
      ...prev,
      extension: { id, name, price },
    }))
  }

  const selectDelivery = (id: string, name: string, price: number) => {
    // Check for Demo + Ship incompatibility
    if (id === 'ship' && configData.service.id === 'demo') {
      alert('⚠️ Shipping is not available with Demo service. Switching to Pickup.')
      return // Don't change delivery
    }

    setConfigData((prev) => ({
      ...prev,
      delivery: { id, name, price },
    }))
  }

  const selectService = (id: string, name: string, price: number) => {
    // Check for Demo + Ship incompatibility
    if (id === 'demo' && configData.delivery.id === 'ship') {
      alert('⚠️ Demo service is not available with Shipping. Switching to Pickup.')
      setConfigData((prev) => ({
        ...prev,
        service: { id, name, price },
        delivery: {
          id: 'pickup',
          name: PRODUCT_NAMES.delivery.pickup,
          price: PRICING.delivery.pickup,
        },
      }))
      return
    }

    setConfigData((prev) => ({
      ...prev,
      service: { id, name, price },
    }))
  }

  const selectBoltlessKit = (id: string, name: string, price: number) => {
    setConfigData((prev) => {
      const updated = {
        ...prev,
        boltlessKit: { id, name, price },
      }

      // If Boltless Kit selected, auto-select Turnbuckles (2 pairs)
      if (id === 'kit') {
        updated.tiedown = {
          id: 'turnbuckle-2',
          name: PRODUCT_NAMES.tiedown['turnbuckle-2'],
          price: PRICING.tiedown['turnbuckle-2'],
        }
      }

      return updated
    })
  }

  const selectTiedown = (id: string, name: string, price: number) => {
    setConfigData((prev) => ({
      ...prev,
      tiedown: { id, name, price },
    }))
  }

  // Validation
  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return configData.vehicle !== null
      case 2:
        if (configData.vehicle === 'pickup') {
          return !!(
            configData.measurements.bedLengthClosed &&
            configData.measurements.bedLengthOpen &&
            configData.measurements.loadHeight
          )
        }
        return !!(configData.measurements.cargoLength && configData.measurements.loadHeight)
      case 3:
        return !!(
          configData.motorcycle.type &&
          configData.motorcycle.weight > 0 &&
          configData.motorcycle.wheelbase > 0 &&
          configData.motorcycle.length > 0
        )
      case 4:
        return true // Always can proceed from step 4
      case 5:
        return true
      default:
        return false
    }
  }

  const value: ConfiguratorContextType = {
    currentStep,
    completedSteps,
    units,
    theme,
    configData,
    pendingAction,
    showContactModal,
    goToStep,
    nextStep,
    previousStep,
    toggleTheme,
    toggleUnits,
    updateContact,
    setShowContactModal,
    setPendingAction,
    selectVehicle,
    updateMeasurements,
    calculateAC001Extension,
    checkCargoExtension,
    selectBikeType,
    updateMotorcycle,
    selectModel,
    selectExtension,
    selectDelivery,
    selectService,
    selectBoltlessKit,
    selectTiedown,
    canProceedFromStep,
    convertToInches,
    convertToCm,
    convertToLbs,
    convertToKg,
  }

  return <ConfiguratorContext.Provider value={value}>{children}</ConfiguratorContext.Provider>
}
