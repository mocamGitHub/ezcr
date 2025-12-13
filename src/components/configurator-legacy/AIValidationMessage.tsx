'use client'

import React from 'react'
import { AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react'

interface AIValidationMessageProps {
  message: string
  type: 'warning' | 'success' | 'suggestion'
  suggestion?: number
  onAcceptSuggestion?: (value: number) => void
}

/**
 * AI Validation Message Component
 * Displays smart suggestions from AI measurement validation
 */
export function AIValidationMessage({
  message,
  type,
  suggestion,
  onAcceptSuggestion,
}: AIValidationMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'suggestion':
        return <Lightbulb className="w-5 h-5 text-blue-500" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'suggestion':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  const getTextColor = () => {
    switch (type) {
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200'
      case 'success':
        return 'text-green-800 dark:text-green-200'
      case 'suggestion':
        return 'text-blue-800 dark:text-blue-200'
    }
  }

  return (
    <div
      className={`mt-2 p-3 rounded-lg border ${getBgColor()} ${getTextColor()} flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1">
        <p className="text-sm">{message}</p>
        {suggestion !== undefined && suggestion !== null && onAcceptSuggestion && (
          <button
            onClick={() => onAcceptSuggestion(suggestion)}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            Use {suggestion} instead
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Hook to use AI validation
 */
export function useAIValidation() {
  const [isValidating, setIsValidating] = React.useState(false)

  const validate = async (
    value: number,
    field: string,
    vehicleType: string,
    unitSystem: 'imperial' | 'metric'
  ) => {
    setIsValidating(true)
    try {
      const response = await fetch('/api/ai/validate-measurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, field, vehicleType, unitSystem }),
      })

      if (!response.ok) {
        return null
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('AI validation error:', error)
      return null
    } finally {
      setIsValidating(false)
    }
  }

  return { validate, isValidating }
}
