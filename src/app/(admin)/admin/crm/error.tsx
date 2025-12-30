'use client'

import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary'

export default function CRMError({
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
      title="Failed to load customers"
      backHref="/admin/dashboard"
      backLabel="Back to Dashboard"
    />
  )
}
