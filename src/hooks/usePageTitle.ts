import { useEffect } from 'react'

/**
 * Hook to set the document title dynamically for client components.
 * Includes the site name suffix automatically.
 *
 * @param title - The page-specific title
 * @param suffix - Optional suffix (defaults to "EZ Cycle Ramp Admin")
 */
export function usePageTitle(title: string, suffix = 'EZ Cycle Ramp Admin') {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} | ${suffix}`

    return () => {
      document.title = previousTitle
    }
  }, [title, suffix])
}
