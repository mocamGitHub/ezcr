'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatCTAProps {
  variant?: 'inline' | 'card' | 'banner'
  title?: string
  description?: string
  buttonText?: string
  className?: string
  showIcon?: boolean
}

/**
 * ChatCTA - A call-to-action component that opens the chat widget
 *
 * Variants:
 * - inline: Simple text link style
 * - card: Boxed card style
 * - banner: Full-width banner style
 */
export function ChatCTA({
  variant = 'card',
  title = 'Have Questions?',
  description = 'Chat with our assistant, Charli, for instant answers about ramps, shipping, and more.',
  buttonText = 'Start Chat',
  className = '',
  showIcon = false,
}: ChatCTAProps) {
  const openChat = () => {
    // Find and click the chat widget button
    const chatButton = document.querySelector('[aria-label="Open chat assistant"]') as HTMLButtonElement
    if (chatButton) {
      chatButton.click()
    } else {
      // If chat is already open, scroll to it or focus the input
      const chatInput = document.querySelector('input[placeholder="Type your question..."]') as HTMLInputElement
      if (chatInput) {
        chatInput.focus()
      }
    }
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={openChat}
        className={`inline-flex items-center gap-2 text-[#0B5394] hover:text-[#F78309] transition-colors font-medium ${className}`}
      >
        <MessageCircle className="w-4 h-4" />
        {buttonText}
      </button>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-[#0B5394] to-[#0B5394]/90 text-white py-4 px-6 rounded-lg ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-blue-100">{description}</p>
            </div>
          </div>
          <Button
            onClick={openChat}
            className="bg-[#F78309] hover:bg-[#F78309]/90 text-white whitespace-nowrap"
          >
            {showIcon && <MessageCircle className="w-4 h-4 mr-2" />}
            {buttonText}
          </Button>
        </div>
      </div>
    )
  }

  // Default: card variant
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-[#0B5394]/10 dark:bg-[#0B5394]/20 rounded-full flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-6 h-6 text-[#0B5394]" />
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
          <Button
            onClick={openChat}
            className="bg-[#F78309] hover:bg-[#F78309]/90 text-white"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  )
}
