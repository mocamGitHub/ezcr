'use client'

import { MarketingErrorBoundary } from '@/components/marketing/MarketingErrorBoundary'

export default function FAQError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <MarketingErrorBoundary error={error} reset={reset} title="Unable to load FAQ" />
}
