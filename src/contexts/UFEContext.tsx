'use client';

/**
 * UFE Context Provider
 *
 * Provides UFE state and result management across the application.
 * Use this context when you need to share UFE results between components.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { UFEResult, QuickWizardInput, AdvancedWizardInput, RampModelId, QuoteBreakdown } from '@/lib/ufe/types';
import { evaluateQuick, evaluateAdvanced } from '@/lib/ufe';

// =============================================================================
// TYPES
// =============================================================================

interface UFEContextState {
  /** Current UFE result */
  result: UFEResult | null;
  /** Quote breakdown (for advanced wizard) */
  quote: QuoteBreakdown | null;
  /** Source of the current result */
  source: 'quick' | 'advanced' | null;
  /** Whether a recommendation is available */
  hasRecommendation: boolean;
  /** The recommended ramp model */
  recommendedRamp: RampModelId | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if evaluation failed */
  error: string | null;
}

interface UFEContextActions {
  /** Evaluate Quick Wizard input */
  evaluateQuickWizard: (input: QuickWizardInput) => void;
  /** Evaluate Advanced Wizard input */
  evaluateAdvancedWizard: (input: AdvancedWizardInput, quote?: QuoteBreakdown) => void;
  /** Clear current result */
  clearResult: () => void;
  /** Set result directly (for hydration) */
  setResult: (result: UFEResult, source: 'quick' | 'advanced', quote?: QuoteBreakdown) => void;
}

type UFEContextType = UFEContextState & UFEContextActions;

// =============================================================================
// CONTEXT
// =============================================================================

const UFEContext = createContext<UFEContextType | undefined>(undefined);

// =============================================================================
// INITIAL STATE
// =============================================================================

const INITIAL_STATE: UFEContextState = {
  result: null,
  quote: null,
  source: null,
  hasRecommendation: false,
  recommendedRamp: null,
  isLoading: false,
  error: null,
};

// =============================================================================
// LOCAL STORAGE
// =============================================================================

const UFE_STORAGE_KEY = 'ezcr-ufe-result';
const UFE_STORAGE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface StoredUFEData {
  result: UFEResult;
  quote: QuoteBreakdown | null;
  source: 'quick' | 'advanced';
  timestamp: number;
}

function saveToStorage(data: StoredUFEData): void {
  try {
    localStorage.setItem(UFE_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save UFE result to localStorage:', error);
  }
}

function loadFromStorage(): StoredUFEData | null {
  try {
    const stored = localStorage.getItem(UFE_STORAGE_KEY);
    if (!stored) return null;

    const data: StoredUFEData = JSON.parse(stored);

    // Check if expired
    if (Date.now() - data.timestamp > UFE_STORAGE_TTL) {
      localStorage.removeItem(UFE_STORAGE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load UFE result from localStorage:', error);
    return null;
  }
}

function clearStorage(): void {
  try {
    localStorage.removeItem(UFE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear UFE result from localStorage:', error);
  }
}

// =============================================================================
// PROVIDER
// =============================================================================

interface UFEProviderProps {
  children: React.ReactNode;
  /** Whether to persist result to localStorage */
  persist?: boolean;
}

export function UFEProvider({ children, persist = true }: UFEProviderProps) {
  const [state, setState] = useState<UFEContextState>(INITIAL_STATE);

  // Load from localStorage on mount
  useEffect(() => {
    if (persist) {
      const stored = loadFromStorage();
      if (stored) {
        setState({
          result: stored.result,
          quote: stored.quote,
          source: stored.source,
          hasRecommendation: !!stored.result.primaryRecommendation,
          recommendedRamp: stored.result.primaryRecommendation?.rampId || null,
          isLoading: false,
          error: null,
        });
      }
    }
  }, [persist]);

  // Save to localStorage when result changes
  useEffect(() => {
    if (persist && state.result && state.source) {
      saveToStorage({
        result: state.result,
        quote: state.quote,
        source: state.source,
        timestamp: Date.now(),
      });
    }
  }, [persist, state.result, state.source, state.quote]);

  const evaluateQuickWizard = useCallback((input: QuickWizardInput) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = evaluateQuick(input);

      setState({
        result,
        quote: null,
        source: 'quick',
        hasRecommendation: !!result.primaryRecommendation,
        recommendedRamp: result.primaryRecommendation?.rampId || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Evaluation failed',
      }));
    }
  }, []);

  const evaluateAdvancedWizard = useCallback((input: AdvancedWizardInput, quote?: QuoteBreakdown) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = evaluateAdvanced(input);

      setState({
        result,
        quote: quote || null,
        source: 'advanced',
        hasRecommendation: !!result.primaryRecommendation,
        recommendedRamp: result.primaryRecommendation?.rampId || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Evaluation failed',
      }));
    }
  }, []);

  const clearResult = useCallback(() => {
    setState(INITIAL_STATE);
    if (persist) {
      clearStorage();
    }
  }, [persist]);

  const setResult = useCallback((result: UFEResult, source: 'quick' | 'advanced', quote?: QuoteBreakdown) => {
    setState({
      result,
      quote: quote || null,
      source,
      hasRecommendation: !!result.primaryRecommendation,
      recommendedRamp: result.primaryRecommendation?.rampId || null,
      isLoading: false,
      error: null,
    });
  }, []);

  const value = useMemo<UFEContextType>(() => ({
    ...state,
    evaluateQuickWizard,
    evaluateAdvancedWizard,
    clearResult,
    setResult,
  }), [state, evaluateQuickWizard, evaluateAdvancedWizard, clearResult, setResult]);

  return (
    <UFEContext.Provider value={value}>
      {children}
    </UFEContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to access UFE context
 *
 * @example
 * ```tsx
 * function ResultsPage() {
 *   const { result, hasRecommendation, recommendedRamp } = useUFEContext();
 *
 *   if (!hasRecommendation) {
 *     return <p>No recommendation available</p>;
 *   }
 *
 *   return <RecommendationCard ramp={recommendedRamp} result={result} />;
 * }
 * ```
 */
export function useUFEContext(): UFEContextType {
  const context = useContext(UFEContext);
  if (context === undefined) {
    throw new Error('useUFEContext must be used within a UFEProvider');
  }
  return context;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { UFEContext };
export type { UFEContextType, UFEContextState, UFEContextActions };
