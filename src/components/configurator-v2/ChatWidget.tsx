'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react'
import { useConfigurator } from './ConfiguratorProvider'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/**
 * AI Chat Widget for Configurator
 * Helps users through configuration process conversationally
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you configure the perfect ramp for your motorcycle. What type of vehicle will you be loading from?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    vehicle,
    measurements,
    motorcycle,
    updateVehicle,
    updateMeasurements,
    updateMotorcycle,
  } = useConfigurator()

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
      // Get current configuration context
      const context = {
        vehicle,
        measurements,
        motorcycle,
        currentStep: getCurrentStepDescription(),
      }

      // Send to AI
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages
            .concat(userMessage)
            .map((m) => ({ role: m.role, content: m.content })),
          configurationContext: context,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Handle function calls (form updates)
      if (data.type === 'function_call') {
        handleFunctionCall(data.function, data.arguments)

        // Add assistant confirmation message
        const confirmMessage = generateConfirmationMessage(
          data.function,
          data.arguments
        )
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: confirmMessage,
            timestamp: new Date(),
          },
        ])
      } else {
        // Regular message
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.content,
            timestamp: new Date(),
          },
        ])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble right now. Please try using the form directly or call us at 800-687-4410.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFunctionCall = (functionName: string, args: any) => {
    if (functionName === 'update_configurator') {
      // Update form with extracted values
      if (args.vehicleType) {
        updateVehicle(args.vehicleType)
      }
      if (args.cargoLength || args.totalLength || args.loadHeight) {
        updateMeasurements({
          cargoLength: args.cargoLength || measurements.cargoLength,
          totalLength: args.totalLength || measurements.totalLength,
          loadHeight: args.loadHeight || measurements.loadHeight,
        })
      }
      if (args.motorcycleType || args.motorcycleWeight || args.wheelbase || args.motorcycleLength) {
        updateMotorcycle({
          type: args.motorcycleType || motorcycle.type,
          weight: args.motorcycleWeight || motorcycle.weight,
          wheelbase: args.wheelbase || motorcycle.wheelbase,
          length: args.motorcycleLength || motorcycle.length,
        })
      }
    }
  }

  const generateConfirmationMessage = (functionName: string, args: any) => {
    if (functionName === 'update_configurator') {
      const updates = []
      if (args.vehicleType) updates.push(`vehicle type to ${args.vehicleType}`)
      if (args.cargoLength) updates.push(`cargo length to ${args.cargoLength}"`)
      if (args.totalLength) updates.push(`total length to ${args.totalLength}"`)
      if (args.loadHeight) updates.push(`load height to ${args.loadHeight}"`)
      if (args.motorcycleWeight) updates.push(`motorcycle weight to ${args.motorcycleWeight} lbs`)

      return `Great! I've updated your configuration: ${updates.join(', ')}. ${getNextStepPrompt()}`
    }
    return "I've updated the form for you!"
  }

  const getCurrentStepDescription = () => {
    if (!vehicle) return 'selecting vehicle type'
    if (!measurements.loadHeight) return 'entering measurements'
    if (!motorcycle.type) return 'entering motorcycle details'
    return 'reviewing configuration'
  }

  const getNextStepPrompt = () => {
    if (!vehicle) return 'What type of vehicle do you have?'
    if (!measurements.loadHeight) return 'Now, what are your vehicle measurements?'
    if (!motorcycle.type) return 'Tell me about your motorcycle!'
    return 'Ready to review your configuration?'
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
          Need help? Chat with AI
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
            <h3 className="font-semibold">AI Configuration Assistant</h3>
            <p className="text-xs opacity-90">Powered by GPT-4</p>
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
          <div
            key={index}
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
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI can make mistakes. Please verify measurements.
        </p>
      </div>
    </div>
  )
}
