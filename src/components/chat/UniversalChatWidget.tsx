'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles, ExternalLink } from 'lucide-react'
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
    [key: string]: any
  }
}

/**
 * Universal RAG Chat Widget for entire site
 * Can answer any business-related questions using knowledge base
 */
export function UniversalChatWidget({ pageContext = { page: 'unknown' } }: UniversalChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionId] = useState(() => uuidv4())
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you with any questions about our motorcycle ramps, shipping, warranty, or anything else. What can I help you with today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
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

      // Add assistant message with sources and suggested questions
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          sources: data.sources,
          suggestedQuestions: data.suggestedQuestions,
        },
      ])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble right now. Please call us at 800-687-4410 or email support@ezcycleramp.com for assistance.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center group z-50"
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-card text-card-foreground text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          <Sparkles className="w-4 h-4 inline mr-1" />
          Questions? Chat with us!
        </div>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-card border border-border rounded-xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground rounded-t-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">EZ Cycle Ramp Assistant</h3>
            <p className="text-xs opacity-90">Ask me anything!</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-primary-foreground/10 p-1 rounded transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>
            <div
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-8'
                    : 'bg-muted text-muted-foreground mr-8'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Show sources if available */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 ml-4 text-xs text-muted-foreground">
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

            {/* Show suggested questions if available */}
            {message.role === 'assistant' && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
              <div className="mt-3 ml-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">You might also ask:</p>
                <div className="space-y-2">
                  {message.suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(question)
                        inputRef.current?.focus()
                      }}
                      className="block w-full text-left px-3 py-2 text-sm bg-muted/50 hover:bg-muted rounded-lg transition-colors"
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
            <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <p>Powered by AI • Knowledge Base</p>
          <a
            href="tel:800-687-4410"
            className="hover:text-primary transition-colors"
          >
            📞 800-687-4410
          </a>
        </div>
      </div>
    </div>
  )
}
