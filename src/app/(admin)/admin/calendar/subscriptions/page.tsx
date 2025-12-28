import { ICSImportDialog } from '@/components/calendar/ICSImportDialog'
import { SubscriptionsManager } from '@/components/calendar/SubscriptionsManager'

export const metadata = {
  title: 'Calendar Subscriptions | Admin',
  description: 'Manage external calendar subscriptions',
}

export default function CalendarSubscriptionsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">External Calendars</h1>
          <p className="text-muted-foreground mt-1">
            Import calendars and subscribe to external feeds
          </p>
        </div>
        <ICSImportDialog />
      </div>

      <div className="bg-card rounded-lg border p-6">
        <SubscriptionsManager />
      </div>

      <div className="mt-6 bg-muted/50 rounded-lg p-6">
        <h2 className="font-semibold mb-2">How it works</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>
            <strong>ICS Import:</strong> Upload a .ics file to import events as a one-time import
          </li>
          <li>
            <strong>Webcal Subscription:</strong> Subscribe to a webcal URL for automatic sync
          </li>
          <li>
            External events block time slots to prevent double-booking
          </li>
          <li>
            Subscriptions sync automatically every hour (or on your schedule)
          </li>
        </ul>

        <h3 className="font-semibold mt-4 mb-2">Finding your webcal URL</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Google Calendar:</strong> Settings → Calendar → Integrate calendar → Secret address in iCal format
          </p>
          <p>
            <strong>Apple Calendar:</strong> Calendar → File → Export → Copy webcal URL
          </p>
          <p>
            <strong>Outlook:</strong> Settings → Calendar → Shared calendars → Publish a calendar
          </p>
        </div>
      </div>
    </div>
  )
}
