'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, RefreshCw, Globe, AlertCircle, Check, Loader2, ChevronDown, ChevronUp, Pencil, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Subscription {
  id: string
  name: string
  webcal_url: string
  sync_frequency_minutes: number
  last_synced_at: string | null
  last_error: string | null
  is_active: boolean
  created_at: string
}

interface CalendarEvent {
  id: string
  external_uid: string
  title: string
  description: string | null
  start_at: string
  end_at: string | null
  all_day: boolean
  location: string | null
}

export function SubscriptionsManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [webcalUrl, setWebcalUrl] = useState('')
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)

  // Expanded subscription states
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsTotal, setEventsTotal] = useState(0)

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [editName, setEditName] = useState('')
  const [editFrequency, setEditFrequency] = useState('60')
  const [saving, setSaving] = useState(false)

  // Sync states
  const [syncingId, setSyncingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/calendar/subscriptions')
      if (response.status === 401) {
        toast.error('Please sign in to view subscriptions')
        return
      }
      const data = await response.json()
      if (data.success) {
        setSubscriptions(data.subscriptions)
      } else {
        toast.error(data.error || 'Failed to load subscriptions')
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
      toast.error('Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const addSubscription = async () => {
    if (!webcalUrl.trim()) {
      toast.error('Webcal URL is required')
      return
    }

    setAdding(true)
    try {
      const response = await fetch('/api/calendar/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'External Calendar',
          webcalUrl: webcalUrl,
        }),
      })
      if (response.status === 401) {
        toast.error('Please sign in to add subscriptions')
        return
      }
      const data = await response.json()

      if (data.success) {
        toast.success('Subscription added')
        fetchSubscriptions()
        resetAddDialog()
      } else {
        toast.error(data.error || 'Failed to add subscription')
      }
    } catch (error) {
      toast.error('Failed to add subscription')
    } finally {
      setAdding(false)
    }
  }

  const removeSubscription = async (id: string) => {
    if (!confirm('Remove this subscription? All imported events will be deleted.')) {
      return
    }

    try {
      const response = await fetch(`/api/calendar/subscriptions?id=${id}`, {
        method: 'DELETE',
      })
      if (response.status === 401) {
        toast.error('Please sign in to remove subscriptions')
        return
      }
      const data = await response.json()

      if (data.success) {
        toast.success('Subscription removed')
        if (expandedId === id) {
          setExpandedId(null)
          setEvents([])
        }
        fetchSubscriptions()
      } else {
        toast.error(data.error || 'Failed to remove subscription')
      }
    } catch (error) {
      toast.error('Failed to remove subscription')
    }
  }

  const toggleExpand = async (sub: Subscription) => {
    if (expandedId === sub.id) {
      setExpandedId(null)
      setEvents([])
      return
    }

    setExpandedId(sub.id)
    setEventsLoading(true)
    setEvents([])

    try {
      const response = await fetch(`/api/calendar/subscriptions/${sub.id}/events?limit=20&upcoming=true`)
      const data = await response.json()
      if (data.success) {
        setEvents(data.events)
        setEventsTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setEventsLoading(false)
    }
  }

  const openEditDialog = (sub: Subscription) => {
    setEditingSub(sub)
    setEditName(sub.name)
    setEditFrequency(String(sub.sync_frequency_minutes))
    setEditDialogOpen(true)
  }

  const saveEdit = async () => {
    if (!editingSub) return

    setSaving(true)
    try {
      const response = await fetch('/api/calendar/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSub.id,
          name: editName,
          syncFrequencyMinutes: parseInt(editFrequency),
        }),
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Subscription updated')
        setEditDialogOpen(false)
        fetchSubscriptions()
      } else {
        toast.error(data.error || 'Failed to update subscription')
      }
    } catch (error) {
      toast.error('Failed to update subscription')
    } finally {
      setSaving(false)
    }
  }

  const syncNow = async (sub: Subscription) => {
    setSyncingId(sub.id)
    try {
      const response = await fetch(`/api/calendar/subscriptions/${sub.id}/sync`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.success) {
        toast.success(`Synced: ${data.added} added, ${data.updated} updated, ${data.deleted} removed`)
        fetchSubscriptions()
        // Refresh events if expanded
        if (expandedId === sub.id) {
          toggleExpand(sub)
        }
      } else {
        toast.error(data.error || 'Failed to sync')
      }
    } catch (error) {
      toast.error('Failed to sync subscription')
    } finally {
      setSyncingId(null)
    }
  }

  const resetAddDialog = () => {
    setWebcalUrl('')
    setName('')
    setAddDialogOpen(false)
  }

  const formatEventDate = (dateStr: string, allDay: boolean) => {
    const date = new Date(dateStr)
    if (allDay) {
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    }
    return date.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Calendar Subscriptions</h2>
          <p className="text-sm text-muted-foreground">
            Subscribe to external calendars to block busy times
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Subscription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Calendar Subscription</DialogTitle>
              <DialogDescription>
                Enter a webcal or iCal URL to subscribe to an external calendar
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webcalUrl">Webcal URL</Label>
                <Input
                  id="webcalUrl"
                  value={webcalUrl}
                  onChange={(e) => setWebcalUrl(e.target.value)}
                  placeholder="webcal://example.com/calendar.ics"
                />
                <p className="text-xs text-muted-foreground">
                  Also supports https:// URLs to .ics files
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subName">Name (optional)</Label>
                <Input
                  id="subName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Google Calendar"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetAddDialog}>
                Cancel
              </Button>
              <Button onClick={addSubscription} disabled={adding}>
                {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Subscription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {subscriptions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No subscriptions yet</h3>
          <p className="text-muted-foreground mt-1">
            Add a webcal subscription to import external events
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className={`border rounded-lg overflow-hidden ${sub.is_active ? '' : 'opacity-50'}`}
            >
              {/* Subscription Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => toggleExpand(sub)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium">{sub.name}</p>
                    {sub.last_error && (
                      <span className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        Error
                      </span>
                    )}
                    {sub.last_synced_at && !sub.last_error && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <Check className="h-3 w-3" />
                        Synced
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {sub.webcal_url}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Syncs every {sub.sync_frequency_minutes} min
                    {sub.last_synced_at && ` • Last synced ${new Date(sub.last_synced_at).toLocaleString()}`}
                  </p>
                  {sub.last_error && (
                    <p className="text-xs text-red-600 mt-1">{sub.last_error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => syncNow(sub)}
                    disabled={syncingId === sub.id}
                    title="Sync now"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncingId === sub.id ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(sub)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubscription(sub.id)}
                    className="text-destructive hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {expandedId === sub.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded Events Section */}
              {expandedId === sub.id && (
                <div className="border-t bg-muted/30 p-4">
                  {eventsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : events.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No upcoming events
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-3">
                        Showing {events.length} of {eventsTotal} upcoming events
                      </p>
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-2 rounded bg-background"
                        >
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatEventDate(event.start_at, event.all_day)}
                              {event.all_day && ' (All day)'}
                            </p>
                            {event.location && (
                              <p className="text-xs text-muted-foreground truncate">
                                {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update the subscription name and sync frequency
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editFrequency">Sync Frequency</Label>
              <Select value={editFrequency} onValueChange={setEditFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every hour</SelectItem>
                  <SelectItem value="120">Every 2 hours</SelectItem>
                  <SelectItem value="360">Every 6 hours</SelectItem>
                  <SelectItem value="720">Every 12 hours</SelectItem>
                  <SelectItem value="1440">Once a day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SubscriptionsManager
