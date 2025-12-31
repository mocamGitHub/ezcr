// Configurator Types for EZCR Project

export type VehicleType = 'pickup' | 'van' | 'trailer'
export type RampModel = 'AUN250' | 'AUN210' | 'AUN200' | 'AUN150'
export type ExtensionType = 'AC001-1' | 'AC001-2' | 'AC001-3' | 'AC004' | '4-BEAM'
export type UnitSystem = 'imperial' | 'metric'

// Step 1: Vehicle Type & Contact
export interface Step1Data {
  vehicleType: VehicleType | null
  contactName: string
  contactEmail: string
  contactPhone: string
  smsOptIn: boolean
}

// Step 2: Measurements
export interface Step2Data {
  cargoArea: number // inches or cm based on unit
  totalLength: number
  height: number
  unitSystem: UnitSystem
}

// Step 3: Motorcycle
export interface Step3Data {
  motorcycleType: string
  motorcycleWeight: number // lbs
  wheelbase: number // inches
  length: number // inches
}

// Step 4: Configuration
export interface Step4Data {
  rampModel: RampModel | null
  requiredExtensions: ExtensionType[]
  additionalAccessories: string[]
  needsDemo: boolean
  needsInstallation: boolean
}

// Step 5: Quote
export interface QuoteData {
  basePrice: number
  extensionsPrice: number
  accessoriesPrice: number
  servicesPrice: number
  subtotal: number
  tax: number
  total: number
}

// Complete Configuration
export interface ConfiguratorData {
  step1: Step1Data
  step2: Step2Data
  step3: Step3Data
  step4: Step4Data
  quote: QuoteData | null
  currentStep: number
  isComplete: boolean
}

// Measurement validation ranges
export const MEASUREMENT_RANGES = {
  cargoArea: { min: 53.15, max: 98.43 }, // inches
  totalLength: { min: 68, max: 98.43 },
  height: { min: 0, max: 60 },
} as const

// Conversion factors
export const CONVERSIONS = {
  inchesToCm: 2.54,
  cmToInches: 0.393701,
  lbsToKg: 0.453592,
  kgToLbs: 2.20462,
} as const

// DEPRECATED: Product and service pricing now comes from the database.
// These constants are kept for legacy code compatibility but should not be used.
// Use PricingContext instead: src/contexts/PricingContext.tsx
// TODO: Remove these once ConfiguratorContext.tsx is deleted
export const PRODUCT_PRICES = {
  AUN250: 0, // Use PricingContext
  AUN210: 0,
  AUN200: 0,
  AUN150: 0,
  'AC001-1': 0,
  'AC001-2': 0,
  'AC001-3': 0,
  'AC004': 0,
  '4-BEAM': 0,
} as const

export const SERVICE_PRICES = {
  demo: 0, // Use PricingContext
  installation: 0,
} as const
