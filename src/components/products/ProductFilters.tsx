'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { X } from 'lucide-react'

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const availableOnly = searchParams.get('available') === 'true'
  const [priceRange, setPriceRange] = useState([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 3000
  ])

  const handleAvailableToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString())

    if (checked) {
      params.set('available', 'true')
    } else {
      params.delete('available')
    }

    startTransition(() => {
      router.push(`/products?${params.toString()}`)
    })
  }

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values)
  }

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (priceRange[0] > 0) {
      params.set('minPrice', priceRange[0].toString())
    } else {
      params.delete('minPrice')
    }

    if (priceRange[1] < 3000) {
      params.set('maxPrice', priceRange[1].toString())
    } else {
      params.delete('maxPrice')
    }

    startTransition(() => {
      router.push(`/products?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    const params = new URLSearchParams()
    const category = searchParams.get('category')
    const query = searchParams.get('q')

    if (category) params.set('category', category)
    if (query) params.set('q', query)

    setPriceRange([0, 3000])

    startTransition(() => {
      router.push(`/products?${params.toString()}`)
    })
  }

  const hasFilters = availableOnly ||
                     Number(searchParams.get('minPrice')) > 0 ||
                     Number(searchParams.get('maxPrice')) < 3000

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
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="available"
            checked={availableOnly}
            onCheckedChange={handleAvailableToggle}
            disabled={isPending}
          />
          <Label htmlFor="available" className="cursor-pointer">
            Available Now
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Show only in-stock items
        </p>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-4">
        <Label>Price Range</Label>
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
        <div className="flex items-center justify-between text-sm">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}{priceRange[1] >= 3000 ? '+' : ''}</span>
        </div>
        <Button
          onClick={applyPriceFilter}
          size="sm"
          className="w-full"
          disabled={isPending}
        >
          Apply Price Filter
        </Button>
      </div>
    </div>
  )
}
