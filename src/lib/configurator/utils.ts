import {
  ExtensionType,
  RampModel,
  Step2Data,
  MEASUREMENT_RANGES,
  CONVERSIONS,
  PRODUCT_PRICES,
  SERVICE_PRICES,
  Step4Data,
} from '@/types/configurator'

// Extension selection based on height
export function selectHeightExtension(height: number): ExtensionType | null {
  if (height >= 35 && height <= 42) return 'AC001-1'
  if (height >= 43 && height <= 51) return 'AC001-2'
  if (height >= 52 && height <= 60) return 'AC001-3'
  return null
}

// Cargo extension selection
export function selectCargoExtension(
  cargoArea: number,
  model: RampModel
): ExtensionType | null {
  if (cargoArea > 80) {
    if (model === 'AUN210') return 'AC004'
    if (model === 'AUN250') return '4-BEAM'
  }
  return null
}

// Get all required extensions
export function getRequiredExtensions(
  measurements: Step2Data,
  model: RampModel
): ExtensionType[] {
  const extensions: ExtensionType[] = []

  // Convert to inches if using metric
  const heightInInches =
    measurements.unitSystem === 'metric'
      ? measurements.height * CONVERSIONS.cmToInches
      : measurements.height

  const cargoAreaInInches =
    measurements.unitSystem === 'metric'
      ? measurements.cargoArea * CONVERSIONS.cmToInches
      : measurements.cargoArea

  // Height extension
  const heightExt = selectHeightExtension(heightInInches)
  if (heightExt) extensions.push(heightExt)

  // Cargo extension
  const cargoExt = selectCargoExtension(cargoAreaInInches, model)
  if (cargoExt) extensions.push(cargoExt)

  return extensions
}

// Validate measurements
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateMeasurements(
  measurements: Step2Data
): ValidationResult {
  const errors: Record<string, string> = {}

  // Convert to inches for validation
  const cargoArea =
    measurements.unitSystem === 'metric'
      ? measurements.cargoArea * CONVERSIONS.cmToInches
      : measurements.cargoArea

  const totalLength =
    measurements.unitSystem === 'metric'
      ? measurements.totalLength * CONVERSIONS.cmToInches
      : measurements.totalLength

  const height =
    measurements.unitSystem === 'metric'
      ? measurements.height * CONVERSIONS.cmToInches
      : measurements.height

  // Validate cargo area
  if (cargoArea < MEASUREMENT_RANGES.cargoArea.min) {
    errors.cargoArea = `Cargo area must be at least ${MEASUREMENT_RANGES.cargoArea.min}" (${(MEASUREMENT_RANGES.cargoArea.min * CONVERSIONS.inchesToCm).toFixed(2)}cm)`
  } else if (cargoArea > MEASUREMENT_RANGES.cargoArea.max) {
    errors.cargoArea = `Cargo area cannot exceed ${MEASUREMENT_RANGES.cargoArea.max}" (${(MEASUREMENT_RANGES.cargoArea.max * CONVERSIONS.inchesToCm).toFixed(2)}cm)`
  }

  // Validate total length
  if (totalLength < MEASUREMENT_RANGES.totalLength.min) {
    errors.totalLength = `Total length must be at least ${MEASUREMENT_RANGES.totalLength.min}" (${(MEASUREMENT_RANGES.totalLength.min * CONVERSIONS.inchesToCm).toFixed(2)}cm)`
  } else if (totalLength > MEASUREMENT_RANGES.totalLength.max) {
    errors.totalLength = `Total length cannot exceed ${MEASUREMENT_RANGES.totalLength.max}" (${(MEASUREMENT_RANGES.totalLength.max * CONVERSIONS.inchesToCm).toFixed(2)}cm)`
  }

  // Validate height
  if (height < MEASUREMENT_RANGES.height.min) {
    errors.height = `Height must be at least ${MEASUREMENT_RANGES.height.min}"`
  } else if (height > MEASUREMENT_RANGES.height.max) {
    errors.height = `Height cannot exceed ${MEASUREMENT_RANGES.height.max}" (${(MEASUREMENT_RANGES.height.max * CONVERSIONS.inchesToCm).toFixed(2)}cm)`
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Calculate pricing
export interface PriceBreakdown {
  basePrice: number
  extensionsPrice: number
  accessoriesPrice: number
  servicesPrice: number
  subtotal: number
  tax: number
  shipping: number
  total: number
}

export function calculatePrice(config: Step4Data): PriceBreakdown {
  // Base price
  const basePrice = config.rampModel ? PRODUCT_PRICES[config.rampModel] : 0

  // Extensions price
  const extensionsPrice = config.requiredExtensions.reduce((sum, ext) => {
    return sum + (PRODUCT_PRICES[ext] || 0)
  }, 0)

  // Accessories price (would need to look up from products)
  const accessoriesPrice = 0 // See ezcr-9ok

  // Services price
  let servicesPrice = 0
  if (config.needsDemo) servicesPrice += SERVICE_PRICES.demo
  if (config.needsInstallation) servicesPrice += SERVICE_PRICES.installation

  // Subtotal
  const subtotal = basePrice + extensionsPrice + accessoriesPrice + servicesPrice

  // Tax (8.9% as per business rules)
  const tax = subtotal * 0.089

  // Shipping (free over $500)
  const shipping = subtotal >= 500 ? 0 : 50

  // Total
  const total = subtotal + tax + shipping

  return {
    basePrice,
    extensionsPrice,
    accessoriesPrice,
    servicesPrice,
    subtotal,
    tax,
    shipping,
    total,
  }
}

// Convert between units
export function convertMeasurement(
  value: number,
  from: 'imperial' | 'metric',
  to: 'imperial' | 'metric'
): number {
  if (from === to) return value
  if (from === 'imperial' && to === 'metric') {
    return value * CONVERSIONS.inchesToCm
  }
  return value * CONVERSIONS.cmToInches
}

// Format currency
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
