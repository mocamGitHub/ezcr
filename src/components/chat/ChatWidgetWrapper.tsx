'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

// Lazy load the chat widget - it's not needed on initial page render
// This defers ~80KB until user interaction or idle time
const UniversalChatWidget = dynamic(
  () => import('./UniversalChatWidget').then(mod => ({ default: mod.UniversalChatWidget })),
  {
    ssr: false,
    loading: () => null // Don't show any placeholder for the chat button
  }
)

/**
 * Wrapper component that conditionally renders the chat widget
 * based on the current page path.
 *
 * Hides the floating button on pages where the chatbot is embedded inline.
 */
export function ChatWidgetWrapper() {
  const pathname = usePathname()

  // Hide floating button on FAQ page since chatbot is embedded there
  const hideFloatingButton = pathname === '/faq'

  return <UniversalChatWidget hideFloatingButton={hideFloatingButton} />
}
