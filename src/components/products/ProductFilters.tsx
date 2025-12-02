'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { X } from 'lucide-react'

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const availableOnly = searchParams?.get('available') === 'true'
  const initialMinPrice = Number(searchParams?.get('minPrice')) || 0
  const initialMaxPrice = Number(searchParams?.get('maxPrice')) || 3000
  const [priceRange, setPriceRange] = useState([initialMinPrice, initialMaxPrice])
  const [isDragging, setIsDragging] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Sync state with URL params when they change externally
  useEffect(() => {
    const urlMinPrice = Number(searchParams?.get('minPrice')) || 0
    const urlMaxPrice = Number(searchParams?.get('maxPrice')) || 3000
    if (!isDragging) {
      setPriceRange([urlMinPrice, urlMaxPrice])
    }
  }, [searchParams, isDragging])

  const handleAvailableToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    if (checked) {
      params.set('available', 'true')
    } else {
      params.delete('available')
    }

    startTransition(() => {
      router.push(`/products?${params.toString()}`)
    })
  }

  // Apply price filter with debounce
  const applyPriceFilter = useCallback((values: number[]) => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    if (values[0] > 0) {
      params.set('minPrice', values[0].toString())
    } else {
      params.delete('minPrice')
    }

    if (values[1] < 3000) {
      params.set('maxPrice', values[1].toString())
    } else {
      params.delete('maxPrice')
    }

    startTransition(() => {
      router.push(`/products?${params.toString()}`)
    })
  }, [router, searchParams, startTransition])

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values)
    setIsDragging(true)

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer to apply filter after user stops dragging
    debounceTimer.current = setTimeout(() => {
      setIsDragging(false)
      applyPriceFilter(values)
    }, 500)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const clearFilters = () => {
    const params = new URLSearchParams()
    const category = searchParams?.get('category')

    // Only keep category filter
    if (category) params.set('category', category)

    setPriceRange([0, 3000])

    startTransition(() => {
      router.push(`/products?${params.toString()}`)
    })
  }

  const hasFilters = availableOnly ||
                     Number(searchParams?.get('minPrice')) > 0 ||
                     Number(searchParams?.get('maxPrice')) < 3000 ||
                     searchParams?.get('q')

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-background">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={isPending}
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Available Only Filter */}
      <div className={`space-y-2 p-3 rounded-lg transition-colors ${availableOnly ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : ''}`}>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="available"
            checked={availableOnly}
            onCheckedChange={handleAvailableToggle}
            disabled={isPending}
            className={availableOnly ? 'border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:text-white' : ''}
          />
          <Label htmlFor="available" className={`cursor-pointer font-medium ${availableOnly ? 'text-green-700 dark:text-green-300' : ''}`}>
            Available Now {availableOnly && '✓'}
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          {availableOnly ? 'Showing only in-stock items' : 'Show only in-stock items'}
        </p>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Price Range</Label>
          {(isPending || isDragging) && (
            <span className="text-xs text-muted-foreground animate-pulse">
              {isDragging ? 'Adjusting...' : 'Loading...'}
            </span>
          )}
        </div>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={handlePriceChange}
            max={3000}
            step={50}
            minStepsBetweenThumbs={1}
            disabled={isPending}
          />
        </div>
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="bg-muted px-2 py-1 rounded">${priceRange[0].toLocaleString()}</span>
          <span className="text-muted-foreground">to</span>
          <span className="bg-muted px-2 py-1 rounded">${priceRange[1].toLocaleString()}{priceRange[1] >= 3000 ? '+' : ''}</span>
        </div>
        {(priceRange[0] > 0 || priceRange[1] < 3000) && (
          <p className="text-xs text-muted-foreground text-center">
            Price filter active - drag to adjust
          </p>
        )}
      </div>
    </div>
  )
}
