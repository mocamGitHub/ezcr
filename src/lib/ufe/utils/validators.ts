/**
 * UFE Validation Utilities
 *
 * Provides input validation for wizard data.
 */

import type {
  ValidationResult,
  TruckMeasurements,
  MotorcycleMeasurements,
  QuickWizardInput,
  AdvancedWizardInput,
  TonneauType,
  BedCategoryAnswer,
} from '../types';
import { getEngineSettings } from '../config';

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if a value is within a range (inclusive)
 */
export function isWithinRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Check if a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Check if a value is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Check if value is defined and not null
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

// =============================================================================
// TRUCK MEASUREMENT VALIDATION
// =============================================================================

/**
 * Validate truck measurements
 */
export function validateTruckMeasurements(measurements: TruckMeasurements): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  const settings = getEngineSettings();
  const ranges = settings.measurementRanges;

  // Validate bed length closed
  if (!isPositiveNumber(measurements.bedLengthClosed)) {
    errors.bedLengthClosed = 'Bed length (closed) must be a positive number';
  } else if (
    !isWithinRange(
      measurements.bedLengthClosed,
      ranges.bedLengthClosed.min,
      ranges.bedLengthClosed.max
    )
  ) {
    errors.bedLengthClosed = `Bed length must be between ${ranges.bedLengthClosed.min}" and ${ranges.bedLengthClosed.max}"`;
  }

  // Validate bed length with tailgate
  if (!isPositiveNumber(measurements.bedLengthWithTailgate)) {
    errors.bedLengthWithTailgate = 'Total length (with tailgate) must be a positive number';
  } else if (
    !isWithinRange(
      measurements.bedLengthWithTailgate,
      ranges.bedLengthWithTailgate.min,
      ranges.bedLengthWithTailgate.max
    )
  ) {
    errors.bedLengthWithTailgate = `Total length must be between ${ranges.bedLengthWithTailgate.min}" and ${ranges.bedLengthWithTailgate.max}"`;
  }

  // Validate tailgate height
  if (!isNonNegativeNumber(measurements.tailgateHeight)) {
    errors.tailgateHeight = 'Tailgate height must be a non-negative number';
  } else if (
    !isWithinRange(
      measurements.tailgateHeight,
      ranges.tailgateHeight.min,
      ranges.tailgateHeight.max
    )
  ) {
    errors.tailgateHeight = `Tailgate height must be between ${ranges.tailgateHeight.min}" and ${ranges.tailgateHeight.max}"`;
  }

  // Validate bed length with tailgate is greater than bed length closed
  if (
    isPositiveNumber(measurements.bedLengthClosed) &&
    isPositiveNumber(measurements.bedLengthWithTailgate) &&
    measurements.bedLengthWithTailgate <= measurements.bedLengthClosed
  ) {
    errors.bedLengthWithTailgate =
      'Total length (with tailgate open) must be greater than bed length (closed)';
  }

  // Validate tonneau type if has tonneau
  if (measurements.hasTonneau && !measurements.tonneauType) {
    errors.tonneauType = 'Please select your tonneau cover type';
  }

  // Validate roll direction for roll-up covers
  if (
    measurements.tonneauType?.includes('roll-up') &&
    !measurements.rollDirection
  ) {
    errors.rollDirection = 'Please specify which direction your cover rolls';
  }

  // Add warnings for edge cases
  if (
    isPositiveNumber(measurements.bedLengthClosed) &&
    measurements.bedLengthClosed < 65
  ) {
    warnings.push(
      'Your bed length is quite short. Some configurations may be limited.'
    );
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// MOTORCYCLE MEASUREMENT VALIDATION
// =============================================================================

/**
 * Validate motorcycle measurements
 */
export function validateMotorcycleMeasurements(
  measurements: MotorcycleMeasurements
): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  const settings = getEngineSettings();
  const ranges = settings.measurementRanges;

  // Validate weight
  if (!isPositiveNumber(measurements.weight)) {
    errors.weight = 'Motorcycle weight must be a positive number';
  } else if (
    !isWithinRange(
      measurements.weight,
      ranges.motorcycleWeight.min,
      ranges.motorcycleWeight.max
    )
  ) {
    if (measurements.weight > ranges.motorcycleWeight.max) {
      errors.weight = `Motorcycle weight (${measurements.weight} lbs) exceeds our maximum capacity of ${ranges.motorcycleWeight.max} lbs. Please contact us for custom solutions.`;
    } else {
      errors.weight = `Motorcycle weight must be between ${ranges.motorcycleWeight.min} and ${ranges.motorcycleWeight.max} lbs`;
    }
  }

  // Validate wheelbase
  if (!isPositiveNumber(measurements.wheelbase)) {
    errors.wheelbase = 'Wheelbase must be a positive number';
  } else if (
    !isWithinRange(
      measurements.wheelbase,
      ranges.motorcycleWheelbase.min,
      ranges.motorcycleWheelbase.max
    )
  ) {
    errors.wheelbase = `Wheelbase must be between ${ranges.motorcycleWheelbase.min}" and ${ranges.motorcycleWheelbase.max}"`;
  }

  // Validate total length
  if (!isPositiveNumber(measurements.totalLength)) {
    errors.totalLength = 'Total length must be a positive number';
  } else if (
    !isWithinRange(
      measurements.totalLength,
      ranges.motorcycleLength.min,
      ranges.motorcycleLength.max
    )
  ) {
    errors.totalLength = `Total length must be between ${ranges.motorcycleLength.min}" and ${ranges.motorcycleLength.max}"`;
  }

  // Validate wheelbase is less than total length
  if (
    isPositiveNumber(measurements.wheelbase) &&
    isPositiveNumber(measurements.totalLength) &&
    measurements.wheelbase >= measurements.totalLength
  ) {
    errors.wheelbase = 'Wheelbase must be less than total motorcycle length';
  }

  // Add warnings for heavy bikes
  if (isPositiveNumber(measurements.weight) && measurements.weight > 900) {
    warnings.push(
      'Your motorcycle is on the heavier side. Ensure proper loading technique.'
    );
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// QUICK WIZARD VALIDATION
// =============================================================================

/**
 * Valid tonneau types
 */
const VALID_TONNEAU_TYPES: TonneauType[] = [
  'roll-up-soft',
  'roll-up-hard',
  'tri-fold-soft',
  'tri-fold-hard',
  'bi-fold',
  'hinged',
  'retractable',
  'other',
  'none',
];

/**
 * Valid bed categories
 */
const VALID_BED_CATEGORIES: BedCategoryAnswer[] = ['short', 'standard', 'long', 'unsure'];

/**
 * Validate quick wizard input
 */
export function validateQuickWizardInput(input: QuickWizardInput): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Validate bed length
  if (!input.bedLength) {
    errors.bedLength = 'Please select your bed length';
  } else if (!VALID_BED_CATEGORIES.includes(input.bedLength)) {
    errors.bedLength = 'Invalid bed length selection';
  }

  // Validate hasTonneau is boolean
  if (typeof input.hasTonneau !== 'boolean') {
    errors.hasTonneau = 'Please indicate if you have a tonneau cover';
  }

  // Validate tonneau type if has tonneau
  if (input.hasTonneau && input.tonneauType) {
    if (!VALID_TONNEAU_TYPES.includes(input.tonneauType)) {
      errors.tonneauType = 'Invalid tonneau type selection';
    }
  }

  // Validate roll direction for roll-up covers
  if (
    input.tonneauType?.includes('roll-up') &&
    input.rollDirection &&
    !['on-top', 'into-bed'].includes(input.rollDirection)
  ) {
    errors.rollDirection = 'Invalid roll direction selection';
  }

  // Validate tailgate requirement
  if (typeof input.tailgateMustClose !== 'boolean') {
    errors.tailgateMustClose = 'Please indicate your tailgate requirement';
  }

  // Add warnings
  if (input.bedLength === 'unsure') {
    warnings.push(
      'Since you\'re unsure about bed length, we recommend using the Full Configurator with exact measurements.'
    );
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// ADVANCED WIZARD VALIDATION
// =============================================================================

/**
 * Validate complete advanced wizard input
 */
export function validateAdvancedWizardInput(input: AdvancedWizardInput): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Validate truck measurements
  const truckValidation = validateTruckMeasurements(input.truck);
  if (!truckValidation.isValid) {
    Object.entries(truckValidation.errors).forEach(([key, value]) => {
      errors[`truck.${key}`] = value;
    });
  }
  warnings.push(...truckValidation.warnings);

  // Validate motorcycle measurements
  const motoValidation = validateMotorcycleMeasurements(input.motorcycle);
  if (!motoValidation.isValid) {
    Object.entries(motoValidation.errors).forEach(([key, value]) => {
      errors[`motorcycle.${key}`] = value;
    });
  }
  warnings.push(...motoValidation.warnings);

  // Validate tailgate requirement
  if (typeof input.tailgateMustClose !== 'boolean') {
    errors.tailgateMustClose = 'Please indicate your tailgate requirement';
  }

  // Validate unit system
  if (!['imperial', 'metric'].includes(input.unitSystem)) {
    errors.unitSystem = 'Invalid unit system';
  }

  // Cross-validation: motorcycle vs truck
  if (
    truckValidation.isValid &&
    motoValidation.isValid &&
    input.tailgateMustClose &&
    input.motorcycleLoadedWhenClosed
  ) {
    const settings = getEngineSettings();
    const buffer = settings.tailgateCloseBufferInches;
    const usableBed = input.truck.bedLengthClosed - (input.truck.hasTonneau ? settings.tonneauPenaltyInches : 0);
    const requiredLength = input.motorcycle.totalLength + buffer;

    if (requiredLength > usableBed) {
      warnings.push(
        `Your motorcycle length (${input.motorcycle.totalLength}") plus required buffer (${buffer}") exceeds your usable bed length (${usableBed.toFixed(1)}"). Tailgate closure with motorcycle loaded may not be possible.`
      );
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// SPECIFIC FIELD VALIDATORS
// =============================================================================

/**
 * Validate a single measurement field
 */
export function validateMeasurementField(
  fieldName: string,
  value: number,
  min: number,
  max: number
): string | null {
  if (!isPositiveNumber(value)) {
    return `${fieldName} must be a positive number`;
  }
  if (!isWithinRange(value, min, max)) {
    return `${fieldName} must be between ${min}" and ${max}"`;
  }
  return null;
}

/**
 * Create a hash of input for caching/deduplication
 */
export function createInputHash(input: QuickWizardInput | AdvancedWizardInput): string {
  const json = JSON.stringify(input);
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
