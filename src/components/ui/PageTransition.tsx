'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

/**
 * PageTransition - Adds a subtle fade-in animation on route changes
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [displayedChildren, setDisplayedChildren] = useState(children)

  useEffect(() => {
    // Start fade out
    setIsVisible(false)

    // After fade out, update children and fade in
    const timer = setTimeout(() => {
      setDisplayedChildren(children)
      setIsVisible(true)
    }, 150)

    return () => clearTimeout(timer)
  }, [pathname, children])

  // Initial mount - fade in immediately
  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      {displayedChildren}
    </div>
  )
}
