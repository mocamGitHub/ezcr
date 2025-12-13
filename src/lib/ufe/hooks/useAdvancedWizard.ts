'use client';

/**
 * React Hook for Advanced Wizard
 *
 * Provides state management and methods for the Advanced Wizard flow.
 *
 * @module ufe/hooks/useAdvancedWizard
 */

import { useState, useCallback, useMemo } from 'react';
import type { UFEResult, TruckMeasurements, MotorcycleMeasurements, UnitSystem, QuoteBreakdown } from '../types';
import type { AdvancedWizardState, WizardStep } from '../wizards';
import {
  WIZARD_STEPS,
  createAdvancedWizardState,
  canProceed,
  nextStep as advanceStep,
  previousStep as goBackStep,
  goToStep as jumpToStep,
  setVehicleType,
  setTruckField,
  setMotorcycleField,
  setTailgateRequirements,
  setUnitSystem as updateUnitSystem,
  validateStep,
  getAdvancedWizardProgress,
  getStepTitle,
  getStepDescription,
} from '../wizards';

export interface UseAdvancedWizardReturn {
  /** Current wizard state */
  state: AdvancedWizardState;
  /** Current step ID */
  currentStep: WizardStep;
  /** Current step index (0-indexed) */
  stepIndex: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether the wizard is complete */
  isComplete: boolean;
  /** Whether current step is valid */
  isStepValid: boolean;
  /** Whether can proceed to next step */
  canGoNext: boolean;
  /** UFE result (available when complete) */
  result: UFEResult | null;
  /** Quote breakdown (available when complete) */
  quote: QuoteBreakdown | null;

  // Step navigation
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Jump to specific step */
  goToStep: (step: WizardStep) => void;

  // Data setters
  /** Set vehicle type */
  setVehicle: (type: 'pickup' | 'van' | 'trailer') => void;
  /** Update truck measurement field */
  updateTruck: <K extends keyof TruckMeasurements>(field: K, value: TruckMeasurements[K]) => void;
  /** Update motorcycle measurement field */
  updateMotorcycle: <K extends keyof MotorcycleMeasurements>(field: K, value: MotorcycleMeasurements[K]) => void;
  /** Set tailgate requirements */
  setTailgate: (mustClose: boolean, loadedWhenClosed?: boolean) => void;
  /** Set unit system */
  setUnitSystem: (system: UnitSystem) => void;

  // Utilities
  /** Reset wizard to start */
  reset: () => void;
  /** Get step title */
  getTitle: (step: WizardStep) => string;
  /** Get step description */
  getDescription: (step: WizardStep) => string;
  /** All wizard steps */
  steps: readonly WizardStep[];

  // Sync status
  /** Whether sync data was loaded */
  hasSyncData: boolean;
}

/**
 * React hook for managing Advanced Wizard state
 *
 * @example
 * ```tsx
 * function AdvancedWizard() {
 *   const {
 *     currentStep,
 *     progress,
 *     isComplete,
 *     result,
 *     canGoNext,
 *     nextStep,
 *     prevStep,
 *     updateTruck,
 *     updateMotorcycle,
 *   } = useAdvancedWizard();
 *
 *   if (isComplete && result) {
 *     return <Results result={result} />;
 *   }
 *
 *   return <StepContent step={currentStep} />;
 * }
 * ```
 */
export function useAdvancedWizard(): UseAdvancedWizardReturn {
  const [state, setState] = useState<AdvancedWizardState>(() => createAdvancedWizardState());

  // Calculate progress
  const progress = useMemo(() => getAdvancedWizardProgress(state), [state]);

  // Check if step is valid
  const isStepValid = useMemo(() => state.stepValidation[state.currentStep]?.isValid ?? false, [state]);

  // Check if can proceed
  const canGoNext = useMemo(() => canProceed(state), [state]);

  // Step navigation
  const nextStep = useCallback(() => {
    setState(prevState => advanceStep(prevState));
  }, []);

  const prevStep = useCallback(() => {
    setState(prevState => goBackStep(prevState));
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setState(prevState => jumpToStep(prevState, step));
  }, []);

  // Data setters
  const setVehicle = useCallback((type: 'pickup' | 'van' | 'trailer') => {
    setState(prevState => setVehicleType(prevState, type));
  }, []);

  const updateTruck = useCallback(<K extends keyof TruckMeasurements>(
    field: K,
    value: TruckMeasurements[K]
  ) => {
    setState(prevState => setTruckField(prevState, field, value));
  }, []);

  const updateMotorcycle = useCallback(<K extends keyof MotorcycleMeasurements>(
    field: K,
    value: MotorcycleMeasurements[K]
  ) => {
    setState(prevState => setMotorcycleField(prevState, field, value));
  }, []);

  const setTailgate = useCallback((mustClose: boolean, loadedWhenClosed?: boolean) => {
    setState(prevState => setTailgateRequirements(prevState, mustClose, loadedWhenClosed));
  }, []);

  const setUnitSystem = useCallback((system: UnitSystem) => {
    setState(prevState => updateUnitSystem(prevState, system));
  }, []);

  // Utilities
  const reset = useCallback(() => {
    setState(createAdvancedWizardState());
  }, []);

  const getTitle = useCallback((step: WizardStep) => getStepTitle(step), []);
  const getDescription = useCallback((step: WizardStep) => getStepDescription(step), []);

  return {
    state,
    currentStep: state.currentStep,
    stepIndex: state.stepIndex,
    progress,
    isComplete: state.isComplete,
    isStepValid,
    canGoNext,
    result: state.result,
    quote: state.quote,
    nextStep,
    prevStep,
    goToStep,
    setVehicle,
    updateTruck,
    updateMotorcycle,
    setTailgate,
    setUnitSystem,
    reset,
    getTitle,
    getDescription,
    steps: WIZARD_STEPS,
    hasSyncData: state.hasPrePopulatedData,
  };
}

export default useAdvancedWizard;
