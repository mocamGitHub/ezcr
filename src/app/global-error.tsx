'use client'

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Don't use html/body tags directly to avoid issues
  return (
    <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh' }}>
      <h1>Something went wrong!</h1>
      <p>{error.message || 'An unexpected error occurred'}</p>
      <button
        onClick={reset}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  )
}
