'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Calendar,
  Clock,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Video,
  Phone,
  Users,
  Presentation,
} from 'lucide-react'
import { format, parseISO, startOfDay, addDays } from 'date-fns'

// Purpose configuration with display info
const PURPOSE_CONFIG = {
  intro_call: {
    label: 'Introduction Call',
    description: 'Quick 15-minute intro to discuss your needs',
    duration: '15 min',
    icon: Phone,
  },
  consultation: {
    label: 'Consultation',
    description: 'In-depth discussion about your requirements',
    duration: '15 min',
    icon: Users,
  },
  support: {
    label: 'Support Meeting',
    description: 'Technical support and troubleshooting',
    duration: '30 min',
    icon: Video,
  },
  demo: {
    label: 'Ramp Demonstration',
    description: 'Full product demonstration and walkthrough',
    duration: '60 min',
    icon: Presentation,
  },
} as const

type Purpose = keyof typeof PURPOSE_CONFIG

interface Slot {
  time: string
}

interface SlotsByDate {
  [date: string]: Slot[]
}

interface SchedulerBookingProps {
  onSuccess?: (booking: { uid: string; start: string; purpose: string }) => void
  onCancel?: () => void
  defaultPurpose?: Purpose
  showHeader?: boolean
}

export function SchedulerBooking({
  onSuccess,
  onCancel,
  defaultPurpose,
  showHeader = true,
}: SchedulerBookingProps) {
  const [step, setStep] = useState<'purpose' | 'datetime' | 'confirm' | 'success' | 'error'>(
    defaultPurpose ? 'datetime' : 'purpose'
  )
  const [purpose, setPurpose] = useState<Purpose | null>(defaultPurpose || null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [slots, setSlots] = useState<SlotsByDate>({})
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingResult, setBookingResult] = useState<{ uid: string; start: string } | null>(null)

  // Get user's timezone
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Fetch available slots when purpose is selected
  useEffect(() => {
    if (!purpose) return

    const fetchSlots = async () => {
      setLoading(true)
      setError(null)
      setSlots({})

      try {
        const start = new Date().toISOString()
        const end = addDays(new Date(), 14).toISOString()

        const params = new URLSearchParams({
          purpose,
          start,
          end,
          timeZone,
        })

        const response = await fetch(`/api/schedule/slots?${params}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch available slots')
        }

        // Transform slots into date-grouped format
        const slotsByDate: SlotsByDate = {}

        if (data.slots) {
          // Cal.com returns slots grouped by date
          if (typeof data.slots === 'object' && !Array.isArray(data.slots)) {
            Object.entries(data.slots).forEach(([date, times]) => {
              const dateKey = date.split('T')[0]
              slotsByDate[dateKey] = (times as { time: string }[]).map(t => ({
                time: t.time,
              }))
            })
          } else if (Array.isArray(data.slots)) {
            // Handle array format
            data.slots.forEach((slot: { time: string }) => {
              const dateKey = slot.time.split('T')[0]
              if (!slotsByDate[dateKey]) slotsByDate[dateKey] = []
              slotsByDate[dateKey].push({ time: slot.time })
            })
          }
        }

        setSlots(slotsByDate)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load available times')
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [purpose, timeZone])

  // Handle booking submission
  const handleBook = async () => {
    if (!purpose || !selectedTime) return

    setBooking(true)
    setError(null)

    try {
      const response = await fetch('/api/schedule/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose,
          start: selectedTime,
          timeZone,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book appointment')
      }

      setBookingResult({
        uid: data.booking.uid,
        start: data.booking.start,
      })
      setStep('success')
      onSuccess?.({
        uid: data.booking.uid,
        start: data.booking.start,
        purpose,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book appointment')
      setStep('error')
    } finally {
      setBooking(false)
    }
  }

  // Get available dates from slots
  const availableDates = Object.keys(slots).sort()

  // Get times for selected date
  const timesForDate = selectedDate ? slots[selectedDate] || [] : []

  // Format time for display
  const formatSlotTime = (isoTime: string) => {
    try {
      return format(parseISO(isoTime), 'h:mm a')
    } catch {
      return isoTime
    }
  }

  // Format date for display
  const formatSlotDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      const today = startOfDay(new Date())
      const tomorrow = addDays(today, 1)

      if (startOfDay(date).getTime() === today.getTime()) {
        return 'Today'
      }
      if (startOfDay(date).getTime() === tomorrow.getTime()) {
        return 'Tomorrow'
      }
      return format(date, 'EEE, MMM d')
    } catch {
      return dateStr
    }
  }

  // Reset form
  const reset = () => {
    setStep(defaultPurpose ? 'datetime' : 'purpose')
    setPurpose(defaultPurpose || null)
    setSelectedDate(null)
    setSelectedTime(null)
    setNotes('')
    setError(null)
    setBookingResult(null)
  }

  // Success view
  if (step === 'success' && bookingResult) {
    const purposeConfig = purpose ? PURPOSE_CONFIG[purpose] : null
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">Booking Confirmed!</h3>
        <p className="text-muted-foreground mb-4">
          Your {purposeConfig?.label || 'appointment'} is scheduled for
        </p>
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="font-semibold text-lg">
            {format(parseISO(bookingResult.start), 'EEEE, MMMM d, yyyy')}
          </p>
          <p className="text-muted-foreground">
            {format(parseISO(bookingResult.start), 'h:mm a')} ({timeZone})
          </p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          You&apos;ll receive a confirmation email with meeting details.
        </p>
        <Button variant="outline" onClick={reset}>
          Book Another Appointment
        </Button>
      </div>
    )
  }

  // Error view
  if (step === 'error') {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">Booking Failed</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setStep('datetime')}>
            Try Again
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Purpose selection view
  if (step === 'purpose') {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-1">Schedule an Appointment</h3>
            <p className="text-sm text-muted-foreground">
              Choose the type of meeting you&apos;d like to book
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {(Object.entries(PURPOSE_CONFIG) as [Purpose, typeof PURPOSE_CONFIG[Purpose]][]).map(
            ([key, config]) => {
              const Icon = config.icon
              return (
                <button
                  key={key}
                  onClick={() => {
                    setPurpose(key)
                    setStep('datetime')
                  }}
                  className="w-full p-4 bg-white dark:bg-slate-800 border-2 border-muted hover:border-[#0B5394] rounded-lg transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#0B5394]/10 dark:bg-[#0B5394]/30 rounded-full flex items-center justify-center group-hover:bg-[#0B5394] group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6 text-[#0B5394] group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold block text-gray-900 dark:text-white">
                        {config.label}
                      </span>
                      <span className="text-sm text-muted-foreground">{config.description}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{config.duration}</div>
                  </div>
                </button>
              )
            }
          )}
        </div>

        {onCancel && (
          <div className="text-center pt-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Date/time selection view
  if (step === 'datetime') {
    const purposeConfig = purpose ? PURPOSE_CONFIG[purpose] : null

    return (
      <div className="space-y-4">
        {!defaultPurpose && (
          <button
            onClick={() => {
              setStep('purpose')
              setSelectedDate(null)
              setSelectedTime(null)
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {purposeConfig && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <purposeConfig.icon className="w-5 h-5 text-[#0B5394]" />
            <div>
              <span className="font-medium">{purposeConfig.label}</span>
              <span className="text-sm text-muted-foreground ml-2">({purposeConfig.duration})</span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B5394]" />
            <span className="ml-3 text-muted-foreground">Loading available times...</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button variant="outline" onClick={() => setPurpose(purpose)} className="mt-4">
              Retry
            </Button>
          </div>
        )}

        {/* No slots available */}
        {!loading && !error && availableDates.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No available times in the next 2 weeks</p>
          </div>
        )}

        {/* Date selection */}
        {!loading && !error && availableDates.length > 0 && (
          <>
            <div>
              <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Select a date
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableDates.slice(0, 8).map(date => (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date)
                      setSelectedTime(null)
                    }}
                    className={`p-3 rounded-lg text-center transition-all border ${
                      selectedDate === date
                        ? 'bg-[#F78309] text-white border-[#F78309]'
                        : 'bg-muted/50 hover:bg-muted border-transparent'
                    }`}
                  >
                    <span className="block text-xs">{formatSlotDate(date)}</span>
                    <span className="block font-medium text-sm">
                      {format(parseISO(date), 'MMM d')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time selection */}
            {selectedDate && (
              <div>
                <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Select a time
                </Label>
                {timesForDate.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">
                    No times available for this date
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {timesForDate.map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`p-2 rounded-lg text-sm transition-all border ${
                          selectedTime === slot.time
                            ? 'bg-[#F78309] text-white border-[#F78309]'
                            : 'bg-muted/50 hover:bg-muted border-transparent'
                        }`}
                      >
                        {formatSlotTime(slot.time)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes and confirm */}
            {selectedTime && (
              <div className="space-y-4 pt-2 border-t">
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                    Notes (optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Any details you'd like to share before the meeting..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleBook}
                  disabled={booking}
                  className="w-full bg-[#0B5394] hover:bg-[#0B5394]/90"
                >
                  {booking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return null
}

// Dialog wrapper for modal usage
export function SchedulerBookingDialog({
  open,
  onOpenChange,
  ...props
}: SchedulerBookingProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <SchedulerBooking {...props} onCancel={() => onOpenChange(false)} />
      </div>
    </div>
  )
}

// Button trigger for easy usage
export function SchedulerBookingButton({
  children,
  className = '',
  ...props
}: SchedulerBookingProps & { children?: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className={className}>
        <Calendar className="w-4 h-4 mr-2" />
        {children || 'Book Appointment'}
      </Button>
      <SchedulerBookingDialog open={open} onOpenChange={setOpen} {...props} />
    </>
  )
}
