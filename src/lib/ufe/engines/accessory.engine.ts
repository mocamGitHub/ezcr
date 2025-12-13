/**
 * UFE Accessory Engine
 *
 * Determines required and optional accessories based on configuration.
 *
 * ACCESSORY RULES:
 * - AC004: Only compatible with AUN210. Required when AUN210 must close
 *   tailgate with motorcycle loaded. Removable after loading.
 * - 4-BEAM: Only compatible with AUN250. Required when bed is long OR
 *   (bed_length + tailgate_length) > 101" threshold.
 * - AC001-1/2/3: Height extensions based on tailgate height (35-42", 43-51", 52-60").
 */

import type {
  RampModelId,
  AccessoryId,
  HeightExtensionId,
  AccessoryRequirement,
  AdvancedWizardInput,
  CalculatedValues,
} from '../types';
import {
  getEngineSettings,
  getAccessory,
  getCompatibleAccessories,
  isAccessoryCompatible,
} from '../config';

// =============================================================================
// HEIGHT EXTENSION LOGIC
// =============================================================================

/**
 * Determine required height extension based on tailgate height
 */
export function getHeightExtension(tailgateHeight: number): HeightExtensionId | null {
  if (tailgateHeight >= 35 && tailgateHeight <= 42) {
    return 'AC001-1';
  }
  if (tailgateHeight >= 43 && tailgateHeight <= 51) {
    return 'AC001-2';
  }
  if (tailgateHeight >= 52 && tailgateHeight <= 60) {
    return 'AC001-3';
  }
  return null;
}

/**
 * Check if height extension is needed
 */
export function needsHeightExtension(tailgateHeight: number): boolean {
  return tailgateHeight >= 35 && tailgateHeight <= 60;
}

// =============================================================================
// AC004 LOGIC (AUN210 TAILGATE EXTENSION)
// =============================================================================

/**
 * Check if AC004 is required
 * Only for AUN210 when tailgate must close with motorcycle loaded
 */
export function requiresAC004(
  rampId: RampModelId,
  tailgateMustClose: boolean,
  motorcycleLoadedWhenClosed: boolean
): boolean {
  // Only applicable to AUN210
  if (rampId !== 'AUN210') {
    return false;
  }

  // Required when tailgate must close with motorcycle loaded
  return tailgateMustClose && motorcycleLoadedWhenClosed;
}

/**
 * Check if AC004 is compatible with ramp
 */
export function isAC004Compatible(rampId: RampModelId): boolean {
  return rampId === 'AUN210';
}

// =============================================================================
// 4-BEAM LOGIC (AUN250 BED EXTENSION)
// =============================================================================

/**
 * Check if 4-Beam extension is required
 * Only for AUN250 when bed is long OR exceeds threshold
 */
export function requires4Beam(
  rampId: RampModelId,
  bedCategory: string,
  bedLengthWithTailgate: number
): boolean {
  // Only applicable to AUN250
  if (rampId !== 'AUN250') {
    return false;
  }

  const settings = getEngineSettings();

  // Required for long beds
  if (bedCategory === 'long') {
    return true;
  }

  // Required if total length exceeds threshold
  if (bedLengthWithTailgate > settings.beamExtensionThresholdInches) {
    return true;
  }

  return false;
}

/**
 * Check if 4-Beam is compatible with ramp
 */
export function is4BeamCompatible(rampId: RampModelId): boolean {
  return rampId === 'AUN250';
}

// =============================================================================
// MAIN ACCESSORY FUNCTIONS
// =============================================================================

/**
 * Get all required accessories for a configuration
 */
export function getRequiredAccessories(
  rampId: RampModelId,
  input: AdvancedWizardInput,
  calculatedValues: CalculatedValues
): AccessoryRequirement[] {
  const required: AccessoryRequirement[] = [];

  // Check AC004 (AUN210 only)
  if (
    requiresAC004(
      rampId,
      input.tailgateMustClose,
      input.motorcycleLoadedWhenClosed ?? false
    )
  ) {
    const accessory = getAccessory('AC004');
    if (accessory) {
      required.push({
        accessoryId: 'AC004',
        required: true,
        requirementType: 'required',
        reason: 'Required for loading/unloading with tailgate closure',
        price: accessory.price,
        name: accessory.name,
      });
    }
  }

  // Check 4-Beam (AUN250 only)
  if (
    requires4Beam(
      rampId,
      calculatedValues.bedCategory,
      input.truck.bedLengthWithTailgate
    )
  ) {
    const accessory = getAccessory('4-BEAM');
    if (accessory) {
      const reason =
        calculatedValues.bedCategory === 'long'
          ? 'Required for long bed configuration'
          : 'Required - total length exceeds threshold';

      required.push({
        accessoryId: '4-BEAM',
        required: true,
        requirementType: 'required',
        reason,
        price: accessory.price,
        name: accessory.name,
      });
    }
  }

  // Check height extension (both ramps)
  const heightExtId = getHeightExtension(input.truck.tailgateHeight);
  if (heightExtId && isAccessoryCompatible(heightExtId, rampId)) {
    const accessory = getAccessory(heightExtId);
    if (accessory) {
      required.push({
        accessoryId: heightExtId,
        required: true,
        requirementType: 'required',
        reason: `Required for tailgate height of ${input.truck.tailgateHeight}"`,
        price: accessory.price,
        name: accessory.name,
      });
    }
  }

  return required;
}

/**
 * Get optional accessories for a ramp
 */
export function getOptionalAccessories(rampId: RampModelId): AccessoryRequirement[] {
  const optional: AccessoryRequirement[] = [];

  // AC012 Boltless Tie Down Kit is optional for both
  const ac012 = getAccessory('AC012');
  if (ac012 && isAccessoryCompatible('AC012', rampId)) {
    optional.push({
      accessoryId: 'AC012',
      required: false,
      requirementType: 'optional',
      reason: 'Optional - secure ramp without drilling',
      price: ac012.price,
      name: ac012.name,
    });
  }

  return optional;
}

/**
 * Get all compatible accessories for a ramp (required + optional)
 */
export function getAllCompatibleAccessories(rampId: RampModelId): AccessoryRequirement[] {
  const compatible = getCompatibleAccessories(rampId);

  return compatible.map((acc) => ({
    accessoryId: acc.id as AccessoryId,
    required: false,
    requirementType: acc.category === 'required-conditional' ? 'recommended' : 'optional',
    reason: acc.description,
    price: acc.price,
    name: acc.name,
  }));
}

// =============================================================================
// COMPATIBILITY CHECKS
// =============================================================================

/**
 * Validate accessory compatibility with selected ramp
 */
export function validateAccessoryCompatibility(
  accessoryId: AccessoryId,
  rampId: RampModelId
): {
  isCompatible: boolean;
  reason?: string;
} {
  const accessory = getAccessory(accessoryId);

  if (!accessory) {
    return {
      isCompatible: false,
      reason: 'Unknown accessory',
    };
  }

  // Check compatibility matrix
  if (!isAccessoryCompatible(accessoryId, rampId)) {
    // Specific messages for known incompatibilities
    if (accessoryId === 'AC004' && rampId === 'AUN250') {
      return {
        isCompatible: false,
        reason: 'AC004 is not compatible with AUN250. AC004 is designed for AUN210 only.',
      };
    }
    if (accessoryId === '4-BEAM' && rampId === 'AUN210') {
      return {
        isCompatible: false,
        reason: '4-Beam Extension is not compatible with AUN210. It is designed for AUN250 only.',
      };
    }

    return {
      isCompatible: false,
      reason: `${accessory.name} is not compatible with ${rampId}`,
    };
  }

  return { isCompatible: true };
}

/**
 * Filter accessories to only compatible ones
 */
export function filterCompatibleAccessories(
  accessoryIds: AccessoryId[],
  rampId: RampModelId
): AccessoryId[] {
  return accessoryIds.filter((id) => isAccessoryCompatible(id, rampId));
}

// =============================================================================
// ACCESSORY PRICING
// =============================================================================

/**
 * Calculate total price for accessories
 */
export function calculateAccessoriesTotal(accessories: AccessoryRequirement[]): number {
  return accessories.reduce((sum, acc) => sum + acc.price, 0);
}

/**
 * Calculate required accessories total
 */
export function calculateRequiredAccessoriesTotal(
  accessories: AccessoryRequirement[]
): number {
  return accessories
    .filter((acc) => acc.required)
    .reduce((sum, acc) => sum + acc.price, 0);
}

// =============================================================================
// ACCESSORY NOTES
// =============================================================================

/**
 * Get usage notes for an accessory
 */
export function getAccessoryNotes(accessoryId: AccessoryId): string[] {
  const notes: string[] = [];

  switch (accessoryId) {
    case 'AC004':
      notes.push('Place on tailgate during loading/unloading');
      notes.push('Remove and store after motorcycle is loaded');
      notes.push('Not needed when tailgate can remain open');
      break;

    case '4-BEAM':
      notes.push('Provides additional support for longer configurations');
      notes.push('Required for AUN250 on long beds');
      break;

    case 'AC001-1':
    case 'AC001-2':
    case 'AC001-3':
      notes.push('Height extension ensures proper loading angle');
      notes.push('Selected based on your tailgate height measurement');
      break;

    case 'AC012':
      notes.push('Optional - allows securing ramp without drilling');
      notes.push('Quick-release system for easy removal');
      break;
  }

  return notes;
}

/**
 * Get recommendation reason for accessory
 */
export function getAccessoryRecommendationReason(
  accessoryId: AccessoryId,
  context: {
    rampId: RampModelId;
    tailgateHeight?: number;
    bedCategory?: string;
    tailgateMustClose?: boolean;
    motorcycleLoadedWhenClosed?: boolean;
  }
): string {
  switch (accessoryId) {
    case 'AC004':
      if (context.tailgateMustClose && context.motorcycleLoadedWhenClosed) {
        return 'Required for loading/unloading when tailgate must close with motorcycle';
      }
      return 'Optional - useful if you need to close tailgate while loaded in the future';

    case '4-BEAM':
      if (context.bedCategory === 'long') {
        return 'Required - your long bed configuration needs additional support';
      }
      return 'Required - total bed + tailgate length exceeds threshold';

    case 'AC001-1':
      return `Required for tailgate height ${context.tailgateHeight}" (35-42" range)`;

    case 'AC001-2':
      return `Required for tailgate height ${context.tailgateHeight}" (43-51" range)`;

    case 'AC001-3':
      return `Required for tailgate height ${context.tailgateHeight}" (52-60" range)`;

    case 'AC012':
      return 'Optional - boltless tie-down for easy ramp securing';

    default:
      return 'Accessory for your configuration';
  }
}
