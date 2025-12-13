/**
 * UFE Bed Length Engine
 *
 * Handles bed length categorization and usable bed length calculation.
 */

import type {
  BedCategory,
  BedCategoryAnswer,
  TonneauType,
  RollDirection,
} from '../types';
import { getEngineSettings, getBedCategory } from '../config';

// =============================================================================
// BED LENGTH CATEGORIZATION
// =============================================================================

/**
 * Categorize bed length in inches to a category
 */
export function categorizeBedLength(lengthInches: number): BedCategory {
  const settings = getEngineSettings();
  const categories = settings.bedLengthCategories;

  if (lengthInches < categories.standard.min) {
    return 'short';
  }
  if (lengthInches >= categories.long.min) {
    return 'long';
  }
  return 'standard';
}

/**
 * Check if length falls within a specific category
 */
export function isInCategory(lengthInches: number, category: BedCategory): boolean {
  const settings = getEngineSettings();
  const categories = settings.bedLengthCategories;

  switch (category) {
    case 'short':
      return lengthInches < categories.standard.min;
    case 'standard':
      return lengthInches >= categories.standard.min && lengthInches < categories.long.min;
    case 'long':
      return lengthInches >= categories.long.min;
    default:
      return false;
  }
}

/**
 * Get the boundary values for a category
 */
export function getCategoryBounds(category: BedCategory): { min: number; max: number } {
  const settings = getEngineSettings();
  const categories = settings.bedLengthCategories;

  switch (category) {
    case 'short':
      return { min: 0, max: categories.short.max };
    case 'standard':
      return { min: categories.standard.min, max: categories.standard.max };
    case 'long':
      return { min: categories.long.min, max: 999 };
    default:
      return { min: 0, max: 999 };
  }
}

// =============================================================================
// TONNEAU PENALTY CALCULATION
// =============================================================================

/**
 * Determine tonneau cover penalty based on type and roll direction
 */
export function determineTonneauPenalty(
  hasTonneau: boolean,
  tonneauType?: TonneauType,
  rollDirection?: RollDirection
): number {
  if (!hasTonneau || tonneauType === 'none') {
    return 0;
  }

  const settings = getEngineSettings();
  const defaultPenalty = settings.tonneauPenaltyInches;

  // Roll-up covers
  if (tonneauType?.includes('roll-up')) {
    // Only apply penalty if rolls into bed
    if (rollDirection === 'into-bed') {
      return defaultPenalty;
    }
    // Rolls on top - no penalty
    return 0;
  }

  // Tri-fold and bi-fold - typically fold toward cab, minimal penalty
  if (
    tonneauType?.includes('tri-fold') ||
    tonneauType === 'bi-fold'
  ) {
    // These fold toward cab and are moved before loading
    return 0;
  }

  // Hinged - opens fully, no penalty
  if (tonneauType === 'hinged') {
    return 0;
  }

  // Retractable - canister may take some space
  if (tonneauType === 'retractable') {
    return defaultPenalty;
  }

  // Other/unknown - apply default penalty to be safe
  if (tonneauType === 'other') {
    return defaultPenalty;
  }

  return 0;
}

// =============================================================================
// USABLE BED LENGTH CALCULATION
// =============================================================================

/**
 * Calculate usable bed length after tonneau penalty
 */
export function calculateUsableBedLength(
  bedLength: number,
  tonneauPenalty: number
): number {
  return Math.max(0, bedLength - tonneauPenalty);
}

/**
 * Calculate usable bed length with all parameters
 */
export function getUsableBedLength(
  bedLength: number,
  hasTonneau: boolean,
  tonneauType?: TonneauType,
  rollDirection?: RollDirection
): {
  usableBedLength: number;
  tonneauPenalty: number;
} {
  const tonneauPenalty = determineTonneauPenalty(hasTonneau, tonneauType, rollDirection);
  const usableBedLength = calculateUsableBedLength(bedLength, tonneauPenalty);

  return {
    usableBedLength,
    tonneauPenalty,
  };
}

// =============================================================================
// QUICK WIZARD ESTIMATION
// =============================================================================

/**
 * Estimate bed length range from category (for Quick Wizard)
 */
export function estimateBedLengthFromCategory(
  category: BedCategoryAnswer
): { min: number; max: number } | null {
  if (category === 'unsure') {
    return null;
  }

  const categoryConfig = getBedCategory(category);
  if (!categoryConfig) {
    return null;
  }

  return categoryConfig.rangeInches;
}

/**
 * Get estimated middle value for a category
 */
export function getEstimatedMidpoint(category: BedCategoryAnswer): number | null {
  const range = estimateBedLengthFromCategory(category);
  if (!range) {
    return null;
  }

  // For long beds, use a reasonable max (not 999)
  const effectiveMax = Math.min(range.max, 120);
  return (range.min + effectiveMax) / 2;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if bed length is within valid range
 */
export function isValidBedLength(lengthInches: number): boolean {
  const settings = getEngineSettings();
  const ranges = settings.measurementRanges;
  return (
    lengthInches >= ranges.bedLengthClosed.min &&
    lengthInches <= ranges.bedLengthClosed.max
  );
}

/**
 * Check if total length (bed + tailgate) is within valid range
 */
export function isValidTotalLength(lengthInches: number): boolean {
  const settings = getEngineSettings();
  const ranges = settings.measurementRanges;
  return (
    lengthInches >= ranges.bedLengthWithTailgate.min &&
    lengthInches <= ranges.bedLengthWithTailgate.max
  );
}

// =============================================================================
// CATEGORY INFO HELPERS
// =============================================================================

/**
 * Get display information for a bed category
 */
export function getCategoryDisplayInfo(category: BedCategory): {
  name: string;
  displayRange: string;
  notes: string[];
} {
  const categoryConfig = getBedCategory(category);
  if (!categoryConfig) {
    return {
      name: category,
      displayRange: '',
      notes: [],
    };
  }

  return {
    name: categoryConfig.name,
    displayRange: categoryConfig.displayRange,
    notes: categoryConfig.notes,
  };
}

/**
 * Determine if measurements are near category boundary
 */
export function isNearCategoryBoundary(
  lengthInches: number,
  toleranceInches = 3
): {
  isNearBoundary: boolean;
  nearBoundary?: 'short-standard' | 'standard-long';
} {
  const settings = getEngineSettings();
  const { standard, long } = settings.bedLengthCategories;

  // Near short-standard boundary
  if (Math.abs(lengthInches - standard.min) <= toleranceInches) {
    return { isNearBoundary: true, nearBoundary: 'short-standard' };
  }

  // Near standard-long boundary
  if (Math.abs(lengthInches - long.min) <= toleranceInches) {
    return { isNearBoundary: true, nearBoundary: 'standard-long' };
  }

  return { isNearBoundary: false };
}
