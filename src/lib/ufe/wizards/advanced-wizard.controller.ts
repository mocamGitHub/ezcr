/**
 * UFE Advanced Wizard Controller
 *
 * Manages Advanced Wizard (Full Configurator) state with detailed measurements.
 * Multi-step form with validation and real-time accessory calculation.
 */

import type {
  AdvancedWizardInput,
  TruckMeasurements,
  MotorcycleMeasurements,
  TonneauType,
  RollDirection,
  UnitSystem,
  UFEResult,
  QuoteBreakdown,
  QuoteLineItem,
  ValidationResult,
} from '../types';
import {
  selectRampAdvancedWizard,
  calculateAndEvaluateAngle,
  categorizeBedLength,
  getUsableBedLength,
} from '../engines';
import { getEngineSettings, getRampModel, getMessage } from '../config';
import {
  validateTruckMeasurements,
  validateMotorcycleMeasurements,
  validateAdvancedWizardInput,
  createInputHash,
  normalizeToImperial,
  formatCurrency,
} from '../utils';
import {
  getWizardSyncData,
  saveWizardSyncData,
  mapQuickToAdvanced,
} from './wizard-sync.engine';

// =============================================================================
// WIZARD STEPS
// =============================================================================

export type WizardStep =
  | 'vehicle'
  | 'truck-measurements'
  | 'motorcycle-measurements'
  | 'tailgate-requirements'
  | 'review'
  | 'result';

export const WIZARD_STEPS: WizardStep[] = [
  'vehicle',
  'truck-measurements',
  'motorcycle-measurements',
  'tailgate-requirements',
  'review',
  'result',
];

// =============================================================================
// WIZARD STATE
// =============================================================================

export interface AdvancedWizardState {
  currentStep: WizardStep;
  stepIndex: number;

  // Form data
  vehicleType: 'pickup' | 'van' | 'trailer' | null;
  truck: Partial<TruckMeasurements>;
  motorcycle: Partial<MotorcycleMeasurements>;
  tailgateMustClose: boolean;
  motorcycleLoadedWhenClosed: boolean;
  unitSystem: UnitSystem;

  // Validation
  stepValidation: Record<WizardStep, ValidationResult>;
  touchedFields: Set<string>;

  // Results
  isComplete: boolean;
  result: UFEResult | null;
  quote: QuoteBreakdown | null;

  // Sync
  hasPrePopulatedData: boolean;
}

/**
 * Create initial wizard state
 */
export function createInitialState(): AdvancedWizardState {
  // Check for pre-populated data from Quick Wizard
  const syncData = getWizardSyncData();
  let prePopulated: Partial<AdvancedWizardInput> = {};
  let hasPrePopulatedData = false;

  if (syncData?.quickWizardData) {
    prePopulated = mapQuickToAdvanced(syncData.quickWizardData);
    hasPrePopulatedData = true;
  }

  return {
    currentStep: 'vehicle',
    stepIndex: 0,

    vehicleType: null,
    truck: {
      hasTonneau: prePopulated.truck?.hasTonneau ?? false,
      tonneauType: prePopulated.truck?.tonneauType,
      rollDirection: prePopulated.truck?.rollDirection,
    },
    motorcycle: {},
    tailgateMustClose: prePopulated.tailgateMustClose ?? false,
    motorcycleLoadedWhenClosed: prePopulated.motorcycleLoadedWhenClosed ?? false,
    unitSystem: 'imperial',

    stepValidation: {
      vehicle: { isValid: false, errors: {}, warnings: [] },
      'truck-measurements': { isValid: false, errors: {}, warnings: [] },
      'motorcycle-measurements': { isValid: false, errors: {}, warnings: [] },
      'tailgate-requirements': { isValid: true, errors: {}, warnings: [] },
      review: { isValid: false, errors: {}, warnings: [] },
      result: { isValid: true, errors: {}, warnings: [] },
    },
    touchedFields: new Set(),

    isComplete: false,
    result: null,
    quote: null,

    hasPrePopulatedData,
  };
}

// =============================================================================
// STEP NAVIGATION
// =============================================================================

/**
 * Get current step index
 */
export function getStepIndex(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(step);
}

/**
 * Can proceed to next step?
 */
export function canProceed(state: AdvancedWizardState): boolean {
  const validation = state.stepValidation[state.currentStep];
  return validation.isValid;
}

/**
 * Go to next step
 */
export function nextStep(state: AdvancedWizardState): AdvancedWizardState {
  const currentIndex = getStepIndex(state.currentStep);
  if (currentIndex >= WIZARD_STEPS.length - 1) {
    return state;
  }

  const nextStepName = WIZARD_STEPS[currentIndex + 1];

  // If moving to result step, evaluate
  if (nextStepName === 'result') {
    return evaluateAndComplete(state);
  }

  return {
    ...state,
    currentStep: nextStepName,
    stepIndex: currentIndex + 1,
  };
}

/**
 * Go to previous step
 */
export function previousStep(state: AdvancedWizardState): AdvancedWizardState {
  const currentIndex = getStepIndex(state.currentStep);
  if (currentIndex <= 0) {
    return state;
  }

  return {
    ...state,
    currentStep: WIZARD_STEPS[currentIndex - 1],
    stepIndex: currentIndex - 1,
    isComplete: false,
    result: null,
    quote: null,
  };
}

/**
 * Go to specific step
 */
export function goToStep(
  state: AdvancedWizardState,
  step: WizardStep
): AdvancedWizardState {
  const targetIndex = getStepIndex(step);

  // Can only go to previous steps or validated current step
  if (targetIndex > state.stepIndex && !canProceed(state)) {
    return state;
  }

  return {
    ...state,
    currentStep: step,
    stepIndex: targetIndex,
    isComplete: false,
    result: targetIndex === WIZARD_STEPS.length - 1 ? state.result : null,
    quote: targetIndex === WIZARD_STEPS.length - 1 ? state.quote : null,
  };
}

// =============================================================================
// FIELD UPDATES
// =============================================================================

/**
 * Update vehicle type
 */
export function setVehicleType(
  state: AdvancedWizardState,
  vehicleType: 'pickup' | 'van' | 'trailer'
): AdvancedWizardState {
  const newState = {
    ...state,
    vehicleType,
    touchedFields: new Set([...state.touchedFields, 'vehicleType']),
  };

  return validateStep(newState, 'vehicle');
}

/**
 * Update truck measurement field
 */
export function setTruckField<K extends keyof TruckMeasurements>(
  state: AdvancedWizardState,
  field: K,
  value: TruckMeasurements[K]
): AdvancedWizardState {
  const newTruck = { ...state.truck, [field]: value };

  // Clear roll direction if tonneau type is not roll-up
  if (field === 'tonneauType' && !String(value).includes('roll-up')) {
    delete newTruck.rollDirection;
  }

  // Clear tonneau fields if hasTonneau is false
  if (field === 'hasTonneau' && value === false) {
    delete newTruck.tonneauType;
    delete newTruck.rollDirection;
  }

  const newState = {
    ...state,
    truck: newTruck,
    touchedFields: new Set([...state.touchedFields, `truck.${field}`]),
  };

  return validateStep(newState, 'truck-measurements');
}

/**
 * Update motorcycle measurement field
 */
export function setMotorcycleField<K extends keyof MotorcycleMeasurements>(
  state: AdvancedWizardState,
  field: K,
  value: MotorcycleMeasurements[K]
): AdvancedWizardState {
  const newState = {
    ...state,
    motorcycle: { ...state.motorcycle, [field]: value },
    touchedFields: new Set([...state.touchedFields, `motorcycle.${field}`]),
  };

  return validateStep(newState, 'motorcycle-measurements');
}

/**
 * Update tailgate requirements
 */
export function setTailgateRequirements(
  state: AdvancedWizardState,
  tailgateMustClose: boolean,
  motorcycleLoadedWhenClosed?: boolean
): AdvancedWizardState {
  const newState = {
    ...state,
    tailgateMustClose,
    motorcycleLoadedWhenClosed: tailgateMustClose
      ? motorcycleLoadedWhenClosed ?? state.motorcycleLoadedWhenClosed
      : false,
    touchedFields: new Set([
      ...state.touchedFields,
      'tailgateMustClose',
      'motorcycleLoadedWhenClosed',
    ]),
  };

  return validateStep(newState, 'tailgate-requirements');
}

/**
 * Update unit system
 */
export function setUnitSystem(
  state: AdvancedWizardState,
  unitSystem: UnitSystem
): AdvancedWizardState {
  return {
    ...state,
    unitSystem,
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate a specific step
 */
export function validateStep(
  state: AdvancedWizardState,
  step: WizardStep
): AdvancedWizardState {
  let validation: ValidationResult;

  switch (step) {
    case 'vehicle':
      validation = {
        isValid: state.vehicleType !== null,
        errors: state.vehicleType === null ? { vehicleType: 'Please select a vehicle type' } : {},
        warnings: [],
      };
      break;

    case 'truck-measurements':
      validation = validateTruckMeasurements(state.truck as TruckMeasurements);
      break;

    case 'motorcycle-measurements':
      validation = validateMotorcycleMeasurements(state.motorcycle as MotorcycleMeasurements);
      break;

    case 'tailgate-requirements':
      // Tailgate step is always valid (boolean selections)
      validation = { isValid: true, errors: {}, warnings: [] };
      break;

    case 'review':
      // Review is valid if all previous steps are valid
      const allPreviousValid =
        state.stepValidation['vehicle'].isValid &&
        state.stepValidation['truck-measurements'].isValid &&
        state.stepValidation['motorcycle-measurements'].isValid &&
        state.stepValidation['tailgate-requirements'].isValid;
      validation = {
        isValid: allPreviousValid,
        errors: allPreviousValid ? {} : { review: 'Please complete all previous steps' },
        warnings: [],
      };
      break;

    default:
      validation = { isValid: true, errors: {}, warnings: [] };
  }

  return {
    ...state,
    stepValidation: {
      ...state.stepValidation,
      [step]: validation,
    },
  };
}

/**
 * Validate all steps
 */
export function validateAllSteps(state: AdvancedWizardState): AdvancedWizardState {
  let newState = state;
  for (const step of WIZARD_STEPS) {
    newState = validateStep(newState, step);
  }
  return newState;
}

// =============================================================================
// EVALUATION
// =============================================================================

/**
 * Build complete input from state
 */
export function buildInput(state: AdvancedWizardState): AdvancedWizardInput {
  return {
    truck: state.truck as TruckMeasurements,
    motorcycle: state.motorcycle as MotorcycleMeasurements,
    tailgateMustClose: state.tailgateMustClose,
    motorcycleLoadedWhenClosed: state.motorcycleLoadedWhenClosed,
    unitSystem: state.unitSystem,
  };
}

/**
 * Evaluate and complete the wizard
 */
export function evaluateAndComplete(state: AdvancedWizardState): AdvancedWizardState {
  // Build input
  const input = buildInput(state);

  // Validate complete input
  const validation = validateAdvancedWizardInput(input);
  if (!validation.isValid) {
    return {
      ...state,
      stepValidation: {
        ...state.stepValidation,
        review: validation,
      },
    };
  }

  // Run evaluation
  const selectionResult = selectRampAdvancedWizard(input);

  // Calculate angle if enabled
  let angleWarning: string | undefined;
  if (selectionResult.success) {
    const angleResult = calculateAndEvaluateAngle(
      input.truck.tailgateHeight,
      selectionResult.calculatedValues.usableBedLength
    );
    if (angleResult.isWarning) {
      angleWarning = angleResult.warningMessage;
    }
    selectionResult.calculatedValues.loadingAngle = angleResult.angleDegrees;
  }

  // Build tonneau notes
  const tonneauNotes = buildTonneauNotes(input);

  // Create UFE result
  const result: UFEResult = {
    success: selectionResult.success,
    failure: selectionResult.failure,
    primaryRecommendation: selectionResult.primaryRecommendation,
    alternativeRecommendation: selectionResult.alternativeRecommendation,
    calculatedValues: selectionResult.calculatedValues,
    tonneauNotes,
    angleWarning,
    timestamp: new Date().toISOString(),
    inputHash: createInputHash(input),
  };

  // Build quote if successful
  let quote: QuoteBreakdown | null = null;
  if (result.success && result.primaryRecommendation) {
    quote = buildQuote(result);
  }

  // Save sync data for Quick Wizard
  saveWizardSyncData({
    source: 'advanced',
    advancedWizardData: input,
    recommendation: result.primaryRecommendation?.rampId,
  });

  return {
    ...state,
    currentStep: 'result',
    stepIndex: WIZARD_STEPS.length - 1,
    isComplete: true,
    result,
    quote,
  };
}

/**
 * Build tonneau notes
 */
function buildTonneauNotes(input: AdvancedWizardInput): string[] {
  const notes: string[] = [];

  if (!input.truck.hasTonneau || input.truck.tonneauType === 'none') {
    return notes;
  }

  if (input.truck.rollDirection === 'into-bed') {
    notes.push(getMessage('warnings.tonneau.rollsIntoBed', { penalty: '10' }));
  }

  switch (input.truck.tonneauType) {
    case 'tri-fold-soft':
    case 'tri-fold-hard':
      notes.push(getMessage('warnings.tonneau.triFold'));
      break;
    case 'bi-fold':
      notes.push(getMessage('warnings.tonneau.biFold'));
      break;
    case 'hinged':
      notes.push(getMessage('warnings.tonneau.hinged'));
      break;
    case 'retractable':
      notes.push(getMessage('warnings.tonneau.retractable'));
      break;
  }

  return notes;
}

// =============================================================================
// QUOTE BUILDER
// =============================================================================

/**
 * Build quote breakdown from UFE result
 */
export function buildQuote(result: UFEResult): QuoteBreakdown {
  const settings = getEngineSettings();
  const rec = result.primaryRecommendation!;
  const rampModel = getRampModel(rec.rampId);

  // Ramp line item
  const rampItem: QuoteLineItem = {
    sku: rec.rampId,
    name: rampModel?.name ?? rec.rampId,
    quantity: 1,
    unitPrice: rec.price,
    totalPrice: rec.price,
    required: true,
  };

  // Accessory line items
  const accessoryItems: QuoteLineItem[] = rec.requiredAccessories.map((acc) => ({
    sku: acc.accessoryId,
    name: acc.name,
    quantity: 1,
    unitPrice: acc.price,
    totalPrice: acc.price,
    required: acc.required,
  }));

  // Calculate totals
  const subtotal = rec.totalWithRequired;
  const discount = 0; // No bulk discount for single item
  const subtotalAfterDiscount = subtotal - discount;
  const tax = subtotalAfterDiscount * settings.pricing.taxRate;
  const processingFee = subtotalAfterDiscount * settings.pricing.processingFeeRate;
  const freeShipping = subtotalAfterDiscount >= settings.pricing.freeShippingThreshold;
  const shipping = freeShipping ? 0 : settings.pricing.shippingCost;
  const total = subtotalAfterDiscount + tax + processingFee + shipping;

  return {
    ramp: rampItem,
    accessories: accessoryItems,
    subtotal,
    discount,
    subtotalAfterDiscount,
    tax,
    processingFee,
    shipping,
    total,
    freeShipping,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get progress percentage
 */
export function getProgress(state: AdvancedWizardState): number {
  // Don't count 'result' step in progress
  const totalSteps = WIZARD_STEPS.length - 1;
  return Math.min(100, (state.stepIndex / totalSteps) * 100);
}

/**
 * Get step title
 */
export function getStepTitle(step: WizardStep): string {
  const titles: Record<WizardStep, string> = {
    vehicle: 'Vehicle Type',
    'truck-measurements': 'Truck Measurements',
    'motorcycle-measurements': 'Motorcycle Specifications',
    'tailgate-requirements': 'Tailgate Requirements',
    review: 'Review Configuration',
    result: 'Your Recommendation',
  };
  return titles[step];
}

/**
 * Get step description
 */
export function getStepDescription(step: WizardStep): string {
  const descriptions: Record<WizardStep, string> = {
    vehicle: 'What type of vehicle will you be using?',
    'truck-measurements': 'Enter your truck bed measurements',
    'motorcycle-measurements': 'Enter your motorcycle specifications',
    'tailgate-requirements': 'Do you need your tailgate to close?',
    review: 'Review your configuration before getting your recommendation',
    result: 'Based on your specifications, here is our recommendation',
  };
  return descriptions[step];
}

/**
 * Reset wizard to initial state
 */
export function resetWizard(): AdvancedWizardState {
  return createInitialState();
}

/**
 * Check if wizard has changes from initial state
 */
export function hasChanges(state: AdvancedWizardState): boolean {
  return state.touchedFields.size > 0;
}
