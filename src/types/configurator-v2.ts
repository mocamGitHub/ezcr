// EZ Cycle Ramp Configurator Types - Based on HTML Specification
// This matches the exact structure from ez-cycle-configurator-final-20250924.html

export type VehicleType = 'pickup' | 'van' | 'trailer'
export type BikeType = 'sport' | 'cruiser' | 'adventure'
export type UnitSystem = 'imperial' | 'metric'
export type Theme = 'dark' | 'light'

// AC001 Extensions (height-based)
export type AC001Extension = 'AC001-1' | 'AC001-2' | 'AC001-3'

// Ramp Models
export type RampModel = 'AUN250' | 'AUN210'

// Product IDs
export type ExtensionId = 'no-ext' | 'ext1' | 'ext2' | 'ext3'
export type DeliveryId = 'pickup' | 'ship'
export type ServiceId = 'not-assembled' | 'assembly' | 'demo'
export type BoltlessKitId = 'no-kit' | 'kit'
export type TiedownId = 'no-tiedown' | 'turnbuckle-1' | 'turnbuckle-2' | 'straps'

// Contact Information
export interface ContactInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  smsOptIn: boolean
}

// Measurements (stored in configured unit)
export interface Measurements {
  // For pickup trucks
  bedLengthClosed?: number // Cargo area with closed tailgate
  bedLengthOpen?: number // Total length with open tailgate
  // For van/trailer
  cargoLength?: number
  // Common
  loadHeight: number
  // Calculated
  requiredAC001?: AC001Extension | null
  requiresCargoExtension?: boolean
}

// Motorcycle Information
export interface MotorcycleInfo {
  type: BikeType | null
  weight: number
  wheelbase: number
  length: number
}

// Product Selection
export interface ProductSelection {
  id: string
  name: string
  price: number
}

// Complete Configuration Data
export interface ConfigData {
  vehicle: VehicleType | null
  contact: ContactInfo
  measurements: Measurements
  motorcycle: MotorcycleInfo
  selectedModel: ProductSelection
  extension: ProductSelection
  boltlessKit: ProductSelection
  tiedown: ProductSelection
  service: ProductSelection
  delivery: ProductSelection
}

// Measurement Ranges (all in inches)
export const MEASUREMENT_RANGES = {
  cargoMin: 53.149,
  cargoMax: 98.426,
  totalLengthMin: 68,
  totalLengthMax: 98.426,
  heightMax: 60,
  cargoExtensionThreshold: 80,
  ac001Ranges: {
    'AC001-1': { min: 35, max: 42 },
    'AC001-2': { min: 43, max: 51 },
    'AC001-3': { min: 52, max: 60 },
  },
} as const

// Conversion Factors
export const CONVERSION_FACTORS = {
  inchesToCm: 2.54,
  lbsToKg: 0.453592,
} as const

// Tax and Fees
export const FEES = {
  salesTaxRate: 0.089, // 8.9%
  processingFeeRate: 0.03, // 3%
} as const

// Contact
export const CONTACT = {
  phone: '800-687-4410',
  supportUrl: '/support',
  exitUrl: '/',
} as const

// Product Pricing
export const PRICING = {
  models: {
    AUN250: 1299.0,
    AUN210: 999.0,
  },
  extensions: {
    'no-ext': 0,
    ext1: 149.0,
    ext2: 249.0,
    ext3: 349.0,
  },
  delivery: {
    pickup: 0,
    ship: 185.0,
  },
  services: {
    'not-assembled': 0,
    assembly: 99.0,
    demo: 149.0,
  },
  boltlessKit: {
    'no-kit': 0,
    kit: 89.0,
  },
  tiedown: {
    'no-tiedown': 0,
    'turnbuckle-1': 89.0,
    'turnbuckle-2': 159.0,
    straps: 29.0,
  },
} as const

// Product Names
export const PRODUCT_NAMES = {
  models: {
    AUN250: 'AUN250',
    AUN210: 'AUN210',
  },
  extensions: {
    'no-ext': 'No Extension',
    ext1: 'Extension 1 (12")',
    ext2: 'Extension 2 (24")',
    ext3: 'Extension 3 (36")',
  },
  delivery: {
    pickup: 'Pickup',
    ship: 'Ship',
  },
  services: {
    'not-assembled': 'Not Assembled',
    assembly: 'Assembly Service',
    demo: 'Demo (includes assembly)',
  },
  boltlessKit: {
    'no-kit': 'No Boltless Tiedown Kit',
    kit: 'Boltless Tiedown Kit',
  },
  tiedown: {
    'no-tiedown': 'No Tiedown Accessory',
    'turnbuckle-1': 'Turnbuckles (1 pair)',
    'turnbuckle-2': 'Turnbuckles (2 pairs)',
    straps: 'Tiedown Straps',
  },
} as const

// Color Scheme
export const COLORS = {
  primary: '#4a9eda',
  primaryDark: '#3a7eb8',
  primaryLight: '#6bb3e8',
  secondary: '#f97316',
  secondaryDark: '#ea580c',
  success: '#10b981',
  successDark: '#059669',
  error: '#ef4444',
  dark: '#0a0a0a',
  darkSecondary: '#1a1a1a',
  light: '#f8fafc',
  textLight: '#94a3b8',
  gold: '#d4af37',
  border: '#2a2a2a',
  logoBlue: '#005696',
  logoOrange: '#ff8c00',
} as const
