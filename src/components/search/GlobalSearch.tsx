'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Calendar, FileText, Loader2, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getSearchIndex, type SearchResult, type SearchableItem } from '@/lib/search/searchIndex'
import { syncSearchIndex, isSyncNeeded } from '@/lib/search/syncService'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface GlobalSearchProps {
  onSelect?: (item: SearchableItem) => void
}

const typeIcons = {
  booking: Calendar,
  event_type: Calendar,
  template: FileText,
  contact: null,
}

const typeLabels = {
  booking: 'Booking',
  event_type: 'Event Type',
  template: 'Template',
  contact: 'Contact',
}

export function GlobalSearch({ onSelect }: GlobalSearchProps) {
  const router = useRouter()
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [syncing, setSyncing] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)

      // Sync if needed
      if (isSyncNeeded()) {
        syncData()
      }
    } else {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  // Search as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const index = getSearchIndex()
    const searchResults = index.search(query, { limit: 10 })
    setResults(searchResults)
    setSelectedIndex(0)
  }, [query])

  const syncData = async () => {
    setSyncing(true)
    try {
      if (tenantId) {
        await syncSearchIndex(tenantId)
      } else {
        // Add demo data for testing when no tenant context
        const index = getSearchIndex()
        if (index.count === 0) {
          index.addItems([
            { id: 'demo:booking:1', type: 'booking', title: 'Team Standup', subtitle: 'scheduled' },
            { id: 'demo:booking:2', type: 'booking', title: 'Client Call - Acme Corp', subtitle: 'scheduled' },
            { id: 'demo:booking:3', type: 'booking', title: 'Product Demo', subtitle: 'completed' },
            { id: 'demo:event:1', type: 'event_type', title: 'intro_call', subtitle: 'Cal.com ID: 4259719' },
            { id: 'demo:event:2', type: 'event_type', title: 'consultation', subtitle: 'Cal.com ID: 4259718' },
            { id: 'demo:template:1', type: 'template', title: 'Booking Confirmation', subtitle: 'email • booking_created' },
            { id: 'demo:template:2', type: 'template', title: 'Reminder 24h', subtitle: 'sms • reminder_24h' },
          ])
        }
      }
    } catch (error) {
      console.error('Failed to sync search index:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleSelect = useCallback((item: SearchableItem) => {
    setOpen(false)
    onSelect?.(item)

    // Navigate based on item type
    const itemId = item.id.split(':').pop() // Extract actual ID from prefixed ID
    switch (item.type) {
      case 'booking':
        router.push(`/admin/scheduler/bookings/${itemId}`)
        break
      case 'event_type':
        router.push('/admin/scheduler/event-types')
        break
      case 'template':
        router.push(`/admin/notifications/templates/${itemId}`)
        break
      default:
        break
    }
  }, [onSelect, router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex].item)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border rounded-md hover:bg-accent transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-muted rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Global Search</DialogTitle>
          </DialogHeader>

          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search bookings, event types, templates..."
              className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {syncing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {query && (
              <button onClick={() => setQuery('')} className="p-1">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto py-2">
            {results.length === 0 && query && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            )}

            {results.length === 0 && !query && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <p>Type to search across bookings, event types, and templates</p>
                <button
                  onClick={syncData}
                  disabled={syncing}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  {syncing ? 'Syncing...' : 'Refresh index'}
                </button>
              </div>
            )}

            {results.map((result, index) => {
              const Icon = typeIcons[result.item.type] || Clock
              return (
                <button
                  key={result.item.id}
                  onClick={() => handleSelect(result.item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent transition-colors',
                    index === selectedIndex && 'bg-accent'
                  )}
                >
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.item.title}</p>
                    {result.item.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">
                        {result.item.subtitle}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {typeLabels[result.item.type]}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              {getSearchIndex().count} items indexed
            </span>
            <span>
              ↑↓ Navigate • Enter Select • Esc Close
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default GlobalSearch
