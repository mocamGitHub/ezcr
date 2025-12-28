/**
 * Local-First Search Index
 * Uses Fuse.js for fuzzy search with browser-side caching
 */

import Fuse from 'fuse.js'

export interface SearchableItem {
  id: string
  type: 'booking' | 'contact' | 'event_type' | 'template'
  title: string
  subtitle?: string
  description?: string
  metadata?: Record<string, unknown>
  timestamp?: Date
}

export interface SearchResult {
  item: SearchableItem
  score: number
  matches?: readonly Fuse.FuseResultMatch[]
}

// Fuse.js options for fuzzy matching
const fuseOptions: Fuse.IFuseOptions<SearchableItem> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'subtitle', weight: 0.3 },
    { name: 'description', weight: 0.2 },
    { name: 'type', weight: 0.1 },
  ],
  threshold: 0.4, // Lower = stricter matching
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
}

/**
 * Search index class - manages the in-memory index
 */
export class SearchIndex {
  private items: SearchableItem[] = []
  private fuse: Fuse<SearchableItem> | null = null
  private lastSyncTime: Date | null = null

  constructor() {
    this.loadFromStorage()
  }

  /**
   * Add items to the index
   */
  addItems(items: SearchableItem[]): void {
    // Merge by ID, replacing existing items
    const itemMap = new Map(this.items.map((item) => [item.id, item]))
    for (const item of items) {
      itemMap.set(item.id, item)
    }
    this.items = Array.from(itemMap.values())
    this.rebuildIndex()
    this.saveToStorage()
  }

  /**
   * Remove items from the index
   */
  removeItems(ids: string[]): void {
    const idSet = new Set(ids)
    this.items = this.items.filter((item) => !idSet.has(item.id))
    this.rebuildIndex()
    this.saveToStorage()
  }

  /**
   * Clear all items from the index
   */
  clear(): void {
    this.items = []
    this.fuse = null
    this.lastSyncTime = null
    this.clearStorage()
  }

  /**
   * Search the index
   */
  search(query: string, options?: { limit?: number; type?: SearchableItem['type'] }): SearchResult[] {
    if (!this.fuse || !query.trim()) {
      return []
    }

    let results = this.fuse.search(query)

    // Filter by type if specified
    if (options?.type) {
      results = results.filter((r) => r.item.type === options.type)
    }

    // Apply limit
    if (options?.limit && options.limit > 0) {
      results = results.slice(0, options.limit)
    }

    return results.map((r) => ({
      item: r.item,
      score: r.score ?? 0,
      matches: r.matches,
    }))
  }

  /**
   * Get all items of a specific type
   */
  getItemsByType(type: SearchableItem['type']): SearchableItem[] {
    return this.items.filter((item) => item.type === type)
  }

  /**
   * Get item count
   */
  get count(): number {
    return this.items.length
  }

  /**
   * Get last sync time
   */
  get lastSync(): Date | null {
    return this.lastSyncTime
  }

  /**
   * Set last sync time
   */
  setLastSyncTime(time: Date): void {
    this.lastSyncTime = time
    this.saveToStorage()
  }

  // Private methods

  private rebuildIndex(): void {
    this.fuse = new Fuse(this.items, fuseOptions)
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('nx_search_index')
      if (stored) {
        const data = JSON.parse(stored)
        this.items = data.items || []
        this.lastSyncTime = data.lastSyncTime ? new Date(data.lastSyncTime) : null
        this.rebuildIndex()
      }
    } catch (error) {
      console.warn('Failed to load search index from storage:', error)
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = {
        items: this.items,
        lastSyncTime: this.lastSyncTime?.toISOString() || null,
      }
      localStorage.setItem('nx_search_index', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save search index to storage:', error)
    }
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem('nx_search_index')
    } catch (error) {
      console.warn('Failed to clear search index from storage:', error)
    }
  }
}

// Singleton instance
let searchIndexInstance: SearchIndex | null = null

/**
 * Get the global search index instance
 */
export function getSearchIndex(): SearchIndex {
  if (!searchIndexInstance) {
    searchIndexInstance = new SearchIndex()
  }
  return searchIndexInstance
}

/**
 * Convert booking to searchable item
 */
export function bookingToSearchable(booking: {
  id: string
  title?: string
  attendee_email: string
  start_at: string
  status: string
}): SearchableItem {
  return {
    id: `booking:${booking.id}`,
    type: 'booking',
    title: booking.title || booking.attendee_email,
    subtitle: booking.status,
    description: new Date(booking.start_at).toLocaleString(),
    timestamp: new Date(booking.start_at),
    metadata: { status: booking.status },
  }
}

/**
 * Convert event type to searchable item
 */
export function eventTypeToSearchable(eventType: {
  id: string
  purpose: string
  cal_event_type_id: number
}): SearchableItem {
  return {
    id: `event_type:${eventType.id}`,
    type: 'event_type',
    title: eventType.purpose,
    subtitle: `Cal.com ID: ${eventType.cal_event_type_id}`,
  }
}

/**
 * Convert template to searchable item
 */
export function templateToSearchable(template: {
  id: string
  name: string
  event_type: string
  channel: string
}): SearchableItem {
  return {
    id: `template:${template.id}`,
    type: 'template',
    title: template.name,
    subtitle: `${template.event_type} - ${template.channel}`,
  }
}
