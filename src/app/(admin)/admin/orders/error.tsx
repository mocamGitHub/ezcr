'use client'

import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary'

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <AdminErrorBoundary
      error={error}
      reset={reset}
      title="Failed to load orders"
      backHref="/admin/dashboard"
      backLabel="Back to Dashboard"
    />
  )
}
