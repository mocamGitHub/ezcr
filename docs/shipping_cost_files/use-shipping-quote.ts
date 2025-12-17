// ============================================
// SHIPPING QUOTE HOOK
// React hook for fetching and managing shipping quotes
// ============================================
// 
// Usage:
//   const { quote, isLoading, error, fetchQuote } = useShippingQuote({
//     productSku: 'AUN250',
//     supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
//   });
//
//   // Fetch a quote
//   await fetchQuote({ zipCode: '90210', isResidential: false });
//
//   // Access quote data
//   if (quote) {
//     console.log(`Total: ${quote.totalRate}`);
//   }

'use client';

import { useState, useCallback, useRef } from 'react';

// ============================================
// TYPES
// ============================================

export interface ShippingQuote {
  quoteId: string;
  baseRate: number;
  residentialSurcharge: number;
  totalRate: number;
  originTerminal?: {
    code: string;
    name: string;
  };
  destinationTerminal?: {
    code: string;
    name: string;
  };
  transitDays?: number;
  validUntil: string;
}

export interface ShippingQuoteError {
  type: string;
  message: string;
  userMessage: string;
}

export interface FetchQuoteParams {
  zipCode: string;
  city?: string;
  state?: string;
  isResidential?: boolean;
  leadId?: string;
  sessionId?: string;
  userEmail?: string;
}

export interface UseShippingQuoteOptions {
  productSku: 'AUN200' | 'AUN250';
  supabaseUrl?: string;
  source?: 'configurator' | 'checkout';
  onQuoteReceived?: (quote: ShippingQuote) => void;
  onError?: (error: ShippingQuoteError) => void;
}

export interface UseShippingQuoteReturn {
  quote: ShippingQuote | null;
  isLoading: boolean;
  error: ShippingQuoteError | null;
  fetchQuote: (params: FetchQuoteParams) => Promise<ShippingQuote | null>;
  clearQuote: () => void;
  refetchWithResidential: (isResidential: boolean) => Promise<ShippingQuote | null>;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SHIPPING_QUOTE_ENDPOINT = '/functions/v1/get-shipping-quote';

// ============================================
// HOOK
// ============================================

export function useShippingQuote({
  productSku,
  supabaseUrl = DEFAULT_SUPABASE_URL,
  source = 'configurator',
  onQuoteReceived,
  onError,
}: UseShippingQuoteOptions): UseShippingQuoteReturn {
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ShippingQuoteError | null>(null);
  
  // Store last params for refetch
  const lastParamsRef = useRef<FetchQuoteParams | null>(null);
  
  const fetchQuote = useCallback(async (params: FetchQuoteParams): Promise<ShippingQuote | null> => {
    // Validate ZIP
    if (!params.zipCode || !/^\d{5}(-\d{4})?$/.test(params.zipCode)) {
      const err: ShippingQuoteError = {
        type: 'VALIDATION_ERROR',
        message: 'Invalid ZIP code format',
        userMessage: 'Please enter a valid ZIP code (e.g., 90210)',
      };
      setError(err);
      onError?.(err);
      return null;
    }
    
    // Store params for refetch
    lastParamsRef.current = params;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${supabaseUrl}${SHIPPING_QUOTE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationZip: params.zipCode,
          destinationCity: params.city,
          destinationState: params.state,
          productSku,
          isResidential: params.isResidential ?? false,
          source,
          leadId: params.leadId,
          sessionId: params.sessionId,
          userEmail: params.userEmail,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        const err: ShippingQuoteError = data.error || {
          type: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred',
          userMessage: 'Unable to calculate shipping. Please call (937) 725-6790.',
        };
        setError(err);
        setQuote(null);
        onError?.(err);
        return null;
      }
      
      const newQuote: ShippingQuote = {
        quoteId: data.quoteId,
        baseRate: data.baseRate,
        residentialSurcharge: data.residentialSurcharge,
        totalRate: data.totalRate,
        originTerminal: data.originTerminal,
        destinationTerminal: data.destinationTerminal,
        transitDays: data.transitDays,
        validUntil: data.validUntil,
      };
      
      setQuote(newQuote);
      onQuoteReceived?.(newQuote);
      return newQuote;
      
    } catch (err) {
      console.error('Shipping quote fetch error:', err);
      const apiError: ShippingQuoteError = {
        type: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error',
        userMessage: 'Unable to connect. Please check your internet and try again.',
      };
      setError(apiError);
      setQuote(null);
      onError?.(apiError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [productSku, supabaseUrl, source, onQuoteReceived, onError]);
  
  const clearQuote = useCallback(() => {
    setQuote(null);
    setError(null);
    lastParamsRef.current = null;
  }, []);
  
  const refetchWithResidential = useCallback(async (isResidential: boolean): Promise<ShippingQuote | null> => {
    if (!lastParamsRef.current) {
      const err: ShippingQuoteError = {
        type: 'NO_PREVIOUS_QUOTE',
        message: 'No previous quote to refetch',
        userMessage: 'Please enter your ZIP code first.',
      };
      setError(err);
      onError?.(err);
      return null;
    }
    
    return fetchQuote({
      ...lastParamsRef.current,
      isResidential,
    });
  }, [fetchQuote, onError]);
  
  return {
    quote,
    isLoading,
    error,
    fetchQuote,
    clearQuote,
    refetchWithResidential,
  };
}

// ============================================
// UTILITY: Format currency
// ============================================

export function formatShippingCost(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================
// UTILITY: Check if quote is still valid
// ============================================

export function isQuoteValid(quote: ShippingQuote): boolean {
  return new Date(quote.validUntil) > new Date();
}

// ============================================
// UTILITY: Get remaining validity time
// ============================================

export function getQuoteValidityRemaining(quote: ShippingQuote): {
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const validUntil = new Date(quote.validUntil);
  const now = new Date();
  const diffMs = validUntil.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, isExpired: true };
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, isExpired: false };
}

export default useShippingQuote;
