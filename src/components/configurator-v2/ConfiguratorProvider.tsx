'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react'
import {
  ConfigData,
  VehicleType,
  BikeType,
  UnitSystem,
  AC001Extension,
  CONVERSION_FACTORS,
  PRICING,
  PRODUCT_NAMES,
  MEASUREMENT_RANGES,
  FEES,
} from '@/types/configurator-v2'
import { generateQuotePDF } from '@/lib/utils/pdf-quote'
import {
  getSharedConfiguratorData,
  mapBikeWeightToLbs,
  mapBikeWeightToType,
} from '@/lib/configurator-shared-data'
import { useShippingQuote, ShippingQuoteResponse } from '@/hooks/useShippingQuote'
import type { UFEResult, TonneauType, RollDirection, RampModelId } from '@/lib/ufe'
import { evaluateAdvanced, getRampModel } from '@/lib/ufe'
import { toast } from 'sonner'

interface ConfiguratorContextType {
  // State
  currentStep: number
  completedSteps: number[]
  units: UnitSystem
  configData: ConfigData
  pendingAction: 'cart' | 'email' | 'print' | null
  showContactModal: boolean
  savedConfigId: string | null

  // UFE State
  ufeResult: UFEResult | null
  ufeRecommendedModel: RampModelId | null

  // Shipping state
  shippingZip: string
  isResidential: boolean
  shippingQuote: ShippingQuoteResponse | null
  isLoadingShipping: boolean
  shippingError: string | null

  // Navigation
  goToStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void

  // Units
  toggleUnits: () => void

  // Contact
  updateContact: (contact: Partial<ConfigData['contact']>) => void
  setShowContactModal: (show: boolean) => void
  setPendingAction: (action: 'cart' | 'email' | 'print' | null) => void

  // Vehicle
  selectVehicle: (vehicle: VehicleType) => void

  // Generic config data update
  updateConfigData: (data: Partial<ConfigData>) => void

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

  // Shipping
  setShippingZip: (zip: string) => void
  setIsResidential: (isResidential: boolean) => void
  fetchShippingQuote: () => Promise<void>
  clearShippingQuote: () => void

  // Validation
  canProceedFromStep: (step: number) => boolean

  // Save/Load
  saveConfiguration: (isComplete?: boolean) => Promise<{ success: boolean; id?: string; message: string }>
  loadConfiguration: (id: string) => Promise<boolean>

  // Quote actions
  executeEmailQuote: () => Promise<{ success: boolean; message: string }>
  executePrintQuote: () => Promise<{ success: boolean; message: string }>

  // UFE
  runUFEEvaluation: () => void

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
  const [showContactModal, setShowContactModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'cart' | 'email' | 'print' | null>(null)
  const [savedConfigId, setSavedConfigId] = useState<string | null>(null)

  // UFE State
  const [ufeResult, setUfeResult] = useState<UFEResult | null>(null)

  // Shipping state
  const [shippingZip, setShippingZip] = useState('')
  const [isResidential, setIsResidential] = useState(true)
  const { quote: shippingQuote, isLoading: isLoadingShipping, error: shippingError, fetchQuote, clearQuote } = useShippingQuote()


  const [configData, setConfigData] = useState<ConfigData>({
    vehicle: null,
    contact: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      smsOptIn: true,
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

  // Computed UFE recommended model
  const ufeRecommendedModel = useMemo<RampModelId | null>(() => {
    if (ufeResult?.success && ufeResult.primaryRecommendation) {
      return ufeResult.primaryRecommendation.rampId
    }
    return null
  }, [ufeResult])

  // Load shared data from Quick Configurator on mount
  useEffect(() => {
    const sharedData = getSharedConfiguratorData()
    if (sharedData && sharedData.source === 'quick') {
      // Pre-populate based on Quick Configurator answers
      setConfigData((prev) => {
        const updated = { ...prev }

        // Set vehicle type (Quick Configurator assumes pickup)
        if (sharedData.vehicleType) {
          updated.vehicle = sharedData.vehicleType
        }

        // Pre-set tonneau cover info if available
        if (sharedData.hasTonneau !== undefined) {
          updated.hasTonneauCover = sharedData.hasTonneau === 'yes'
          if (sharedData.tonneauType) {
            updated.tonneauType = sharedData.tonneauType
          }
          if (sharedData.rollDirection) {
            updated.tonneauRollDirection = sharedData.rollDirection
          }
        }

        // Pre-set motorcycle type and weight estimate
        if (sharedData.bikeWeight) {
          const weightRange = mapBikeWeightToLbs(sharedData.bikeWeight)
          const avgWeight = (weightRange.min + weightRange.max) / 2
          updated.motorcycle = {
            ...prev.motorcycle,
            type: mapBikeWeightToType(sharedData.bikeWeight) as BikeType,
            weight: avgWeight,
          }
        }

        // Pre-select recommended model from Quick Configurator
        if (sharedData.recommendation) {
          const modelId = sharedData.recommendation
          updated.selectedModel = {
            id: modelId,
            name: PRODUCT_NAMES.models[modelId as keyof typeof PRODUCT_NAMES.models],
            price: PRICING.models[modelId as keyof typeof PRICING.models],
          }
        }

        return updated
      })

      // If vehicle is already set, mark step 1 as completed
      if (sharedData.vehicleType) {
        setCompletedSteps([1])
      }
    }
  }, [])

  // Run UFE Evaluation based on current config data
  const runUFEEvaluation = useCallback(() => {
    // Only run if we have a pickup truck with measurements
    if (configData.vehicle !== 'pickup') {
      setUfeResult(null)
      return
    }

    // Ensure we have required measurements
    const bedLengthClosed = configData.measurements.bedLengthClosed
    const bedLengthOpen = configData.measurements.bedLengthOpen
    const loadHeight = configData.measurements.loadHeight
    const motorcycleWeight = configData.motorcycle.weight
    const motorcycleWheelbase = configData.motorcycle.wheelbase
    const motorcycleLength = configData.motorcycle.length

    if (!bedLengthClosed || !bedLengthOpen || !loadHeight ||
        !motorcycleWeight || !motorcycleWheelbase || !motorcycleLength) {
      setUfeResult(null)
      return
    }

    // Convert measurements to imperial if needed
    const toInches = (value: number) => units === 'metric' ? value / CONVERSION_FACTORS.inchesToCm : value
    const toLbs = (value: number) => units === 'metric' ? value / CONVERSION_FACTORS.lbsToKg : value

    // Map tonneau type to UFE format
    const mapTonneauType = (type: string | undefined): TonneauType => {
      if (!type) return 'none'
      const mapping: Record<string, TonneauType> = {
        'roll-up-soft': 'roll-up-soft',
        'roll-up-hard': 'roll-up-hard',
        'tri-fold-soft': 'tri-fold-soft',
        'tri-fold-hard': 'tri-fold-hard',
        'bi-fold': 'bi-fold',
        'hinged': 'hinged',
        'retractable': 'retractable',
        'other': 'other',
      }
      return mapping[type] || 'none'
    }

    // Map roll direction to UFE format
    const mapRollDirection = (dir: string | undefined): RollDirection | undefined => {
      if (!dir) return undefined
      if (dir === 'on-top' || dir === 'into-bed') return dir
      return undefined
    }

    try {
      const result = evaluateAdvanced({
        truck: {
          bedLengthClosed: toInches(bedLengthClosed),
          bedLengthWithTailgate: toInches(bedLengthOpen),
          tailgateHeight: toInches(loadHeight),
          hasTonneau: configData.hasTonneauCover || false,
          tonneauType: mapTonneauType(configData.tonneauType),
          rollDirection: mapRollDirection(configData.tonneauRollDirection),
        },
        motorcycle: {
          weight: toLbs(motorcycleWeight),
          wheelbase: toInches(motorcycleWheelbase),
          totalLength: toInches(motorcycleLength),
        },
        tailgateMustClose: false,
        motorcycleLoadedWhenClosed: false,
        unitSystem: 'imperial',
      })

      setUfeResult(result)

      // Auto-select the recommended model if UFE succeeds
      if (result.success && result.primaryRecommendation) {
        const rampId = result.primaryRecommendation.rampId
        const rampModel = getRampModel(rampId)
        if (rampModel) {
          setConfigData((prev) => ({
            ...prev,
            selectedModel: {
              id: rampId,
              name: PRODUCT_NAMES.models[rampId as keyof typeof PRODUCT_NAMES.models] || rampModel.name,
              price: PRICING.models[rampId as keyof typeof PRICING.models] || rampModel.price,
            },
          }))
        }
      }
    } catch (error) {
      console.error('UFE evaluation error:', error)
      setUfeResult(null)
    }
  }, [configData, units])

  // Auto-run UFE when entering step 4
  useEffect(() => {
    if (currentStep === 4 && configData.vehicle === 'pickup') {
      runUFEEvaluation()
    }
  }, [currentStep, runUFEEvaluation, configData.vehicle])


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
    // Allow going to completed steps, current step, or next step if previous is completed
    if (step > 1 && !completedSteps.includes(step - 1) && step !== currentStep) return // Can't skip ahead
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
    // Clear UFE result when vehicle changes
    setUfeResult(null)
  }

  // Generic config data update (for tonneau cover info, etc.)
  const updateConfigData = (data: Partial<ConfigData>) => {
    setConfigData((prev) => ({
      ...prev,
      ...data,
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
      toast.warning('Shipping is not available with Demo service. Switching to Pickup.')
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
      toast.warning('Demo service is not available with Shipping. Switching to Pickup.')
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

  // Shipping quote fetch function
  const fetchShippingQuote = useCallback(async () => {
    if (!shippingZip || shippingZip.length < 5) {
      return
    }

    // Map model ID to SKU format expected by API
    // AUN250 -> AUN250, AUN210 -> AUN200 (API only supports AUN200/AUN250)
    const productSku = configData.selectedModel.id === 'AUN210' ? 'AUN200' : 'AUN250'

    const result = await fetchQuote({
      destinationZip: shippingZip,
      productSku: productSku as 'AUN200' | 'AUN250',
      isResidential,
      source: 'configurator',
    })

    // If successful, update the delivery price with the actual shipping rate + handling fee
    // Handling fee is configurable in PRICING.shippingHandlingFee
    if (result?.success && result.totalRate) {
      const totalShippingCost = result.totalRate + PRICING.shippingHandlingFee
      setConfigData((prev) => ({
        ...prev,
        delivery: {
          id: 'ship',
          name: `Freight Shipping to ${shippingZip}`,
          price: totalShippingCost,
        },
      }))
    }
  }, [shippingZip, isResidential, configData.selectedModel.id, fetchQuote])

  // Clear shipping quote and reset to pickup
  const clearShippingQuote = useCallback(() => {
    clearQuote()
    setConfigData((prev) => ({
      ...prev,
      delivery: {
        id: 'pickup',
        name: PRODUCT_NAMES.delivery.pickup,
        price: PRICING.delivery.pickup,
      },
    }))
  }, [clearQuote])

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

  // Save/Load Configuration
  const saveConfiguration = async (isComplete = false): Promise<{ success: boolean; id?: string; message: string }> => {
    try {
      // Calculate total for saving
      const subtotal =
        configData.selectedModel.price +
        configData.extension.price +
        configData.boltlessKit.price +
        configData.tiedown.price +
        configData.service.price +
        configData.delivery.price

      const salesTax = subtotal * 0.089
      const processingFee = subtotal * 0.03
      const total = subtotal + salesTax + processingFee

      const configToSave = {
        ...configData,
        currentStep,
        completedSteps,
        isComplete,
      }

      // Try API save first
      try {
        const response = await fetch('/api/configurator/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            configuration: configToSave,
            total,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setSavedConfigId(data.configuration.id)

          return {
            success: true,
            id: data.configuration.id,
            message: isComplete ? 'Configuration saved successfully!' : 'Progress saved! You can resume later.',
          }
        }
      } catch (apiError) {
        console.warn('API save failed, falling back to localStorage:', apiError)
      }

      // Fallback: Save to localStorage
      const localId = `local-config-${Date.now()}`
      const localConfig = {
        id: localId,
        configuration: configToSave,
        total,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem('ezcr-saved-config', JSON.stringify(localConfig))
      setSavedConfigId(localId)

      return {
        success: true,
        id: localId,
        message: isComplete ? 'Configuration saved locally!' : 'Progress saved locally! You can resume later.',
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      return {
        success: false,
        message: 'Failed to save configuration. Please try again.',
      }
    }
  }

  const loadConfiguration = async (id: string): Promise<boolean> => {
    try {
      // Check if this is a local configuration
      if (id.startsWith('local-config-')) {
        const localData = localStorage.getItem('ezcr-saved-config')
        if (localData) {
          const parsed = JSON.parse(localData)
          if (parsed.id === id) {
            setConfigData(parsed.configuration)
            setCurrentStep(parsed.configuration.currentStep || 1)
            setCompletedSteps(parsed.configuration.completedSteps || [])
            setSavedConfigId(id)
            return true
          }
        }
        return false
      }

      // Try API load
      const response = await fetch(`/api/configurator/load/${id}`)

      if (!response.ok) {
        throw new Error('Failed to load configuration')
      }

      const data = await response.json()
      const loaded = data.configuration

      // Restore configuration data
      setConfigData(loaded.configuration)
      setCurrentStep(loaded.configuration.currentStep || 1)
      setCompletedSteps(loaded.configuration.completedSteps || [])
      setSavedConfigId(id)

      return true
    } catch (error) {
      console.error('Error loading configuration:', error)
      return false
    }
  }

  // Calculate totals for email/print
  const calculateTotals = () => {
    const subtotal =
      configData.selectedModel.price +
      configData.extension.price +
      configData.boltlessKit.price +
      configData.tiedown.price +
      configData.service.price +
      configData.delivery.price

    const salesTax = subtotal * FEES.salesTaxRate
    const processingFee = subtotal * FEES.processingFeeRate
    const total = subtotal + salesTax + processingFee

    return { subtotal, salesTax, processingFee, total }
  }

  // Execute email quote action
  const executeEmailQuote = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const { subtotal, salesTax, processingFee, total } = calculateTotals()

      const response = await fetch('/api/quote/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: configData.contact.email,
          firstName: configData.contact.firstName,
          lastName: configData.contact.lastName,
          vehicle: configData.vehicle,
          measurements: configData.measurements,
          motorcycle: configData.motorcycle,
          selectedModel: configData.selectedModel,
          extension: configData.extension,
          boltlessKit: configData.boltlessKit,
          tiedown: configData.tiedown,
          service: configData.service,
          delivery: configData.delivery,
          subtotal,
          salesTax,
          processingFee,
          total,
        }),
      })

      if (response.ok) {
        return {
          success: true,
          message: `Quote sent to ${configData.contact.email}`,
        }
      } else {
        const error = await response.json()
        return {
          success: false,
          message: error.error || 'Failed to send email',
        }
      }
    } catch (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        message: 'Failed to send email. Please try again.',
      }
    }
  }

  // Execute print quote action
  const executePrintQuote = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const { subtotal, salesTax, processingFee, total } = calculateTotals()

      await generateQuotePDF({
        contact: {
          firstName: configData.contact.firstName || '',
          lastName: configData.contact.lastName || '',
          email: configData.contact.email || '',
          phone: configData.contact.phone,
        },
        vehicle: configData.vehicle || '',
        measurements: configData.measurements,
        motorcycle: {
          type: configData.motorcycle.type || '',
          weight: configData.motorcycle.weight,
          wheelbase: configData.motorcycle.wheelbase,
          length: configData.motorcycle.length,
        },
        selectedModel: configData.selectedModel,
        extension: configData.extension,
        boltlessKit: configData.boltlessKit,
        tiedown: configData.tiedown,
        service: configData.service,
        delivery: configData.delivery,
        subtotal,
        salesTax,
        processingFee,
        total,
      })

      return {
        success: true,
        message: 'PDF quote generated - check your downloads',
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      return {
        success: false,
        message: 'Failed to generate PDF. Please try again.',
      }
    }
  }

  const value: ConfiguratorContextType = {
    currentStep,
    completedSteps,
    units,
    configData,
    pendingAction,
    showContactModal,
    savedConfigId,
    // UFE state
    ufeResult,
    ufeRecommendedModel,
    // Shipping state
    shippingZip,
    isResidential,
    shippingQuote,
    isLoadingShipping,
    shippingError,
    goToStep,
    nextStep,
    previousStep,
    toggleUnits,
    updateContact,
    setShowContactModal,
    setPendingAction,
    selectVehicle,
    updateConfigData,
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
    // Shipping methods
    setShippingZip,
    setIsResidential,
    fetchShippingQuote,
    clearShippingQuote,
    canProceedFromStep,
    saveConfiguration,
    loadConfiguration,
    executeEmailQuote,
    executePrintQuote,
    // UFE
    runUFEEvaluation,
    convertToInches,
    convertToCm,
    convertToLbs,
    convertToKg,
  }

  return <ConfiguratorContext.Provider value={value}>{children}</ConfiguratorContext.Provider>
}
