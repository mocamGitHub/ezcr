/**
 * UFE Utilities - Barrel Export
 */

// Converters
export {
  // Constants
  CONVERSION_FACTORS,
  // Length conversions
  inchesToCm,
  cmToInches,
  inchesToFeet,
  feetToInches,
  inchesToFeetAndInches,
  parseFeetAndInches,
  // Weight conversions
  lbsToKg,
  kgToLbs,
  // Angle conversions
  degreesToRadians,
  radiansToDegrees,
  // Generic conversions
  convertLength,
  convertWeight,
  normalizeToImperial,
  // Formatting
  formatCurrency,
  formatNumber,
  formatLength,
  formatWeight,
  formatAngle,
  formatPercent,
} from './converters';

// Validators
export {
  // Helpers
  isWithinRange,
  isPositiveNumber,
  isNonNegativeNumber,
  isDefined,
  // Validation functions
  validateTruckMeasurements,
  validateMotorcycleMeasurements,
  validateQuickWizardInput,
  validateAdvancedWizardInput,
  validateMeasurementField,
  // Utilities
  createInputHash,
} from './validators';

// Output Builder
export {
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
} from './output-builder';
