'use client'

import * as React from 'react'
import type { DateRange } from 'react-day-picker'
import { X, Filter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { DateRangePicker } from '@/components/ui/date-range-picker'

// ============================================
// Filter Types
// ============================================

export interface SelectFilterOption {
  value: string
  label: string
  count?: number
}

export interface SelectFilterConfig {
  type: 'select'
  key: string
  label: string
  options: SelectFilterOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  allLabel?: string
}

export interface MultiSelectFilterConfig {
  type: 'multiselect'
  key: string
  label: string
  options: SelectFilterOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export interface DateRangeFilterConfig {
  type: 'daterange'
  key: string
  label: string
  value?: DateRange
  onChange: (value: DateRange | undefined) => void
  placeholder?: string
  presets?: boolean
}

export type FilterConfig =
  | SelectFilterConfig
  | MultiSelectFilterConfig
  | DateRangeFilterConfig

// ============================================
// Filter Components
// ============================================

function SelectFilter({ config }: { config: SelectFilterConfig }) {
  return (
    <Select value={config.value || 'all'} onValueChange={config.onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={config.placeholder || config.label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{config.allLabel || 'All'}</SelectItem>
        {config.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
            {option.count !== undefined && (
              <span className="ml-2 text-muted-foreground">({option.count})</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function MultiSelectFilter({ config }: { config: MultiSelectFilterConfig }) {
  const [open, setOpen] = React.useState(false)
  const selectedCount = config.value.length

  const handleToggle = (value: string) => {
    if (config.value.includes(value)) {
      config.onChange(config.value.filter((v) => v !== value))
    } else {
      config.onChange([...config.value, value])
    }
  }

  const handleClear = () => {
    config.onChange([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[180px] justify-between">
          <span className="truncate">
            {selectedCount > 0 ? (
              <>
                {config.label}
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {selectedCount}
                </Badge>
              </>
            ) : (
              config.placeholder || config.label
            )}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <div className="p-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium">{config.label}</span>
          {selectedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
          {config.options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={config.value.includes(option.value)}
                onCheckedChange={() => handleToggle(option.value)}
              />
              <span className="text-sm flex-1">{option.label}</span>
              {option.count !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {option.count}
                </span>
              )}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DateRangeFilter({ config }: { config: DateRangeFilterConfig }) {
  return (
    <DateRangePicker
      value={config.value}
      onChange={config.onChange}
      placeholder={config.placeholder || config.label}
      presets={config.presets !== false}
      className="w-[240px]"
    />
  )
}

// ============================================
// AdminFilterBar Component
// ============================================

interface AdminFilterBarProps {
  filters: FilterConfig[]
  onClearAll?: () => void
  className?: string
  /** Show filter icon and count */
  showFilterIcon?: boolean
}

/**
 * Reusable filter bar component for admin tables.
 * Supports select, multi-select, and date range filters.
 */
export function AdminFilterBar({
  filters,
  onClearAll,
  className,
  showFilterIcon = false,
}: AdminFilterBarProps) {
  // Count active filters
  const activeFilterCount = filters.reduce((count, filter) => {
    if (filter.type === 'select' && filter.value && filter.value !== 'all') {
      return count + 1
    }
    if (filter.type === 'multiselect' && filter.value.length > 0) {
      return count + 1
    }
    if (filter.type === 'daterange' && filter.value?.from) {
      return count + 1
    }
    return count
  }, 0)

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {showFilterIcon && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </div>
      )}

      {filters.map((filter) => {
        switch (filter.type) {
          case 'select':
            return <SelectFilter key={filter.key} config={filter} />
          case 'multiselect':
            return <MultiSelectFilter key={filter.key} config={filter} />
          case 'daterange':
            return <DateRangeFilter key={filter.key} config={filter} />
          default:
            return null
        }
      })}

      {onClearAll && activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-muted-foreground"
          onClick={onClearAll}
        >
          <X className="h-4 w-4 mr-1" />
          Clear all
        </Button>
      )}
    </div>
  )
}

// ============================================
// Hook for managing filter state
// ============================================

interface UseFiltersOptions<T extends Record<string, unknown>> {
  initialState: T
  onFilterChange?: (filters: T) => void
}

/**
 * Hook for managing filter state with reset functionality.
 */
export function useFilters<T extends Record<string, unknown>>({
  initialState,
  onFilterChange,
}: UseFiltersOptions<T>) {
  const [filters, setFilters] = React.useState<T>(initialState)

  const updateFilter = React.useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value }
        onFilterChange?.(next)
        return next
      })
    },
    [onFilterChange]
  )

  const resetFilters = React.useCallback(() => {
    setFilters(initialState)
    onFilterChange?.(initialState)
  }, [initialState, onFilterChange])

  const hasActiveFilters = React.useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      const initial = initialState[key]
      if (Array.isArray(value)) {
        return value.length > 0
      }
      if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length > 0
      }
      return value !== initial && value !== 'all' && value !== ''
    })
  }, [filters, initialState])

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  }
}
