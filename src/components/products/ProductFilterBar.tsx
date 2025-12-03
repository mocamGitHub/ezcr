'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { ProductCategory, ProductSortOption } from '@/lib/supabase/queries'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProductFilterBarProps {
  categories: ProductCategory[]
}

const sortOptions: { value: ProductSortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

export function ProductFilterBar({ categories }: ProductFilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const activeCategory = searchParams?.get('category')
  const availableOnly = searchParams?.get('available') === 'true'
  const currentSort = (searchParams?.get('sort') as ProductSortOption) || 'featured'

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    startTransition(() => {
      router.push(`/products?${params.toString()}`)
    })
  }

  const handleCategoryClick = (categorySlug: string | null) => {
    const params = new URLSearchParams()

    // Preserve sort and available filters when changing category
    if (availableOnly) params.set('available', 'true')
    if (currentSort !== 'featured') params.set('sort', currentSort)
    if (categorySlug) params.set('category', categorySlug)

    startTransition(() => {
      router.push(`/products?${params.toString()}`)
    })
  }

  const handleAvailableToggle = (checked: boolean) => {
    updateParams({ available: checked ? 'true' : null })
  }

  const handleSortChange = (value: ProductSortOption) => {
    updateParams({ sort: value === 'featured' ? null : value })
  }

  return (
    <div className="space-y-4">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryClick(null)}
          disabled={isPending}
          className={`px-4 py-2 rounded-full border-2 font-medium transition-colors disabled:opacity-50 ${
            !activeCategory
              ? 'border-[#0B5394] bg-[#0B5394] text-white'
              : 'border-gray-300 hover:border-[#0B5394] hover:text-[#0B5394] dark:border-gray-600 dark:hover:border-[#0B5394]'
          }`}
        >
          All Products
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.slug)}
            disabled={isPending}
            className={`px-4 py-2 rounded-full border-2 font-medium transition-colors disabled:opacity-50 ${
              activeCategory === category.slug
                ? 'border-[#0B5394] bg-[#0B5394] text-white'
                : 'border-gray-300 hover:border-[#0B5394] hover:text-[#0B5394] dark:border-gray-600 dark:hover:border-[#0B5394]'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
        {/* In Stock Toggle */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          availableOnly
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : ''
        }`}>
          <Checkbox
            id="available"
            checked={availableOnly}
            onCheckedChange={handleAvailableToggle}
            disabled={isPending}
            className={availableOnly ? 'border-green-500 data-[state=checked]:bg-green-500' : ''}
          />
          <Label
            htmlFor="available"
            className={`cursor-pointer text-sm font-medium ${
              availableOnly ? 'text-green-700 dark:text-green-300' : ''
            }`}
          >
            In Stock Only
          </Label>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 ml-auto">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</Label>
          <Select
            value={currentSort}
            onValueChange={handleSortChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
