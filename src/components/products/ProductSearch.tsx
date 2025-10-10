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
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (value: string) => {
    setSearchValue(value)

    // Store current selection/cursor position
    const selectionStart = inputRef.current?.selectionStart
    const selectionEnd = inputRef.current?.selectionEnd

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
        router.push(`/products?${params.toString()}`, { scroll: false })

        // Restore focus and cursor position after navigation
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus()
            if (selectionStart !== null && selectionEnd !== null) {
              inputRef.current.setSelectionRange(selectionStart, selectionEnd)
            }
          }
        })
      })
    }, 300)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
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
