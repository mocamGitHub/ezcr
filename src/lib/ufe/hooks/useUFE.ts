'use client';

/**
 * React Hook for UFE Evaluation
 *
 * Provides direct access to UFE evaluation functions.
 * Use this when you need to evaluate input outside of the wizard flow.
 *
 * @module ufe/hooks/useUFE
 */

import { useState, useCallback } from 'react';
import type { QuickWizardInput, AdvancedWizardInput, UFEResult } from '../types';
import { evaluateQuick, evaluateAdvanced } from '../index';

export interface UseUFEReturn {
  /** Most recent UFE result */
  result: UFEResult | null;
  /** Whether evaluation is in progress */
  isEvaluating: boolean;
  /** Evaluate Quick Wizard input */
  evaluateQuickInput: (input: QuickWizardInput) => UFEResult;
  /** Evaluate Advanced Wizard input */
  evaluateAdvancedInput: (input: AdvancedWizardInput) => UFEResult;
  /** Clear current result */
  clearResult: () => void;
}

/**
 * React hook for direct UFE evaluation
 *
 * @example
 * ```tsx
 * function CustomConfigurator() {
 *   const { result, evaluateAdvancedInput, clearResult } = useUFE();
 *
 *   const handleSubmit = (formData) => {
 *     const input = buildInputFromForm(formData);
 *     evaluateAdvancedInput(input);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {result && <Result data={result} />}
 *     </form>
 *   );
 * }
 * ```
 */
export function useUFE(): UseUFEReturn {
  const [result, setResult] = useState<UFEResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const evaluateQuickInput = useCallback((input: QuickWizardInput): UFEResult => {
    setIsEvaluating(true);
    try {
      const ufeResult = evaluateQuick(input);
      setResult(ufeResult);
      return ufeResult;
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  const evaluateAdvancedInput = useCallback((input: AdvancedWizardInput): UFEResult => {
    setIsEvaluating(true);
    try {
      const ufeResult = evaluateAdvanced(input);
      setResult(ufeResult);
      return ufeResult;
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    result,
    isEvaluating,
    evaluateQuickInput,
    evaluateAdvancedInput,
    clearResult,
  };
}

export default useUFE;
