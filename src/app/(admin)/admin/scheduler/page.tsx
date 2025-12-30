'use client'

import { useState } from 'react'
import { SchedulerBooking, SchedulerBookingButton, MyBookings } from '@/components/scheduler'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function SchedulerPage() {
  const [tab, setTab] = useState<'book' | 'my-bookings'>('book')

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Scheduler</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setTab('book')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
            tab === 'book'
              ? 'border-[#0B5394] text-[#0B5394]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Book Appointment
        </button>
        <button
          onClick={() => setTab('my-bookings')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
            tab === 'my-bookings'
              ? 'border-[#0B5394] text-[#0B5394]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          My Bookings
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
        {tab === 'book' && (
          <SchedulerBooking
            onSuccess={() => {
              // Switch to my-bookings tab after successful booking
              setTimeout(() => setTab('my-bookings'), 2000)
            }}
          />
        )}

        {tab === 'my-bookings' && (
          <MyBookings
            onReschedule={() => {
              toast.info('Reschedule functionality coming soon!')
            }}
          />
        )}
      </div>

      {/* Demo: Button trigger */}
      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h2 className="font-medium mb-4">Button Trigger Demo</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Use the SchedulerBookingButton component for a quick booking trigger:
        </p>
        <SchedulerBookingButton className="bg-[#0B5394] hover:bg-[#0B5394]/90">
          Schedule a Meeting
        </SchedulerBookingButton>
      </div>
    </div>
  )
}
