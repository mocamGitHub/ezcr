'use client'

import { usePathname } from 'next/navigation'
import { UniversalChatWidget } from './UniversalChatWidget'

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
