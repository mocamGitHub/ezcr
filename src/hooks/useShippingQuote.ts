'use client'

import { useState, useCallback } from 'react'

export interface ShippingQuoteRequest {
  destinationZip: string
  productSku: 'AUN200' | 'AUN250' | 'AUN210'
  isResidential?: boolean
  source: 'configurator' | 'checkout'
  leadId?: string
  sessionId?: string
}

export interface ShippingQuoteResponse {
  success: boolean
  quoteId?: string
  baseRate?: number
  residentialSurcharge?: number
  totalRate?: number
  originTerminal?: {
    code: string
    name: string
  }
  destinationTerminal?: {
    code: string
    name: string
  }
  transitDays?: number
  validUntil?: string
  error?: {
    type: string
    message: string
    userMessage: string
  }
}

export interface UseShippingQuoteReturn {
  quote: ShippingQuoteResponse | null
  isLoading: boolean
  error: string | null
  fetchQuote: (params: ShippingQuoteRequest) => Promise<ShippingQuoteResponse | null>
  clearQuote: () => void
}

export function useShippingQuote(): UseShippingQuoteReturn {
  const [quote, setQuote] = useState<ShippingQuoteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuote = useCallback(async (params: ShippingQuoteRequest): Promise<ShippingQuoteResponse | null> => {
    // Validate ZIP code format
    const zipRegex = /^\d{5}(-\d{4})?$/
    if (!zipRegex.test(params.destinationZip)) {
      setError('Please enter a valid US ZIP code (e.g., 90210)')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/shipping-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationZip: params.destinationZip,
          productSku: params.productSku,
          isResidential: params.isResidential ?? false,
          source: params.source,
          leadId: params.leadId,
          sessionId: params.sessionId,
        }),
      })

      const data: ShippingQuoteResponse = await response.json()

      if (data.success) {
        setQuote(data)
        setError(null)
        return data
      } else {
        setError(data.error?.userMessage || 'Unable to get shipping quote')
        setQuote(null)
        return data
      }
    } catch (err) {
      const errorMessage = 'Unable to connect to shipping service. Please try again.'
      setError(errorMessage)
      setQuote(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearQuote = useCallback(() => {
    setQuote(null)
    setError(null)
  }, [])

  return {
    quote,
    isLoading,
    error,
    fetchQuote,
    clearQuote,
  }
}
