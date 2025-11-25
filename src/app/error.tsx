'use client'

import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">Error</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-300">
          Something went wrong
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-block rounded-md bg-gray-600 px-6 py-3 text-white hover:bg-gray-700 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
