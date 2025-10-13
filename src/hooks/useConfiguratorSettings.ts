import { useState, useEffect } from 'react'

export interface MeasurementRanges {
  cargo_min: number
  cargo_max: number
  total_length_min: number
  total_length_max: number
  height_max: number
  cargo_extension_threshold: number
  ac001_1_min: number
  ac001_1_max: number
  ac001_2_min: number
  ac001_2_max: number
  ac001_3_min: number
  ac001_3_max: number
}

export interface PricingItem {
  name: string
  price: number
  description?: string
}

export interface Pricing {
  models: Record<string, PricingItem>
  extensions: Record<string, PricingItem>
  delivery: Record<string, PricingItem>
  services: Record<string, PricingItem>
  boltless_kit: Record<string, PricingItem>
  tiedown: Record<string, PricingItem>
}

export interface BusinessRule {
  key: string
  condition: Record<string, any>
  action: Record<string, any>
  message?: string
  priority: number
}

export interface Rules {
  ac001_extension: BusinessRule[]
  cargo_extension: BusinessRule[]
  incompatibility: BusinessRule[]
  recommendation: BusinessRule[]
}

export interface Settings {
  fees: {
    sales_tax_rate: number
    processing_fee_rate: number
  }
  contact: {
    phone: string
    support_url: string
    exit_url: string
  }
  conversion_factors: {
    inches_to_cm: number
    lbs_to_kg: number
  }
  colors: Record<string, string>
}

export interface ConfiguratorSettings {
  measurementRanges: MeasurementRanges
  pricing: Pricing
  rules: Rules
  settings: Settings
}

/**
 * Hook to fetch and cache configurator settings from the database
 * This replaces hardcoded values from src/types/configurator-v2.ts
 */
export function useConfiguratorSettings() {
  const [settings, setSettings] = useState<ConfiguratorSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/configurator/settings')

        if (!response.ok) {
          throw new Error('Failed to fetch configurator settings')
        }

        const data = await response.json()
        setSettings(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching configurator settings:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { settings, loading, error }
}

/**
 * Helper function to get AC001 extension based on height
 */
export function getAC001Extension(
  height: number,
  ranges: MeasurementRanges
): 'AC001-1' | 'AC001-2' | 'AC001-3' | null {
  if (height >= ranges.ac001_1_min && height <= ranges.ac001_1_max) {
    return 'AC001-1'
  }
  if (height >= ranges.ac001_2_min && height <= ranges.ac001_2_max) {
    return 'AC001-2'
  }
  if (height >= ranges.ac001_3_min && height <= ranges.ac001_3_max) {
    return 'AC001-3'
  }
  return null
}

/**
 * Helper function to check if cargo extension is required
 */
export function requiresCargoExtension(
  cargoLength: number,
  ranges: MeasurementRanges
): boolean {
  return cargoLength > ranges.cargo_extension_threshold
}

/**
 * Helper function to check business rule incompatibilities
 */
export function checkIncompatibility(
  rules: BusinessRule[],
  config: Record<string, any>
): { incompatible: boolean; message?: string } {
  for (const rule of rules) {
    const { condition } = rule
    let matches = true

    for (const [key, value] of Object.entries(condition)) {
      if (config[key] !== value) {
        matches = false
        break
      }
    }

    if (matches) {
      return { incompatible: true, message: rule.message }
    }
  }

  return { incompatible: false }
}

/**
 * Helper function to get recommendations
 */
export function getRecommendations(
  rules: BusinessRule[],
  config: Record<string, any>
): string[] {
  const recommendations: string[] = []

  for (const rule of rules) {
    const { condition } = rule
    let matches = true

    for (const [key, value] of Object.entries(condition)) {
      if (config[key] !== value) {
        matches = false
        break
      }
    }

    if (matches && rule.message) {
      recommendations.push(rule.message)
    }
  }

  return recommendations
}
