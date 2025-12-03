'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState } from 'react'

export function ProductSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams?.get('q') || '')

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    if (searchValue.trim()) {
      params.set('q', searchValue.trim())
    } else {
      params.delete('q')
    }

    startTransition(() => {
      router.replace(`/products?${params.toString()}`, { scroll: false })
    })
  }

  const handleClear = () => {
    setSearchValue('')
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.delete('q')
    startTransition(() => {
      router.replace(`/products?${params.toString()}`, { scroll: false })
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search products..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
          disabled={isPending}
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button
        onClick={handleSearch}
        disabled={isPending}
        className="bg-[#0B5394] hover:bg-[#0B5394]/90"
      >
        {isPending ? 'Searching...' : 'Search'}
      </Button>
    </div>
  )
}
