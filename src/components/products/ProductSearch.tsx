'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState, useEffect, useRef } from 'react'

export function ProductSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')
  const debounceRef = useRef<NodeJS.Timeout>()

  // Update local state when URL changes
  useEffect(() => {
    setSearchValue(searchParams.get('q') || '')
  }, [searchParams])

  const handleChange = (value: string) => {
    setSearchValue(value)

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }

      startTransition(() => {
        router.push(`/products?${params.toString()}`)
      })
    }, 300)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search products..."
        value={searchValue}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-10"
        disabled={isPending}
      />
    </div>
  )
}
