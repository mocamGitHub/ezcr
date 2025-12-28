import { TokenManager } from '@/components/shortcuts/TokenManager'

export const metadata = {
  title: 'Shortcuts API | Admin',
  description: 'Manage iOS Shortcuts API tokens',
}

export default function ShortcutsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">iOS Shortcuts API</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage API tokens for iOS Shortcuts integration
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <TokenManager />
      </div>

      <div className="mt-6 bg-muted/50 rounded-lg p-6">
        <h2 className="font-semibold mb-2">Using with iOS Shortcuts</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Create a token with the permissions you need</li>
          <li>Copy the token (it will only be shown once)</li>
          <li>In Shortcuts app, use "Get Contents of URL" action</li>
          <li>Set the Authorization header to: Bearer YOUR_TOKEN</li>
          <li>Call the API endpoints below</li>
        </ol>

        <h3 className="font-semibold mt-4 mb-2">Available Endpoints</h3>
        <div className="space-y-2 text-sm font-mono">
          <div>
            <span className="text-blue-600">GET</span>{' '}
            <span>/api/shortcuts/today</span>
            <span className="text-muted-foreground ml-2">- Get today's schedule</span>
          </div>
          <div>
            <span className="text-green-600">POST</span>{' '}
            <span>/api/shortcuts/block-time</span>
            <span className="text-muted-foreground ml-2">- Block time on calendar</span>
          </div>
          <div>
            <span className="text-green-600">POST</span>{' '}
            <span>/api/shortcuts/create-booking-link</span>
            <span className="text-muted-foreground ml-2">- Generate booking URL</span>
          </div>
          <div>
            <span className="text-green-600">POST</span>{' '}
            <span>/api/shortcuts/reschedule</span>
            <span className="text-muted-foreground ml-2">- Reschedule a booking</span>
          </div>
        </div>
      </div>
    </div>
  )
}
