/**
 * UFE Ramp Selector Engine
 *
 * Core recommendation logic applying all business rules.
 *
 * DECISION PRIORITY ORDER:
 * 1. Safety considerations
 * 2. Tailgate closure requirements
 * 3. Usable bed length calculation
 * 4. Tonneau penalty application
 * 5. Ramp geometry compatibility
 * 6. Required accessories
 * 7. Angle warnings (soft)
 * 8. User preferences
 */

import type {
  RampModelId,
  BedCategory,
  BedCategoryAnswer,
  QuickWizardInput,
  AdvancedWizardInput,
  RampRecommendation,
  RecommendationType,
  CalculatedValues,
  UFEFailure,
} from '../types';
import { getEngineSettings, getRampModel, getMessage } from '../config';
import { categorizeBedLength, getUsableBedLength } from './bed-length.engine';
import {
  validateTailgateRequirement,
  getRampForTailgateRequirement,
  getTailgateNotes,
} from './tailgate.engine';
import { getRequiredAccessories, getOptionalAccessories } from './accessory.engine';

// =============================================================================
// TYPES
// =============================================================================

export interface RampSelectionResult {
  /** Whether evaluation succeeded */
  success: boolean;
  /** Failure details (if applicable) */
  failure?: UFEFailure;
  /** Primary recommendation */
  primaryRecommendation?: RampRecommendation;
  /** Alternative recommendation */
  alternativeRecommendation?: RampRecommendation;
  /** Calculated values */
  calculatedValues: CalculatedValues;
}

interface EligibilityInput {
  rampId: RampModelId;
  bedCategory: BedCategory;
  usableBedLength: number;
  bedLengthWithTailgate?: number;
  tailgateMustClose: boolean;
  motorcycleLoadedWhenClosed: boolean;
  motorcycleLength?: number;
}

interface EligibilityResult {
  isEligible: boolean;
  type: RecommendationType;
  reasons: string[];
  warnings: string[];
  requiresAccessory?: string;
  disqualifyingReason?: string;
}

// =============================================================================
// QUICK WIZARD SELECTION
// =============================================================================

/**
 * Select ramp based on Quick Wizard input
 * Uses category-based logic without exact measurements
 */
export function selectRampQuickWizard(input: QuickWizardInput): RampSelectionResult {
  const settings = getEngineSettings();

  // Handle 'unsure' bed length - default to AUN250
  if (input.bedLength === 'unsure') {
    return createQuickWizardResult(
      'AUN250',
      'primary',
      ['Recommended when bed length is uncertain'],
      ['Consider using the Full Configurator with exact measurements for best results']
    );
  }

  // Tailgate closure is highest priority
  if (input.tailgateMustClose) {
    if (input.motorcycleLoadedWhenClosed) {
      // Tailgate must close with motorcycle loaded - AUN210 only
      // But in Quick Wizard, we can't verify measurements
      // Recommend AUN210 with caveat
      if (input.bedLength === 'long') {
        return createQuickWizardResult(
          'AUN210',
          'primary',
          [
            'Long bed with tailgate closure requirement',
            'AUN210 allows tailgate closure with motorcycle loaded',
          ],
          [
            'Exact measurements required to confirm motorcycle fits',
            'AC004 Tailgate Extension will be required',
          ]
        );
      }

      // Short/standard bed with loaded tailgate close - risky
      return createQuickWizardResult(
        'AUN210',
        'primary',
        ['Tailgate closure with motorcycle loaded requires AUN210'],
        [
          'Your bed length may be too short for this configuration',
          'Use the Full Configurator to verify motorcycle fits',
          'AC004 Tailgate Extension will be required if possible',
        ]
      );
    } else {
      // Tailgate must close, motorcycle NOT loaded - AUN250
      return createQuickWizardResult(
        'AUN250',
        'primary',
        [
          'Tailgate closure when unloaded',
          'AUN250 folds to allow tailgate closure',
        ],
        []
      );
    }
  }

  // No tailgate requirement - base on bed length
  switch (input.bedLength) {
    case 'short':
      return createQuickWizardResult(
        'AUN250',
        'primary',
        ['Short bed - AUN250 folding design ideal'],
        []
      );

    case 'standard':
      // Both could work - slight preference for AUN250 for flexibility
      return createQuickWizardResult(
        'AUN250',
        'primary',
        ['Standard bed - AUN250 offers folding flexibility'],
        [],
        'AUN210'
      );

    case 'long':
      return createQuickWizardResult(
        'AUN210',
        'primary',
        ['Long bed - AUN210 recommended'],
        [],
        'AUN250' // Alternative with 4-Beam
      );

    default:
      return createQuickWizardResult('AUN250', 'primary', ['Default recommendation'], []);
  }
}

/**
 * Helper to create Quick Wizard result
 */
function createQuickWizardResult(
  rampId: RampModelId,
  type: RecommendationType,
  reasons: string[],
  warnings: string[],
  alternativeId?: RampModelId
): RampSelectionResult {
  const rampModel = getRampModel(rampId);
  const settings = getEngineSettings();

  const primaryRecommendation: RampRecommendation = {
    rampId,
    type,
    name: rampModel?.name ?? rampId,
    price: rampModel?.price ?? 0,
    reasons,
    warnings,
    requiredAccessories: [], // Quick Wizard doesn't determine accessories
    optionalAccessories: [],
    totalWithRequired: rampModel?.price ?? 0,
  };

  let alternativeRecommendation: RampRecommendation | undefined;
  if (alternativeId) {
    const altModel = getRampModel(alternativeId);
    alternativeRecommendation = {
      rampId: alternativeId,
      type: 'alternative',
      name: altModel?.name ?? alternativeId,
      price: altModel?.price ?? 0,
      reasons: ['Alternative option available'],
      warnings:
        alternativeId === 'AUN250' ? ['4-Beam Extension may be required for long beds'] : [],
      requiredAccessories: [],
      optionalAccessories: [],
      totalWithRequired: altModel?.price ?? 0,
    };
  }

  // Quick Wizard uses estimated values
  const calculatedValues: CalculatedValues = {
    usableBedLength: 0, // Unknown without exact measurements
    tonneauPenalty: 0,
    bedCategory: 'standard', // Will be set based on input
    tailgateCloseWithLoadPossible: false,
    exceeds4BeamThreshold: false,
  };

  return {
    success: true,
    primaryRecommendation,
    alternativeRecommendation,
    calculatedValues,
  };
}

// =============================================================================
// ADVANCED WIZARD SELECTION
// =============================================================================

/**
 * Select ramp based on Advanced Wizard input
 * Uses exact measurements for precise recommendations
 */
export function selectRampAdvancedWizard(input: AdvancedWizardInput): RampSelectionResult {
  const settings = getEngineSettings();

  // Calculate derived values
  const { usableBedLength, tonneauPenalty } = getUsableBedLength(
    input.truck.bedLengthClosed,
    input.truck.hasTonneau,
    input.truck.tonneauType,
    input.truck.rollDirection
  );

  const bedCategory = categorizeBedLength(input.truck.bedLengthClosed);

  // Check 4-Beam threshold
  const exceeds4BeamThreshold =
    input.truck.bedLengthWithTailgate > settings.beamExtensionThresholdInches;

  // Check if tailgate can close with load
  const buffer = settings.tailgateCloseBufferInches;
  const requiredLengthForLoad = input.motorcycle.totalLength + buffer;
  const tailgateCloseWithLoadPossible = requiredLengthForLoad <= usableBedLength;

  const calculatedValues: CalculatedValues = {
    usableBedLength,
    tonneauPenalty,
    bedCategory,
    tailgateCloseWithLoadPossible,
    exceeds4BeamThreshold,
    requiredBedLengthForLoad: requiredLengthForLoad,
  };

  // Check for hard failure first
  if (
    input.tailgateMustClose &&
    input.motorcycleLoadedWhenClosed &&
    !tailgateCloseWithLoadPossible
  ) {
    return {
      success: false,
      failure: {
        type: 'hard',
        message: getMessage('errors.hardFailure.message'),
        details: getMessage('errors.hardFailure.details', {
          motorcycleLength: input.motorcycle.totalLength,
          buffer: buffer,
          total: requiredLengthForLoad,
          usableBedLength: usableBedLength.toFixed(1),
        }),
        suggestion: getMessage('errors.hardFailure.suggestion'),
      },
      calculatedValues,
    };
  }

  // Evaluate both ramps
  const aun210Eligibility = evaluateRampEligibility({
    rampId: 'AUN210',
    bedCategory,
    usableBedLength,
    bedLengthWithTailgate: input.truck.bedLengthWithTailgate,
    tailgateMustClose: input.tailgateMustClose,
    motorcycleLoadedWhenClosed: input.motorcycleLoadedWhenClosed ?? false,
    motorcycleLength: input.motorcycle.totalLength,
  });

  const aun250Eligibility = evaluateRampEligibility({
    rampId: 'AUN250',
    bedCategory,
    usableBedLength,
    bedLengthWithTailgate: input.truck.bedLengthWithTailgate,
    tailgateMustClose: input.tailgateMustClose,
    motorcycleLoadedWhenClosed: input.motorcycleLoadedWhenClosed ?? false,
    motorcycleLength: input.motorcycle.totalLength,
  });

  // Determine primary and alternative
  let primaryRamp: RampModelId;
  let alternativeRamp: RampModelId | null = null;

  // Priority decision logic
  if (input.tailgateMustClose && input.motorcycleLoadedWhenClosed) {
    // Only AUN210 can close tailgate with load
    primaryRamp = 'AUN210';
    alternativeRamp = null;
  } else if (input.tailgateMustClose && !input.motorcycleLoadedWhenClosed) {
    // Tailgate close unloaded - prefer AUN250
    primaryRamp = 'AUN250';
    alternativeRamp = 'AUN210';
  } else if (bedCategory === 'long') {
    // Long bed - prefer AUN210
    primaryRamp = 'AUN210';
    alternativeRamp = 'AUN250';
  } else if (bedCategory === 'short') {
    // Short bed - prefer AUN250
    primaryRamp = 'AUN250';
    alternativeRamp = 'AUN210';
  } else {
    // Standard bed - evaluate both, slight preference for AUN250
    primaryRamp = 'AUN250';
    alternativeRamp = 'AUN210';
  }

  // Build recommendations
  const primaryEligibility = primaryRamp === 'AUN210' ? aun210Eligibility : aun250Eligibility;
  const altEligibility = alternativeRamp
    ? alternativeRamp === 'AUN210'
      ? aun210Eligibility
      : aun250Eligibility
    : null;

  const primaryRecommendation = buildRampRecommendation(
    primaryRamp,
    primaryEligibility,
    input,
    calculatedValues
  );

  const alternativeRecommendation = alternativeRamp && altEligibility
    ? buildRampRecommendation(alternativeRamp, altEligibility, input, calculatedValues)
    : undefined;

  return {
    success: true,
    primaryRecommendation,
    alternativeRecommendation,
    calculatedValues,
  };
}

// =============================================================================
// ELIGIBILITY EVALUATION
// =============================================================================

/**
 * Evaluate eligibility of a specific ramp
 */
function evaluateRampEligibility(input: EligibilityInput): EligibilityResult {
  const settings = getEngineSettings();
  const reasons: string[] = [];
  const warnings: string[] = [];

  // AUN210 Evaluation
  if (input.rampId === 'AUN210') {
    // Check tailgate requirements
    if (input.tailgateMustClose && input.motorcycleLoadedWhenClosed) {
      if (input.motorcycleLength) {
        const buffer = settings.tailgateCloseBufferInches;
        const requiredLength = input.motorcycleLength + buffer;
        if (requiredLength <= input.usableBedLength) {
          reasons.push('Allows tailgate closure with motorcycle loaded');
          reasons.push('AC004 Tailgate Extension required for loading/unloading');
          return {
            isEligible: true,
            type: 'primary',
            reasons,
            warnings,
            requiresAccessory: 'AC004',
          };
        } else {
          return {
            isEligible: false,
            type: 'not-recommended',
            reasons: [],
            warnings: [],
            disqualifyingReason: 'Motorcycle too long for tailgate closure',
          };
        }
      }
    }

    // Long bed preference
    if (input.bedCategory === 'long') {
      reasons.push('Ideal for long bed trucks');
    }

    // AC004 incompatibility doesn't apply since AC004 is FOR AUN210
    // 4-Beam incompatibility - AUN210 doesn't use 4-Beam
    if (
      input.bedLengthWithTailgate &&
      input.bedLengthWithTailgate > settings.beamExtensionThresholdInches
    ) {
      // This is fine for AUN210 - it doesn't need 4-Beam
      reasons.push('Works without bed extension accessories');
    }

    return {
      isEligible: true,
      type: input.bedCategory === 'long' ? 'primary' : 'alternative',
      reasons,
      warnings,
    };
  }

  // AUN250 Evaluation
  if (input.rampId === 'AUN250') {
    // Cannot close tailgate with motorcycle loaded
    if (input.tailgateMustClose && input.motorcycleLoadedWhenClosed) {
      return {
        isEligible: false,
        type: 'not-recommended',
        reasons: [],
        warnings: [],
        disqualifyingReason: 'AUN250 cannot close tailgate with motorcycle loaded',
      };
    }

    // Tailgate close unloaded - good for AUN250
    if (input.tailgateMustClose && !input.motorcycleLoadedWhenClosed) {
      reasons.push('Folds to allow tailgate closure when unloaded');
    }

    // Short bed preference
    if (input.bedCategory === 'short') {
      reasons.push('Folding design ideal for shorter beds');
    }

    // Long bed requires 4-Beam
    if (input.bedCategory === 'long') {
      warnings.push('4-Beam Extension required for long beds');
    }

    // Check 4-Beam threshold
    if (
      input.bedLengthWithTailgate &&
      input.bedLengthWithTailgate > settings.beamExtensionThresholdInches
    ) {
      reasons.push('4-Beam Extension required (total length exceeds threshold)');
      return {
        isEligible: true,
        type: input.bedCategory === 'long' ? 'alternative' : 'primary',
        reasons,
        warnings,
        requiresAccessory: '4-BEAM',
      };
    }

    return {
      isEligible: true,
      type: input.bedCategory === 'short' ? 'primary' : 'alternative',
      reasons,
      warnings,
    };
  }

  return {
    isEligible: false,
    type: 'not-recommended',
    reasons: [],
    warnings: [],
    disqualifyingReason: 'Unknown ramp model',
  };
}

// =============================================================================
// RECOMMENDATION BUILDER
// =============================================================================

/**
 * Build complete ramp recommendation
 */
function buildRampRecommendation(
  rampId: RampModelId,
  eligibility: EligibilityResult,
  input: AdvancedWizardInput,
  calculatedValues: CalculatedValues
): RampRecommendation {
  const rampModel = getRampModel(rampId);

  // Get required accessories
  const requiredAccessories = getRequiredAccessories(rampId, input, calculatedValues);

  // Get optional accessories
  const optionalAccessories = getOptionalAccessories(rampId);

  // Calculate total with required accessories
  const rampPrice = rampModel?.price ?? 0;
  const accessoriesTotal = requiredAccessories.reduce((sum, acc) => sum + acc.price, 0);

  // Add tailgate notes to warnings
  const tailgateNotes = getTailgateNotes(
    rampId,
    input.tailgateMustClose,
    input.motorcycleLoadedWhenClosed ?? false
  );

  return {
    rampId,
    type: eligibility.type,
    name: rampModel?.name ?? rampId,
    price: rampPrice,
    reasons: eligibility.reasons,
    warnings: [...eligibility.warnings, ...tailgateNotes],
    requiredAccessories,
    optionalAccessories,
    totalWithRequired: rampPrice + accessoriesTotal,
  };
}
