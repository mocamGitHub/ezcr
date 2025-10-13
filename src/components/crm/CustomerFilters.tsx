'use client'

import { useState, useEffect } from 'react'
import type { CustomerListFilters } from '@/types/crm'
import { getCustomerTags } from '@/actions/crm'
import type { CustomerTag } from '@/types/crm'

interface CustomerFiltersProps {
  filters: CustomerListFilters
  onFilterChange: (filters: CustomerListFilters) => void
}

export function CustomerFilters({ filters, onFilterChange }: CustomerFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [availableTags, setAvailableTags] = useState<CustomerTag[]>([])
  const [localFilters, setLocalFilters] = useState<CustomerListFilters>(filters)

  useEffect(() => {
    loadTags()
  }, [])

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const loadTags = async () => {
    try {
      const tags = await getCustomerTags()
      setAvailableTags(tags)
    } catch (err) {
      console.error('Failed to load tags:', err)
    }
  }

  const handleApplyFilters = () => {
    onFilterChange(localFilters)
  }

  const handleClearFilters = () => {
    const emptyFilters: CustomerListFilters = {}
    setLocalFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <div className="border rounded-lg">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <span>{isExpanded ? '▼' : '▶'}</span>
            Filters
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-primary text-primary-foreground rounded-full">
                {Object.keys(filters).length}
              </span>
            )}
          </button>
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-md mx-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={localFilters.search || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleApplyFilters()
              }
            }}
            className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="border-t px-4 py-4 bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Lifetime Value Range */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Lifetime Value</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.min_ltv || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, min_ltv: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-2 py-1.5 text-sm border rounded-md"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.max_ltv || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, max_ltv: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-2 py-1.5 text-sm border rounded-md"
                />
              </div>
            </div>

            {/* Minimum Orders */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Minimum Orders</label>
              <input
                type="number"
                placeholder="e.g. 2"
                value={localFilters.min_orders || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, min_orders: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-2 py-1.5 text-sm border rounded-md"
              />
            </div>

            {/* Health Score */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Min Health Score</label>
              <input
                type="number"
                placeholder="0-100"
                min="0"
                max="100"
                value={localFilters.health_score_min || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, health_score_min: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-2 py-1.5 text-sm border rounded-md"
              />
            </div>

            {/* Last Order After */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Last Order After</label>
              <input
                type="date"
                value={localFilters.last_order_after || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, last_order_after: e.target.value || undefined })}
                className="w-full px-2 py-1.5 text-sm border rounded-md"
              />
            </div>

            {/* Tags */}
            {availableTags.length > 0 && (
              <div className="col-span-full">
                <label className="text-sm font-medium block mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const isSelected = localFilters.tags?.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        onClick={() => {
                          const currentTags = localFilters.tags || []
                          const newTags = isSelected
                            ? currentTags.filter(id => id !== tag.id)
                            : [...currentTags, tag.id]
                          setLocalFilters({ ...localFilters, tags: newTags.length > 0 ? newTags : undefined })
                        }}
                        className={`px-3 py-1.5 text-sm border rounded-full transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted hover:border-primary'
                        }`}
                        style={isSelected ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Has Open Tasks */}
            <div className="col-span-full flex items-center gap-2">
              <input
                type="checkbox"
                id="has_open_tasks"
                checked={localFilters.has_open_tasks || false}
                onChange={(e) => setLocalFilters({ ...localFilters, has_open_tasks: e.target.checked || undefined })}
                className="w-4 h-4"
              />
              <label htmlFor="has_open_tasks" className="text-sm font-medium cursor-pointer">
                Has open tasks
              </label>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
