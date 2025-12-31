'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Pricing data structure (matches /api/configurator/settings response)
export interface PricingData {
  models: Record<string, { name: string; price: number; description?: string }>
  extensions: Record<string, { name: string; price: number; description?: string }>
  delivery: Record<string, { name: string; price: number; description?: string }>
  services: Record<string, { name: string; price: number; description?: string }>
  boltless_kit: Record<string, { name: string; price: number; description?: string }>
  tiedown: Record<string, { name: string; price: number; description?: string }>
}

export interface ConfiguratorSettings {
  measurementRanges: Record<string, number>
  pricing: PricingData
  rules: Record<string, unknown[]>
  settings: Record<string, unknown>
}

interface PricingContextType {
  pricing: PricingData | null
  settings: ConfiguratorSettings | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const PricingContext = createContext<PricingContextType | undefined>(undefined)

export function usePricing() {
  const context = useContext(PricingContext)
  if (!context) {
    throw new Error('usePricing must be used within a PricingProvider')
  }
  return context
}

interface PricingProviderProps {
  children: ReactNode
}

export function PricingProvider({ children }: PricingProviderProps) {
  const [settings, setSettings] = useState<ConfiguratorSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPricing = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/configurator/settings')

      if (!response.ok) {
        throw new Error('Failed to load configurator settings')
      }

      const data: ConfiguratorSettings = await response.json()

      // Validate that pricing data exists
      if (!data.pricing || Object.keys(data.pricing).length === 0) {
        throw new Error('No pricing data available')
      }

      // Validate required pricing categories
      const requiredCategories = ['models', 'extensions', 'delivery', 'services']
      for (const category of requiredCategories) {
        if (!data.pricing[category as keyof PricingData]) {
          throw new Error(`Missing required pricing category: ${category}`)
        }
      }

      setSettings(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching pricing:', err)
      setError(err instanceof Error ? err.message : 'Failed to load pricing')
      setSettings(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPricing()
  }, [])

  const value: PricingContextType = {
    pricing: settings?.pricing ?? null,
    settings,
    loading,
    error,
    refetch: fetchPricing,
  }

  return (
    <PricingContext.Provider value={value}>
      {children}
    </PricingContext.Provider>
  )
}

// Helper hook to get a specific price from the pricing data
export function usePrice(
  category: keyof PricingData,
  itemKey: string
): { price: number; name: string; loading: boolean; error: string | null } {
  const { pricing, loading, error } = usePricing()

  if (loading) {
    return { price: 0, name: '', loading: true, error: null }
  }

  if (error || !pricing) {
    return { price: 0, name: '', loading: false, error: error || 'No pricing data' }
  }

  const item = pricing[category]?.[itemKey]

  if (!item) {
    return { price: 0, name: '', loading: false, error: `Price not found: ${category}.${itemKey}` }
  }

  return { price: item.price, name: item.name, loading: false, error: null }
}

// Helper to get all prices for a category
export function usePriceCategory(
  category: keyof PricingData
): { items: Record<string, { name: string; price: number }> | null; loading: boolean; error: string | null } {
  const { pricing, loading, error } = usePricing()

  if (loading) {
    return { items: null, loading: true, error: null }
  }

  if (error || !pricing) {
    return { items: null, loading: false, error: error || 'No pricing data' }
  }

  return { items: pricing[category] ?? null, loading: false, error: null }
}
