/**
 * UFE Unit Conversion Utilities
 *
 * Provides unit conversion functions for measurements.
 */

// =============================================================================
// CONVERSION CONSTANTS
// =============================================================================

export const CONVERSION_FACTORS = {
  // Length conversions
  INCHES_TO_CM: 2.54,
  CM_TO_INCHES: 0.393701,
  INCHES_TO_FEET: 1 / 12,
  FEET_TO_INCHES: 12,

  // Weight conversions
  LBS_TO_KG: 0.453592,
  KG_TO_LBS: 2.20462,

  // Angle conversions
  DEG_TO_RAD: Math.PI / 180,
  RAD_TO_DEG: 180 / Math.PI,
} as const;

// =============================================================================
// LENGTH CONVERSIONS
// =============================================================================

/**
 * Convert inches to centimeters
 */
export function inchesToCm(inches: number): number {
  return inches * CONVERSION_FACTORS.INCHES_TO_CM;
}

/**
 * Convert centimeters to inches
 */
export function cmToInches(cm: number): number {
  return cm * CONVERSION_FACTORS.CM_TO_INCHES;
}

/**
 * Convert inches to feet
 */
export function inchesToFeet(inches: number): number {
  return inches * CONVERSION_FACTORS.INCHES_TO_FEET;
}

/**
 * Convert feet to inches
 */
export function feetToInches(feet: number): number {
  return feet * CONVERSION_FACTORS.FEET_TO_INCHES;
}

/**
 * Convert inches to feet and inches string (e.g., "5' 6\"")
 */
export function inchesToFeetAndInches(totalInches: number): string {
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);

  if (feet === 0) {
    return `${inches}"`;
  }
  if (inches === 0) {
    return `${feet}'`;
  }
  return `${feet}' ${inches}"`;
}

/**
 * Parse feet and inches string to total inches
 * Supports formats: "5' 6\"", "5.5'", "66\"", "5'6", etc.
 */
export function parseFeetAndInches(input: string): number | null {
  const trimmed = input.trim();

  // Try to match feet and inches: 5' 6" or 5'6"
  const feetInchesMatch = trimmed.match(/^(\d+(?:\.\d+)?)'?\s*(\d+(?:\.\d+)?)?[""]?$/);
  if (feetInchesMatch) {
    const feet = parseFloat(feetInchesMatch[1]);
    const inches = feetInchesMatch[2] ? parseFloat(feetInchesMatch[2]) : 0;
    return feet * 12 + inches;
  }

  // Try to match just inches: 66" or 66
  const inchesMatch = trimmed.match(/^(\d+(?:\.\d+)?)[""]?$/);
  if (inchesMatch) {
    return parseFloat(inchesMatch[1]);
  }

  return null;
}

// =============================================================================
// WEIGHT CONVERSIONS
// =============================================================================

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
  return lbs * CONVERSION_FACTORS.LBS_TO_KG;
}

/**
 * Convert kilograms to pounds
 */
export function kgToLbs(kg: number): number {
  return kg * CONVERSION_FACTORS.KG_TO_LBS;
}

// =============================================================================
// ANGLE CONVERSIONS
// =============================================================================

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * CONVERSION_FACTORS.DEG_TO_RAD;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * CONVERSION_FACTORS.RAD_TO_DEG;
}

// =============================================================================
// GENERIC CONVERSION UTILITIES
// =============================================================================

/**
 * Convert length between unit systems
 */
export function convertLength(
  value: number,
  from: 'imperial' | 'metric',
  to: 'imperial' | 'metric'
): number {
  if (from === to) return value;
  return from === 'imperial' ? inchesToCm(value) : cmToInches(value);
}

/**
 * Convert weight between unit systems
 */
export function convertWeight(
  value: number,
  from: 'imperial' | 'metric',
  to: 'imperial' | 'metric'
): number {
  if (from === to) return value;
  return from === 'imperial' ? lbsToKg(value) : kgToLbs(value);
}

/**
 * Normalize all measurements to imperial (inches/lbs)
 */
export function normalizeToImperial(measurements: {
  bedLengthClosed?: number;
  bedLengthWithTailgate?: number;
  tailgateHeight?: number;
  motorcycleWeight?: number;
  motorcycleWheelbase?: number;
  motorcycleTotalLength?: number;
  unitSystem: 'imperial' | 'metric';
}): {
  bedLengthClosed?: number;
  bedLengthWithTailgate?: number;
  tailgateHeight?: number;
  motorcycleWeight?: number;
  motorcycleWheelbase?: number;
  motorcycleTotalLength?: number;
} {
  const { unitSystem, ...rest } = measurements;

  if (unitSystem === 'imperial') {
    return rest;
  }

  // Convert from metric
  return {
    bedLengthClosed: rest.bedLengthClosed ? cmToInches(rest.bedLengthClosed) : undefined,
    bedLengthWithTailgate: rest.bedLengthWithTailgate
      ? cmToInches(rest.bedLengthWithTailgate)
      : undefined,
    tailgateHeight: rest.tailgateHeight ? cmToInches(rest.tailgateHeight) : undefined,
    motorcycleWeight: rest.motorcycleWeight ? kgToLbs(rest.motorcycleWeight) : undefined,
    motorcycleWheelbase: rest.motorcycleWheelbase
      ? cmToInches(rest.motorcycleWheelbase)
      : undefined,
    motorcycleTotalLength: rest.motorcycleTotalLength
      ? cmToInches(rest.motorcycleTotalLength)
      : undefined,
  };
}

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Format number with specified decimal places
 */
export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format length with unit
 */
export function formatLength(inches: number, showFeet = false): string {
  if (showFeet) {
    return inchesToFeetAndInches(inches);
  }
  return `${formatNumber(inches, 1)}"`;
}

/**
 * Format weight with unit
 */
export function formatWeight(lbs: number): string {
  return `${formatNumber(lbs, 0)} lbs`;
}

/**
 * Format angle with degree symbol
 */
export function formatAngle(degrees: number): string {
  return `${formatNumber(degrees, 1)}°`;
}

/**
 * Format percentage
 */
export function formatPercent(decimal: number): string {
  return `${formatNumber(decimal * 100, 1)}%`;
}
