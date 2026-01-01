'use client'

import { useCallback, useMemo, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// Types for date range (matching date-range-picker)
interface DateRange {
  from?: Date
  to?: Date
}

export interface UseFilterParamsOptions<T extends Record<string, unknown>> {
  initialState: T
  paramPrefix?: string
  onFilterChange?: (filters: T) => void
}

export interface UseFilterParamsReturn<T extends Record<string, unknown>> {
  filters: T
  updateFilter: <K extends keyof T>(key: K, value: T[K]) => void
  resetFilters: () => void
  hasActiveFilters: boolean
  applyPreset: (preset: Partial<T>) => void
}

// Serialize a value for URL
function serializeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (value === 'all' || value === '') return null

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return null
    return value.join(',')
  }

  // Handle DateRange objects
  if (typeof value === 'object' && value !== null) {
    const dateRange = value as DateRange
    if ('from' in dateRange || 'to' in dateRange) {
      const parts: string[] = []
      if (dateRange.from) {
        parts.push(`from:${dateRange.from.toISOString().split('T')[0]}`)
      }
      if (dateRange.to) {
        parts.push(`to:${dateRange.to.toISOString().split('T')[0]}`)
      }
      return parts.length > 0 ? parts.join(',') : null
    }
    // Other objects - JSON stringify
    return JSON.stringify(value)
  }

  // Handle primitives
  return String(value)
}

// Deserialize a value from URL
function deserializeValue(
  value: string | null,
  defaultValue: unknown
): unknown {
  if (value === null || value === undefined) return defaultValue

  // Check if default is an array
  if (Array.isArray(defaultValue)) {
    return value.split(',').filter(Boolean)
  }

  // Check if default is a DateRange
  if (
    typeof defaultValue === 'object' &&
    defaultValue !== null &&
    ('from' in defaultValue || 'to' in defaultValue || Object.keys(defaultValue).length === 0)
  ) {
    // Parse date range format: "from:2025-01-01,to:2025-01-31"
    if (value.includes(':')) {
      const result: DateRange = {}
      const parts = value.split(',')
      for (const part of parts) {
        const [key, dateStr] = part.split(':')
        if (key === 'from' && dateStr) {
          result.from = new Date(dateStr)
        } else if (key === 'to' && dateStr) {
          result.to = new Date(dateStr)
        }
      }
      return Object.keys(result).length > 0 ? result : undefined
    }
    return undefined
  }

  // Check if default is a number
  if (typeof defaultValue === 'number') {
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  // Check if default is a boolean
  if (typeof defaultValue === 'boolean') {
    return value === 'true'
  }

  // Default to string
  return value
}

export function useFilterParams<T extends Record<string, unknown>>({
  initialState,
  paramPrefix = 'f_',
  onFilterChange,
}: UseFilterParamsOptions<T>): UseFilterParamsReturn<T> {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isInitialized, setIsInitialized] = useState(false)

  // Parse filters from URL on mount
  const filtersFromUrl = useMemo(() => {
    const result = { ...initialState }

    for (const key of Object.keys(initialState)) {
      const paramKey = `${paramPrefix}${key}`
      const urlValue = searchParams?.get(paramKey) ?? null
      if (urlValue !== null) {
        ;(result as Record<string, unknown>)[key] = deserializeValue(
          urlValue,
          initialState[key]
        )
      }
    }

    return result
  }, [searchParams, initialState, paramPrefix])

  // Local state - initialized from URL
  const [filters, setFilters] = useState<T>(filtersFromUrl)

  // Sync from URL on mount and when URL changes externally
  useEffect(() => {
    if (!isInitialized) {
      setFilters(filtersFromUrl)
      setIsInitialized(true)
    }
  }, [filtersFromUrl, isInitialized])

  // Update URL when filters change
  const syncToUrl = useCallback(
    (newFilters: T) => {
      const params = new URLSearchParams(searchParams?.toString() || '')

      // Remove all prefixed params first
      const keysToDelete: string[] = []
      params.forEach((_, key) => {
        if (key.startsWith(paramPrefix)) {
          keysToDelete.push(key)
        }
      })
      keysToDelete.forEach((key) => params.delete(key))

      // Add current filter values
      for (const [key, value] of Object.entries(newFilters)) {
        const serialized = serializeValue(value)
        if (serialized !== null) {
          params.set(`${paramPrefix}${key}`, serialized)
        }
      }

      // Update URL without scroll
      const queryString = params.toString()
      const currentPath = pathname || '/'
      const newUrl = queryString ? `${currentPath}?${queryString}` : currentPath
      router.replace(newUrl, { scroll: false })
    },
    [router, pathname, searchParams, paramPrefix]
  )

  // Update a single filter
  const updateFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value }
        syncToUrl(next)
        onFilterChange?.(next)
        return next
      })
    },
    [syncToUrl, onFilterChange]
  )

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(initialState)
    syncToUrl(initialState)
    onFilterChange?.(initialState)
  }, [initialState, syncToUrl, onFilterChange])

  // Apply a preset (partial filter state)
  const applyPreset = useCallback(
    (preset: Partial<T>) => {
      const next = { ...initialState, ...preset } as T
      setFilters(next)
      syncToUrl(next)
      onFilterChange?.(next)
    },
    [initialState, syncToUrl, onFilterChange]
  )

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      const initial = initialState[key]

      // Arrays - check length
      if (Array.isArray(value)) {
        return value.length > 0
      }

      // DateRange - check if has values
      if (typeof value === 'object' && value !== null) {
        const dr = value as DateRange
        return dr.from !== undefined || dr.to !== undefined
      }

      // Primitives - compare to initial
      return value !== initial && value !== 'all' && value !== ''
    })
  }, [filters, initialState])

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    applyPreset,
  }
}
