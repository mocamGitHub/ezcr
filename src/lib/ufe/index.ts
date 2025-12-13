/**
 * Unified Fitment Engine (UFE)
 *
 * Main entry point for the UFE system.
 * Provides high-level API for ramp fitment recommendations.
 *
 * @module ufe
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Core identifiers
  RampModelId,
  AccessoryId,
  HeightExtensionId,
  BedCategory,
  BedCategoryAnswer,
  TonneauType,
  RollDirection,
  UnitSystem,
  // Result types
  RecommendationType,
  FailureType,
  AccessoryRequirementType,
  // Wizard inputs
  QuickWizardInput,
  QuickWizardQuestion,
  QuickWizardOption,
  TruckMeasurements,
  MotorcycleMeasurements,
  AdvancedWizardInput,
  // Calculation types
  CalculatedValues,
  AngleCalculation,
  // Accessory types
  AccessoryRequirement,
  AccessoryCompatibility,
  // Recommendation types
  RampRecommendation,
  UFEFailure,
  UFEResult,
  // Wizard sync
  WizardSyncData,
  // Config types
  EngineSettings,
  RampModelConfig,
  AccessoryConfig,
  BedCategoryConfig,
  // Validation
  ValidationResult,
  ValidationRange,
  // Quote
  QuoteLineItem,
  QuoteBreakdown,
} from './types';

// =============================================================================
// CONFIG EXPORTS
// =============================================================================

export {
  loadConfig,
  reloadConfig,
  getEngineSettings,
  getRampModel,
  getActiveRampModels,
  getAccessory,
  getAllAccessories,
  getCompatibleAccessories,
  isAccessoryCompatible,
  getBedCategory,
  getAllBedCategories,
  getQuickWizardBedOptions,
  getMessage,
  getPricingConfig,
  getBulkDiscount,
  validateConfig,
} from './config';

// =============================================================================
// ENGINE EXPORTS
// =============================================================================

export {
  // Bed Length Engine
  categorizeBedLength,
  isInCategory,
  getCategoryBounds,
  determineTonneauPenalty,
  calculateUsableBedLength,
  getUsableBedLength,
  estimateBedLengthFromCategory,
  getEstimatedMidpoint,
  isValidBedLength,
  isValidTotalLength,
  getCategoryDisplayInfo,
  isNearCategoryBoundary,
  // Tailgate Engine
  canTailgateCloseLoaded,
  canTailgateCloseUnloaded,
  validateTailgateRequirement,
  getRampForTailgateRequirement,
  supportsTailgateClose,
  getTailgateNotes,
  // Ramp Selector Engine
  selectRampQuickWizard,
  selectRampAdvancedWizard,
  // Accessory Engine
  getHeightExtension,
  needsHeightExtension,
  requiresAC004,
  isAC004Compatible,
  requires4Beam,
  is4BeamCompatible,
  getRequiredAccessories,
  getOptionalAccessories,
  getAllCompatibleAccessories,
  validateAccessoryCompatibility,
  filterCompatibleAccessories,
  calculateAccessoriesTotal,
  calculateRequiredAccessoriesTotal,
  getAccessoryNotes,
  getAccessoryRecommendationReason,
  // Angle Engine
  isAngleCalculationEnabled,
  getAngleSettings,
  calculateLoadingAngle,
  calculateAngleWithExtension,
  evaluateAngleSafety,
  calculateAndEvaluateAngle,
  classifyAngle,
  getAngleRecommendations,
  suggestHeightExtension,
  formatAngleWithClassification,
  getAngleIndicatorColor,
} from './engines';

export type {
  TailgateValidationInput,
  TailgateValidationResult,
  RampSelectionResult,
} from './engines';

// =============================================================================
// WIZARD EXPORTS
// =============================================================================

export {
  // Quick Wizard
  createQuickWizardState,
  buildQuestionFlow,
  getCurrentQuestion,
  getQuickWizardProgress,
  processAnswer,
  goBackQuickWizard,
  resetQuickWizard,
  evaluateQuickWizard,
  shouldShowQuestion,
  getRecommendationSummary,
  QUESTIONS,
  // Advanced Wizard
  WIZARD_STEPS,
  createAdvancedWizardState,
  getStepIndex,
  canProceed,
  nextStep,
  previousStep,
  goToStep,
  setVehicleType,
  setTruckField,
  setMotorcycleField,
  setTailgateRequirements,
  setUnitSystem,
  validateStep,
  validateAllSteps,
  buildInput,
  evaluateAndComplete,
  buildQuote,
  getAdvancedWizardProgress,
  getStepTitle,
  getStepDescription,
  resetAdvancedWizard,
  hasChanges,
  // Wizard Sync
  saveWizardSyncData,
  getWizardSyncData,
  clearWizardSyncData,
  hasSyncData,
  getTimeUntilExpiry,
  mapQuickToAdvanced,
  getBedLengthHints,
  mapAdvancedToQuick,
  getSyncStatus,
  getSyncMessage,
  resolveConflicts,
} from './wizards';

export type {
  QuickWizardState,
  AdvancedWizardState,
  WizardStep,
  SyncStatus,
} from './wizards';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export {
  // Converters
  CONVERSION_FACTORS,
  inchesToCm,
  cmToInches,
  inchesToFeet,
  feetToInches,
  inchesToFeetAndInches,
  parseFeetAndInches,
  lbsToKg,
  kgToLbs,
  degreesToRadians,
  radiansToDegrees,
  convertLength,
  convertWeight,
  normalizeToImperial,
  formatCurrency,
  formatNumber,
  formatLength,
  formatWeight,
  formatAngle,
  formatPercent,
  // Validators
  isWithinRange,
  isPositiveNumber,
  isNonNegativeNumber,
  isDefined,
  validateTruckMeasurements,
  validateMotorcycleMeasurements,
  validateQuickWizardInput,
  validateAdvancedWizardInput,
  validateMeasurementField,
  createInputHash,
  // Output Builder
  buildRecommendationMessage,
  buildDetailedRecommendation,
  buildAccessoryList,
  buildQuoteDisplay,
  buildCalculatedValuesSummary,
  buildTonneauNotesDisplay,
  buildFailureDisplay,
  buildRampComparison,
  buildResultSummary,
  buildPlainTextSummary,
} from './utils';

// =============================================================================
// HIGH-LEVEL API
// =============================================================================

import type { QuickWizardInput, AdvancedWizardInput, UFEResult } from './types';
import { selectRampQuickWizard, selectRampAdvancedWizard, calculateAndEvaluateAngle } from './engines';
import { createInputHash } from './utils';
import { getMessage } from './config';

/**
 * Evaluate Quick Wizard input and return recommendation
 *
 * @param input - Quick Wizard answers
 * @returns UFE result with recommendation
 */
export function evaluateQuick(input: QuickWizardInput): UFEResult {
  const selectionResult = selectRampQuickWizard(input);

  // Build tonneau notes
  const tonneauNotes: string[] = [];
  if (input.hasTonneau && input.tonneauType !== 'none') {
    if (input.rollDirection === 'into-bed') {
      tonneauNotes.push(getMessage('warnings.tonneau.rollsIntoBed', { penalty: '8-12' }));
    }
    if (input.tonneauType?.includes('tri-fold') || input.tonneauType === 'bi-fold') {
      tonneauNotes.push(getMessage('warnings.tonneau.triFold'));
    }
    if (input.tonneauType === 'hinged') {
      tonneauNotes.push(getMessage('warnings.tonneau.hinged'));
    }
    if (input.tonneauType === 'retractable') {
      tonneauNotes.push(getMessage('warnings.tonneau.retractable'));
    }
  }

  return {
    success: selectionResult.success,
    failure: selectionResult.failure,
    primaryRecommendation: selectionResult.primaryRecommendation,
    alternativeRecommendation: selectionResult.alternativeRecommendation,
    calculatedValues: selectionResult.calculatedValues,
    tonneauNotes,
    timestamp: new Date().toISOString(),
    inputHash: createInputHash(input),
  };
}

/**
 * Evaluate Advanced Wizard input and return full recommendation with accessories
 *
 * @param input - Advanced Wizard measurements and requirements
 * @returns UFE result with recommendation and accessories
 */
export function evaluateAdvanced(input: AdvancedWizardInput): UFEResult {
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
  const tonneauNotes: string[] = [];
  if (input.truck.hasTonneau && input.truck.tonneauType !== 'none') {
    if (input.truck.rollDirection === 'into-bed') {
      tonneauNotes.push(getMessage('warnings.tonneau.rollsIntoBed', { penalty: '10' }));
    }
    if (input.truck.tonneauType?.includes('tri-fold') || input.truck.tonneauType === 'bi-fold') {
      tonneauNotes.push(getMessage('warnings.tonneau.triFold'));
    }
    if (input.truck.tonneauType === 'hinged') {
      tonneauNotes.push(getMessage('warnings.tonneau.hinged'));
    }
    if (input.truck.tonneauType === 'retractable') {
      tonneauNotes.push(getMessage('warnings.tonneau.retractable'));
    }
  }

  return {
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
}

/**
 * UFE Version
 */
export const UFE_VERSION = '1.0.0';

/**
 * UFE Module Info
 */
export const UFE_INFO = {
  name: 'Unified Fitment Engine',
  version: UFE_VERSION,
  description: 'Config-driven fitment recommendation engine for EZ Cycle Ramp',
  supportedRamps: ['AUN210', 'AUN250'],
  supportedAccessories: ['AC004', '4-BEAM', 'AC001-1', 'AC001-2', 'AC001-3', 'AC012'],
};

// =============================================================================
// REACT HOOKS (Client-side only)
// =============================================================================

// Note: Hooks are exported from a separate entry point to avoid
// importing React in server-side code. Use:
// import { useQuickWizard, useAdvancedWizard, useUFE } from '@/lib/ufe/hooks'
