// src/components/contact/CallScheduler.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Phone, ArrowLeft, Check, PhoneCall } from 'lucide-react'

interface CallSchedulerProps {
  variant?: 'full' | 'compact'
  onScheduled?: (data: ScheduleData) => void
  onCallbackRequested?: (data: CallbackData) => void
}

interface ScheduleData {
  name: string
  email: string
  phone: string
  date: { label: string; date: string }
  time: string
}

interface CallbackData {
  name: string
  phone: string
  bestTime: string
}

// Generate next available dates (skip weekends)
function getAvailableDates() {
  const dates = []
  const today = new Date()
  let daysAdded = 0
  const currentDate = new Date(today)

  while (daysAdded < 4) {
    currentDate.setDate(currentDate.getDate() + 1)
    const dayOfWeek = currentDate.getDay()

    // Skip Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' })
      const monthDay = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dates.push({ label: daysAdded === 0 ? 'Tomorrow' : dayName, date: monthDay })
      daysAdded++
    }
  }

  return dates
}

const AVAILABLE_TIMES = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM']

export function CallScheduler({ variant = 'full', onScheduled, onCallbackRequested }: CallSchedulerProps) {
  const [view, setView] = useState<'options' | 'schedule' | 'callback' | 'success'>('options')
  const [selectedDate, setSelectedDate] = useState<{ label: string; date: string } | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [scheduleForm, setScheduleForm] = useState({ name: '', email: '', phone: '' })
  const [callbackForm, setCallbackForm] = useState({ name: '', phone: '', bestTime: 'morning' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successType, setSuccessType] = useState<'schedule' | 'callback'>('schedule')

  const availableDates = getAvailableDates()

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime) return

    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const data = { ...scheduleForm, date: selectedDate, time: selectedTime }
    onScheduled?.(data)
    setSuccessType('schedule')
    setView('success')
    setIsSubmitting(false)
  }

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    onCallbackRequested?.(callbackForm)
    setSuccessType('callback')
    setView('success')
    setIsSubmitting(false)
  }

  const resetForm = () => {
    setView('options')
    setSelectedDate(null)
    setSelectedTime(null)
    setScheduleForm({ name: '', email: '', phone: '' })
    setCallbackForm({ name: '', phone: '', bestTime: 'morning' })
  }

  // Success View
  if (view === 'success') {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">
          {successType === 'schedule' ? "You&apos;re Booked!" : 'Callback Requested!'}
        </h3>
        <p className="text-muted-foreground mb-4">
          {successType === 'schedule'
            ? `We'll call you on ${selectedDate?.date} at ${selectedTime}.`
            : "We&apos;ll call you back during your preferred time window."}
        </p>

        {successType === 'schedule' && (
          <div className="bg-[#F78309]/10 border border-[#F78309]/30 rounded-lg p-4 text-left mb-4">
            <p className="text-[#F78309] font-medium mb-2 text-sm">Before your call:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>Measure your truck bed (inside, bulkhead to tailgate)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>Know your motorcycle&apos;s weight</span>
              </li>
            </ul>
          </div>
        )}

        <Button variant="outline" onClick={resetForm}>
          Schedule Another Call
        </Button>
      </div>
    )
  }

  // Options View (Default)
  if (view === 'options') {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold mb-1">Talk to a Ramp Expert</h3>
          <p className="text-sm text-muted-foreground">
            Get personalized help finding the right configuration
          </p>
        </div>

        <button
          onClick={() => setView('schedule')}
          className="w-full p-4 bg-[#0B5394] hover:bg-[#0B5394]/90 text-white rounded-lg transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-semibold block">Schedule a Call</span>
              <span className="text-sm text-blue-100">Pick a time that works for you</span>
            </div>
          </div>
        </button>

        <button
          onClick={() => setView('callback')}
          className="w-full p-4 bg-white dark:bg-slate-800 border-2 border-[#0B5394] hover:bg-[#0B5394]/5 dark:hover:bg-[#0B5394]/20 rounded-lg transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0B5394]/10 dark:bg-[#0B5394]/30 rounded-full flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-[#0B5394]" />
            </div>
            <div className="text-left">
              <span className="font-semibold block text-gray-900 dark:text-white">Request a Callback</span>
              <span className="text-sm text-muted-foreground">We'll call you back today</span>
            </div>
          </div>
        </button>

        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            Or call now:{' '}
            <a href="tel:8006874410" className="text-[#F78309] font-semibold hover:underline">
              800-687-4410
            </a>
          </p>
        </div>
      </div>
    )
  }

  // Schedule View
  if (view === 'schedule') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setView('options')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h3 className="text-lg font-semibold">Schedule Your Consultation</h3>

        {/* Date Selection */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Select a date</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {availableDates.map(d => (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d)}
                className={`p-3 rounded-lg text-center transition-all border ${
                  selectedDate?.date === d.date
                    ? 'bg-[#F78309] text-white border-[#F78309]'
                    : 'bg-muted/50 hover:bg-muted border-transparent'
                }`}
              >
                <span className="block text-xs">{d.label}</span>
                <span className="block font-medium text-sm">{d.date}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Select a time (EST)</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {AVAILABLE_TIMES.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`p-2 rounded-lg text-sm transition-all border ${
                    selectedTime === t
                      ? 'bg-[#F78309] text-white border-[#F78309]'
                      : 'bg-muted/50 hover:bg-muted border-transparent'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contact Form */}
        {selectedTime && (
          <form onSubmit={handleScheduleSubmit} className="space-y-3 pt-2">
            <div>
              <Label htmlFor="schedule-name">Your name</Label>
              <Input
                id="schedule-name"
                required
                value={scheduleForm.name}
                onChange={e => setScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Smith"
              />
            </div>
            <div>
              <Label htmlFor="schedule-email">Email</Label>
              <Input
                id="schedule-email"
                type="email"
                required
                value={scheduleForm.email}
                onChange={e => setScheduleForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@email.com"
              />
            </div>
            <div>
              <Label htmlFor="schedule-phone">Phone number</Label>
              <Input
                id="schedule-phone"
                type="tel"
                required
                value={scheduleForm.phone}
                onChange={e => setScheduleForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#F78309] hover:bg-[#F78309]/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Scheduling...' : 'Confirm Consultation'}
            </Button>
          </form>
        )}
      </div>
    )
  }

  // Callback View
  if (view === 'callback') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setView('options')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h3 className="text-lg font-semibold">Request a Callback</h3>
        <p className="text-sm text-muted-foreground">
          Leave your details and we'll call you back today.
        </p>

        <form onSubmit={handleCallbackSubmit} className="space-y-3">
          <div>
            <Label htmlFor="callback-name">Your name</Label>
            <Input
              id="callback-name"
              required
              value={callbackForm.name}
              onChange={e => setCallbackForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="John Smith"
            />
          </div>
          <div>
            <Label htmlFor="callback-phone">Phone number</Label>
            <Input
              id="callback-phone"
              type="tel"
              required
              value={callbackForm.phone}
              onChange={e => setCallbackForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="callback-time">Best time to call</Label>
            <select
              id="callback-time"
              value={callbackForm.bestTime}
              onChange={e => setCallbackForm(prev => ({ ...prev, bestTime: e.target.value }))}
              className="w-full p-2.5 border rounded-lg bg-background"
            >
              <option value="morning">Morning (9am - 12pm EST)</option>
              <option value="afternoon">Afternoon (12pm - 5pm EST)</option>
            </select>
          </div>
          <Button
            type="submit"
            className="w-full bg-[#F78309] hover:bg-[#F78309]/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Request Callback'}
          </Button>
        </form>
      </div>
    )
  }

  return null
}

// Compact CTA version for use in other components
export function CallSchedulerCTA({ className = '' }: { className?: string }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
        <Button
          onClick={() => setShowModal(true)}
          variant="outline"
          className="border-[#0B5394] text-[#0B5394] hover:bg-[#0B5394]/10 dark:border-white dark:text-white"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedule a Call
        </Button>
        <Button asChild variant="ghost">
          <a href="tel:8006874410">
            <Phone className="w-4 h-4 mr-2" />
            800-687-4410
          </a>
        </Button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <CallScheduler />
          </div>
        </div>
      )}
    </>
  )
}
