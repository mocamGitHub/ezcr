// Shared data between Quick Configurator and Full Configurator
// Uses localStorage to persist answers across configurators

const STORAGE_KEY = 'ezcr_configurator_shared_data'

export interface SharedConfiguratorData {
  // Quick configurator answers (raw)
  bedLength?: 'short' | 'standard' | 'long' | 'unsure'
  hasTonneau?: 'yes' | 'no'
  tonneauType?: string
  rollDirection?: 'on-top' | 'into-bed'
  bikeWeight?: 'light' | 'medium' | 'heavy'
  tailgateRequired?: 'yes' | 'no'

  // Mapped for full configurator
  vehicleType?: 'pickup' | 'trailer' | 'van'
  motorcycleType?: 'cruiser' | 'sport' | 'touring' | 'adventure' | 'standard'

  // Recommendation from quick configurator
  recommendation?: 'AUN200' | 'AUN250'

  // Timestamp for cache invalidation
  timestamp?: number

  // Source of data
  source?: 'quick' | 'full'
}

// Map bed length categories to approximate inches for full configurator hints
export function mapBedLengthToInches(bedLength: string): { min: number; max: number } {
  switch (bedLength) {
    case 'short':
      return { min: 60, max: 70 }
    case 'standard':
      return { min: 72, max: 78 }
    case 'long':
      return { min: 96, max: 108 }
    default:
      return { min: 0, max: 0 }
  }
}

// Map bike weight categories to approximate lbs
export function mapBikeWeightToLbs(bikeWeight: string): { min: number; max: number } {
  switch (bikeWeight) {
    case 'light':
      return { min: 200, max: 500 }
    case 'medium':
      return { min: 500, max: 800 }
    case 'heavy':
      return { min: 800, max: 1200 }
    default:
      return { min: 0, max: 0 }
  }
}

// Map bike weight to likely motorcycle type
export function mapBikeWeightToType(bikeWeight: string): string {
  switch (bikeWeight) {
    case 'light':
      return 'sport' // Sport bikes, dirt bikes
    case 'medium':
      return 'cruiser' // Cruisers, mid-size touring
    case 'heavy':
      return 'touring' // Full dressers, Goldwings
    default:
      return 'standard'
  }
}

// Save shared data to localStorage
export function saveSharedConfiguratorData(data: Partial<SharedConfiguratorData>): void {
  if (typeof window === 'undefined') return

  try {
    const existing = getSharedConfiguratorData()
    const merged: SharedConfiguratorData = {
      ...existing,
      ...data,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch (error) {
    console.error('Failed to save shared configurator data:', error)
  }
}

// Get shared data from localStorage
export function getSharedConfiguratorData(): SharedConfiguratorData | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const data = JSON.parse(stored) as SharedConfiguratorData

    // Check if data is stale (older than 24 hours)
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    if (data.timestamp && Date.now() - data.timestamp > maxAge) {
      clearSharedConfiguratorData()
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to get shared configurator data:', error)
    return null
  }
}

// Clear shared data
export function clearSharedConfiguratorData(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear shared configurator data:', error)
  }
}

// Check if there's existing data from another configurator
export function hasSharedData(): boolean {
  const data = getSharedConfiguratorData()
  return data !== null && Object.keys(data).length > 0
}
