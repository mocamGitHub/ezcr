'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, RefreshCw, Globe, AlertCircle, Check, Loader2 } from 'lucide-react'
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

export function SubscriptionsManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [webcalUrl, setWebcalUrl] = useState('')
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/calendar/subscriptions')
      const data = await response.json()
      if (data.success) {
        setSubscriptions(data.subscriptions)
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
      const data = await response.json()

      if (data.success) {
        toast.success('Subscription removed')
        fetchSubscriptions()
      } else {
        toast.error(data.error || 'Failed to remove subscription')
      }
    } catch (error) {
      toast.error('Failed to remove subscription')
    }
  }

  const resetAddDialog = () => {
    setWebcalUrl('')
    setName('')
    setAddDialogOpen(false)
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
              className={`flex items-center justify-between p-4 border rounded-lg ${
                sub.is_active ? '' : 'opacity-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSubscription(sub.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SubscriptionsManager
