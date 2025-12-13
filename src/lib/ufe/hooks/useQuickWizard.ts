'use client';

/**
 * React Hook for Quick Wizard
 *
 * Provides state management and methods for the Quick Wizard flow.
 *
 * @module ufe/hooks/useQuickWizard
 */

import { useState, useCallback, useMemo } from 'react';
import type { UFEResult, QuickWizardQuestion } from '../types';
import type { QuickWizardState } from '../wizards';
import {
  createQuickWizardState,
  buildQuestionFlow,
  getCurrentQuestion,
  getQuickWizardProgress,
  processAnswer,
  goBackQuickWizard,
  resetQuickWizard,
} from '../wizards';

export interface UseQuickWizardReturn {
  /** Current wizard state */
  state: QuickWizardState;
  /** Current question to display */
  currentQuestion: QuickWizardQuestion | null;
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether the wizard is complete */
  isComplete: boolean;
  /** UFE result (available when complete) */
  result: UFEResult | null;
  /** Answer current question and advance */
  answer: (questionId: string, value: string) => void;
  /** Go back to previous question */
  goBack: () => void;
  /** Reset wizard to start */
  reset: () => void;
  /** Get all current answers as string map (for display) */
  answers: Record<string, string>;
  /** Number of questions in current flow */
  totalQuestions: number;
  /** Current step number (1-indexed) */
  currentStep: number;
}

/**
 * React hook for managing Quick Wizard state
 *
 * @example
 * ```tsx
 * function QuickWizard() {
 *   const {
 *     currentQuestion,
 *     progress,
 *     isComplete,
 *     result,
 *     answer,
 *     goBack,
 *     reset,
 *   } = useQuickWizard();
 *
 *   if (isComplete && result) {
 *     return <Results result={result} onReset={reset} />;
 *   }
 *
 *   return (
 *     <Question
 *       question={currentQuestion}
 *       onAnswer={(value) => answer(currentQuestion.id, value)}
 *       onBack={goBack}
 *       progress={progress}
 *     />
 *   );
 * }
 * ```
 */
export function useQuickWizard(): UseQuickWizardReturn {
  const [state, setState] = useState<QuickWizardState>(() => createQuickWizardState());

  // Get current question
  const currentQuestion = useMemo(() => getCurrentQuestion(state), [state]);

  // Calculate progress
  const progress = useMemo(() => getQuickWizardProgress(state), [state]);

  // Answer handler
  const answer = useCallback((questionId: string, value: string) => {
    setState(prevState => processAnswer(prevState, questionId, value));
  }, []);

  // Go back handler
  const goBack = useCallback(() => {
    setState(prevState => goBackQuickWizard(prevState));
  }, []);

  // Reset handler
  const reset = useCallback(() => {
    setState(createQuickWizardState());
  }, []);

  // Convert answers to string map for display
  const answersAsStrings = useMemo(() => {
    const result: Record<string, string> = {};
    const ans = state.answers;

    if (ans.bedLength) result.bedLength = ans.bedLength;
    if (ans.hasTonneau !== undefined) result.hasTonneau = ans.hasTonneau ? 'yes' : 'no';
    if (ans.tonneauType) result.tonneauType = ans.tonneauType;
    if (ans.rollDirection) result.rollDirection = ans.rollDirection;
    if (ans.tailgateMustClose !== undefined) result.tailgateRequired = ans.tailgateMustClose ? 'yes' : 'no';
    if (ans.motorcycleLoadedWhenClosed !== undefined) result.motorcycleLoaded = ans.motorcycleLoadedWhenClosed ? 'yes' : 'no';

    return result;
  }, [state.answers]);

  return {
    state,
    currentQuestion,
    progress,
    isComplete: state.isComplete,
    result: state.result,
    answer,
    goBack,
    reset,
    answers: answersAsStrings,
    totalQuestions: state.questions.length,
    currentStep: state.currentStep + 1,
  };
}

export default useQuickWizard;
