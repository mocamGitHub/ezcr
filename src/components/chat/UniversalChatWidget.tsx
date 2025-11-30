'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles, ExternalLink, Download, Printer, Mic, MicOff, Volume2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Array<{ title: string; category: string; similarity: number }>
  suggestedQuestions?: string[]
}

interface UniversalChatWidgetProps {
  pageContext?: {
    page: string
    productId?: string
    categoryId?: string
    [key: string]: unknown
  }
  embedded?: boolean
}

// Initial guiding prompts for new users
const INITIAL_PROMPTS = [
  "What ramp do I need for my truck?",
  "How much weight can your ramps hold?",
  "Do you offer free shipping?",
  "What's your warranty policy?",
]

/**
 * Universal RAG Chat Widget for entire site
 * Can answer any business-related questions using knowledge base
 */
export function UniversalChatWidget({ pageContext = { page: 'unknown' }, embedded = false }: UniversalChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(embedded)
  const [sessionId] = useState(() => uuidv4())
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you find the perfect motorcycle ramp. I can answer questions about our products, shipping, warranty, and more. What can I help you with today?",
      timestamp: new Date(),
      suggestedQuestions: INITIAL_PROMPTS,
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // Check for speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      setSpeechSupported(!!SpeechRecognition)
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          setIsListening(false)
        }

        recognitionRef.current.onerror = () => {
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !embedded) {
      inputRef.current?.focus()
    }
  }, [isOpen, embedded])

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }, [isListening])

  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1
      utterance.pitch = 1
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Send to RAG chat API
      const response = await fetch('/api/ai/chat-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages
            .concat(userMessage)
            .map((m) => ({ role: m.role, content: m.content })),
          sessionId,
          context: pageContext,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Generate follow-up prompts based on the response
      const followUpPrompts = data.suggestedQuestions || generateFollowUpPrompts(data.content)

      // Add assistant message with sources and suggested questions
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        sources: data.sources,
        suggestedQuestions: followUpPrompts,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble right now. Please call us at 800-687-4410 or email support@ezcycleramp.com for assistance.",
          timestamp: new Date(),
          suggestedQuestions: ["What's your phone number?", "What are your business hours?"],
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Generate context-aware follow-up prompts
  const generateFollowUpPrompts = (responseContent: string): string[] => {
    const content = responseContent.toLowerCase()
    const prompts: string[] = []

    if (content.includes('ramp') || content.includes('product')) {
      prompts.push("What's the weight capacity?")
      prompts.push("Does it come with a warranty?")
    }
    if (content.includes('shipping') || content.includes('delivery')) {
      prompts.push("How long does shipping take?")
      prompts.push("Do you ship internationally?")
    }
    if (content.includes('price') || content.includes('cost')) {
      prompts.push("Do you offer financing?")
      prompts.push("Are there any current discounts?")
    }
    if (content.includes('warranty')) {
      prompts.push("How do I make a warranty claim?")
    }

    // Default prompts if none match
    if (prompts.length === 0) {
      prompts.push("Tell me about your best-selling ramp")
      prompts.push("What makes EZ Cycle Ramp different?")
      prompts.push("How do I contact customer support?")
    }

    return prompts.slice(0, 3)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const exportChat = () => {
    const chatContent = messages
      .map((m) => `[${m.timestamp.toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n')

    const blob = new Blob([chatContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ezcycleramp-chat-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const printChat = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const chatHTML = messages
      .map((m) => `
        <div style="margin-bottom: 16px; padding: 12px; background: ${m.role === 'user' ? '#e3f2fd' : '#f5f5f5'}; border-radius: 8px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: ${m.role === 'user' ? '#1976d2' : '#333'};">
            ${m.role === 'user' ? 'You' : 'EZ Cycle Ramp Assistant'}
          </div>
          <div>${m.content}</div>
          <div style="font-size: 12px; color: #666; margin-top: 8px;">
            ${m.timestamp.toLocaleString()}
          </div>
        </div>
      `)
      .join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EZ Cycle Ramp Chat - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #0B5394; }
          </style>
        </head>
        <body>
          <h1>EZ Cycle Ramp Chat Transcript</h1>
          <p style="color: #666;">Exported on ${new Date().toLocaleString()}</p>
          <hr style="margin: 20px 0;">
          ${chatHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! How can I help you today?",
        timestamp: new Date(),
        suggestedQuestions: INITIAL_PROMPTS,
      },
    ])
  }

  // Floating button when closed (not shown for embedded mode)
  if (!isOpen && !embedded) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#F78309] text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-200 flex items-center justify-center group z-50 border-4 border-white"
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white"></span>
        <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-[#0B5394] text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          <Sparkles className="w-4 h-4 inline mr-2" />
          Need help? Chat with us!
          <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-[#0B5394]"></div>
        </div>
      </button>
    )
  }

  const chatContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-[#0B5394] text-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">EZ Cycle Ramp Assistant</h3>
            <p className="text-xs text-blue-100">Online - Ask me anything!</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={exportChat}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
            aria-label="Save chat"
            title="Save chat"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={printChat}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
            aria-label="Print chat"
            title="Print chat"
          >
            <Printer className="w-4 h-4" />
          </button>
          {!embedded && (
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              aria-label="Close chat"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((message, index) => (
          <div key={index}>
            <div
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-[#0B5394] text-white ml-8'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-8 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => speakText(message.content)}
                      className="text-gray-400 hover:text-[#0B5394] transition-colors"
                      aria-label="Read aloud"
                      title="Read aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Show sources if available */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 ml-4 text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium mb-1">Sources:</p>
                <div className="space-y-1">
                  {message.sources.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      <span>{source.title}</span>
                      <span className="opacity-60">
                        ({Math.round(source.similarity * 100)}% match)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show suggested questions */}
            {message.role === 'assistant' && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
              <div className="mt-3 ml-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {message.suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(question)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-[#0B5394]/30 text-[#0B5394] dark:text-blue-300 rounded-full hover:bg-[#0B5394] hover:text-white transition-all shadow-sm"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#0B5394]" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white dark:bg-gray-800 rounded-b-xl">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0B5394] disabled:opacity-50 text-gray-900 dark:text-gray-100 placeholder-gray-500"
          />
          {speechSupported && (
            <button
              onClick={toggleListening}
              disabled={isLoading}
              className={`p-3 rounded-full transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              } disabled:opacity-50`}
              aria-label={isListening ? 'Stop listening' : 'Voice input'}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-[#F78309] text-white rounded-full hover:bg-[#e06f00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
          <button
            onClick={clearChat}
            className="hover:text-[#0B5394] transition-colors"
          >
            Clear chat
          </button>
          <a
            href="tel:800-687-4410"
            className="hover:text-[#F78309] transition-colors flex items-center gap-1"
          >
            Need help? Call 800-687-4410
          </a>
        </div>
      </div>
    </>
  )

  // Embedded mode - render inline without positioning
  if (embedded) {
    return (
      <div className="w-full h-[600px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg flex flex-col">
        {chatContent}
      </div>
    )
  }

  // Floating widget mode
  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[650px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      {chatContent}
    </div>
  )
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any
  }
}
