'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

/**
 * PageTransition - Adds a smooth fade animation on route changes
 * and ensures scroll to top on every page change (especially for mobile)
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [displayedChildren, setDisplayedChildren] = useState(children)
  const prevPathname = useRef(pathname)

  useEffect(() => {
    // Only transition if pathname actually changed
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname

      // Start fade out
      setIsVisible(false)

      // After fade out, update children, scroll to top, and fade in
      const timer = setTimeout(() => {
        setDisplayedChildren(children)

        // Scroll to top on every page change
        window.scrollTo({ top: 0, behavior: 'instant' })

        setIsVisible(true)
      }, 150)

      return () => clearTimeout(timer)
    } else {
      // Same pathname, just update children without transition
      setDisplayedChildren(children)
    }
  }, [pathname, children])

  // Initial mount - fade in immediately
  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
      }}
    >
      {displayedChildren}
    </div>
  )
}
