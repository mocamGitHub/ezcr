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

// Product pricing
export const PRODUCT_PRICES = {
  AUN250: 1299.0,
  AUN210: 999.0,
  AUN200: 799.0,
  AUN150: 899.0,
  'AC001-1': 149.0,
  'AC001-2': 179.0,
  'AC001-3': 209.0,
  'AC004': 199.0,
  '4-BEAM': 249.0,
} as const

// Service pricing
export const SERVICE_PRICES = {
  demo: 50.0,
  installation: 150.0,
} as const
