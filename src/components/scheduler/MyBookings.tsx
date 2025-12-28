'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  RotateCcw,
} from 'lucide-react'
import { format, parseISO, isPast } from 'date-fns'

interface Booking {
  id: string
  booking_uid: string
  cal_event_type_id: number
  start_at: string
  end_at: string | null
  status: 'scheduled' | 'cancelled' | 'rescheduled'
  title: string
  attendee_email: string
  metadata: {
    purpose?: string
    notes?: string
    attendee_name?: string
  }
  created_at: string
}

interface MyBookingsProps {
  onReschedule?: (booking: Booking) => void
  showPast?: boolean
}

export function MyBookings({ onReschedule, showPast = false }: MyBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (!showPast) {
        params.set('upcoming', 'true')
      }

      const response = await fetch(`/api/schedule/my-bookings?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings')
      }

      setBookings(data.bookings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [showPast])

  const handleCancel = async (booking: Booking) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    setCancellingId(booking.id)

    try {
      const response = await fetch('/api/schedule/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingUid: booking.booking_uid,
          reason: 'Cancelled by user',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking')
      }

      // Refresh bookings
      await fetchBookings()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel booking')
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusBadge = (status: Booking['status'], startAt: string) => {
    const isInPast = isPast(parseISO(startAt))

    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Cancelled
        </span>
      )
    }

    if (status === 'rescheduled') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          Rescheduled
        </span>
      )
    }

    if (isInPast) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
          Completed
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Confirmed
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#0B5394]" />
        <span className="ml-3 text-muted-foreground">Loading your bookings...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button variant="outline" onClick={fetchBookings}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Bookings</h3>
        <p className="text-muted-foreground">
          {showPast ? "You haven't made any bookings yet." : 'You have no upcoming bookings.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{showPast ? 'All Bookings' : 'Upcoming Bookings'}</h3>
        <Button variant="ghost" size="sm" onClick={fetchBookings}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {bookings.map(booking => {
          const isInPast = isPast(parseISO(booking.start_at))
          const canModify = booking.status === 'scheduled' && !isInPast

          return (
            <div
              key={booking.id}
              className="bg-white dark:bg-slate-800 border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{booking.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(parseISO(booking.start_at), 'EEE, MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(parseISO(booking.start_at), 'h:mm a')}
                    </span>
                  </div>
                </div>
                {getStatusBadge(booking.status, booking.start_at)}
              </div>

              {booking.metadata?.notes && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                  {booking.metadata.notes}
                </p>
              )}

              {canModify && (
                <div className="flex gap-2 pt-2 border-t">
                  {onReschedule && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReschedule(booking)}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reschedule
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(booking)}
                    disabled={cancellingId === booking.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {cancellingId === booking.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-1" />
                    )}
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
