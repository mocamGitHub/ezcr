/**
 * UFE Tailgate Engine
 *
 * Handles all tailgate closure logic and validation.
 *
 * AUTHORITATIVE RULES:
 * - AUN210: Does NOT fold. Tailgate CAN close with motorcycle loaded IF
 *   motorcycle_length + 3" <= usable_bed_length. Requires AC004.
 * - AUN250: Folds ONLY when motorcycle NOT loaded. Tailgate CANNOT close
 *   while motorcycle loaded. Tailgate CAN close when motorcycle removed
 *   AND ramp folded.
 */

import type { RampModelId } from '../types';
import { getEngineSettings, getRampModel } from '../config';

// =============================================================================
// TYPES
// =============================================================================

export interface TailgateValidationInput {
  /** Selected or candidate ramp model */
  rampId: RampModelId;
  /** Whether tailgate must close */
  tailgateMustClose: boolean;
  /** Whether motorcycle will be loaded when tailgate must close */
  motorcycleLoadedWhenClosed: boolean;
  /** Motorcycle total length in inches */
  motorcycleLength?: number;
  /** Usable bed length in inches (after tonneau penalty) */
  usableBedLength?: number;
}

export interface TailgateValidationResult {
  /** Whether the configuration is possible */
  isPossible: boolean;
  /** Whether this is a hard failure (no workaround) */
  isHardFailure: boolean;
  /** Whether AC004 is required */
  requiresAC004: boolean;
  /** Whether ramp must be folded */
  requiresFolded: boolean;
  /** Explanation of result */
  reason: string;
  /** Detailed message for user */
  details?: string;
  /** Available margin (if applicable) */
  marginInches?: number;
}

// =============================================================================
// CORE TAILGATE LOGIC
// =============================================================================

/**
 * Check if tailgate can close when motorcycle is loaded
 *
 * Only applicable to AUN210. AUN250 CANNOT close tailgate with motorcycle loaded.
 */
export function canTailgateCloseLoaded(
  rampId: RampModelId,
  motorcycleLength: number,
  usableBedLength: number
): {
  canClose: boolean;
  requiresAC004: boolean;
  marginInches: number;
} {
  const settings = getEngineSettings();
  const buffer = settings.tailgateCloseBufferInches;

  // AUN250 can NEVER close tailgate with motorcycle loaded
  if (rampId === 'AUN250') {
    return {
      canClose: false,
      requiresAC004: false,
      marginInches: -(motorcycleLength + buffer - usableBedLength),
    };
  }

  // AUN210: Check if motorcycle fits with buffer
  const requiredLength = motorcycleLength + buffer;
  const canClose = requiredLength <= usableBedLength;
  const marginInches = usableBedLength - requiredLength;

  return {
    canClose,
    requiresAC004: canClose, // AC004 always required for AUN210 tailgate close with load
    marginInches,
  };
}

/**
 * Check if tailgate can close when motorcycle is NOT loaded
 *
 * - AUN210: Always yes (non-folding ramp doesn't block tailgate)
 * - AUN250: Yes, when ramp is folded
 */
export function canTailgateCloseUnloaded(rampId: RampModelId): {
  canClose: boolean;
  requiresFolded: boolean;
} {
  const rampModel = getRampModel(rampId);

  // AUN210: Always can close when unloaded
  if (rampId === 'AUN210') {
    return {
      canClose: true,
      requiresFolded: false,
    };
  }

  // AUN250: Can close when folded
  if (rampId === 'AUN250') {
    return {
      canClose: true,
      requiresFolded: true,
    };
  }

  // Default based on config
  return {
    canClose: rampModel?.tailgateCloseUnloaded ?? false,
    requiresFolded: rampModel?.folds ?? false,
  };
}

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validate tailgate requirement against ramp configuration
 *
 * This is the main function that applies all tailgate business rules.
 */
export function validateTailgateRequirement(
  input: TailgateValidationInput
): TailgateValidationResult {
  const { rampId, tailgateMustClose, motorcycleLoadedWhenClosed } = input;

  // If tailgate doesn't need to close, no validation needed
  if (!tailgateMustClose) {
    return {
      isPossible: true,
      isHardFailure: false,
      requiresAC004: false,
      requiresFolded: false,
      reason: 'Tailgate closure not required',
    };
  }

  // Tailgate must close - check loaded vs unloaded scenarios
  if (!motorcycleLoadedWhenClosed) {
    // Scenario: Tailgate must close, motorcycle NOT loaded
    const unloadedResult = canTailgateCloseUnloaded(rampId);

    if (rampId === 'AUN250') {
      return {
        isPossible: true,
        isHardFailure: false,
        requiresAC004: false,
        requiresFolded: true,
        reason: 'AUN250 allows tailgate closure when folded (motorcycle unloaded)',
        details:
          'The AUN250 folds when the motorcycle is not loaded, allowing your tailgate to close.',
      };
    }

    if (rampId === 'AUN210') {
      return {
        isPossible: true,
        isHardFailure: false,
        requiresAC004: false,
        requiresFolded: false,
        reason: 'AUN210 allows tailgate closure when unloaded',
        details:
          'The AUN210 does not block tailgate closure when the motorcycle is not loaded.',
      };
    }

    return {
      isPossible: unloadedResult.canClose,
      isHardFailure: !unloadedResult.canClose,
      requiresAC004: false,
      requiresFolded: unloadedResult.requiresFolded,
      reason: unloadedResult.canClose
        ? 'Tailgate can close when unloaded'
        : 'Tailgate cannot close with this configuration',
    };
  }

  // Scenario: Tailgate must close WITH motorcycle loaded
  // This is ONLY possible with AUN210

  // AUN250 cannot close tailgate with motorcycle loaded - period
  if (rampId === 'AUN250') {
    return {
      isPossible: false,
      isHardFailure: true,
      requiresAC004: false,
      requiresFolded: false,
      reason: 'AUN250 cannot close tailgate with motorcycle loaded',
      details:
        'The AUN250 only folds when the motorcycle is NOT loaded. ' +
        'Tailgate cannot close while the motorcycle is loaded. ' +
        'Consider the AUN210 if you need tailgate closure with motorcycle loaded.',
    };
  }

  // AUN210: Check if motorcycle fits
  if (!input.motorcycleLength || !input.usableBedLength) {
    // Missing measurements - need more data
    return {
      isPossible: false,
      isHardFailure: false,
      requiresAC004: true,
      requiresFolded: false,
      reason: 'Measurements required to determine if tailgate can close',
      details: 'Please provide motorcycle length and bed measurements to verify fitment.',
    };
  }

  const loadedResult = canTailgateCloseLoaded(
    rampId,
    input.motorcycleLength,
    input.usableBedLength
  );

  if (loadedResult.canClose) {
    return {
      isPossible: true,
      isHardFailure: false,
      requiresAC004: true,
      requiresFolded: false,
      reason: 'AUN210 allows tailgate closure with motorcycle loaded',
      details:
        `Your motorcycle (${input.motorcycleLength}") fits within your usable bed length ` +
        `(${input.usableBedLength}") with ${loadedResult.marginInches.toFixed(1)}" to spare. ` +
        'The AC004 Tailgate Extension is required for loading/unloading.',
      marginInches: loadedResult.marginInches,
    };
  }

  // Hard failure - motorcycle doesn't fit
  const settings = getEngineSettings();
  const buffer = settings.tailgateCloseBufferInches;
  const requiredLength = input.motorcycleLength + buffer;

  return {
    isPossible: false,
    isHardFailure: true,
    requiresAC004: false,
    requiresFolded: false,
    reason: 'Motorcycle too long for tailgate closure',
    details:
      `Your motorcycle length (${input.motorcycleLength}") plus the required ${buffer}" buffer ` +
      `(total: ${requiredLength}") exceeds your usable bed length (${input.usableBedLength}"). ` +
      'Tailgate cannot close with the motorcycle loaded.',
    marginInches: loadedResult.marginInches,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine which ramp can satisfy tailgate requirements
 */
export function getRampForTailgateRequirement(
  tailgateMustClose: boolean,
  motorcycleLoadedWhenClosed: boolean,
  motorcycleLength?: number,
  usableBedLength?: number
): {
  primaryRamp: RampModelId | null;
  alternativeRamp: RampModelId | null;
  isHardFailure: boolean;
  reason: string;
} {
  // No tailgate requirement - both ramps work
  if (!tailgateMustClose) {
    return {
      primaryRamp: null, // Determined by other factors
      alternativeRamp: null,
      isHardFailure: false,
      reason: 'Tailgate closure not required - both ramps are options',
    };
  }

  // Tailgate must close, motorcycle NOT loaded
  if (!motorcycleLoadedWhenClosed) {
    return {
      primaryRamp: 'AUN250',
      alternativeRamp: 'AUN210',
      isHardFailure: false,
      reason: 'AUN250 recommended - folds to allow tailgate closure when unloaded',
    };
  }

  // Tailgate must close WITH motorcycle loaded - only AUN210 possible
  if (!motorcycleLength || !usableBedLength) {
    return {
      primaryRamp: 'AUN210',
      alternativeRamp: null,
      isHardFailure: false,
      reason: 'AUN210 is the only option - measurements needed to confirm fitment',
    };
  }

  // Check if AUN210 can work
  const result = canTailgateCloseLoaded('AUN210', motorcycleLength, usableBedLength);

  if (result.canClose) {
    return {
      primaryRamp: 'AUN210',
      alternativeRamp: null,
      isHardFailure: false,
      reason: 'AUN210 with AC004 - motorcycle fits within bed length',
    };
  }

  // Hard failure
  return {
    primaryRamp: null,
    alternativeRamp: null,
    isHardFailure: true,
    reason: 'No ramp can satisfy tailgate closure with motorcycle loaded - motorcycle too long',
  };
}

/**
 * Check if a ramp model supports tailgate closure
 */
export function supportsTailgateClose(
  rampId: RampModelId,
  loaded: boolean
): boolean {
  const model = getRampModel(rampId);
  if (!model) return false;

  if (loaded) {
    return model.tailgateCloseLoaded;
  }
  return model.tailgateCloseUnloaded;
}

/**
 * Get tailgate-related notes for a configuration
 */
export function getTailgateNotes(
  rampId: RampModelId,
  tailgateMustClose: boolean,
  motorcycleLoadedWhenClosed: boolean
): string[] {
  const notes: string[] = [];

  if (!tailgateMustClose) {
    return notes;
  }

  if (rampId === 'AUN250') {
    if (motorcycleLoadedWhenClosed) {
      notes.push('AUN250 cannot close tailgate with motorcycle loaded');
    } else {
      notes.push('Fold the AUN250 to close your tailgate when motorcycle is unloaded');
    }
  }

  if (rampId === 'AUN210') {
    if (motorcycleLoadedWhenClosed) {
      notes.push('AC004 Tailgate Extension required for loading/unloading');
      notes.push('AC004 can be removed and stored after loading');
    }
  }

  return notes;
}
