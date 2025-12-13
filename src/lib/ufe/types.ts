/**
 * Unified Fitment Engine (UFE) - Type Definitions
 *
 * This file contains all TypeScript types used throughout the UFE.
 * These types are designed to be config-driven and extensible.
 */

// =============================================================================
// CORE IDENTIFIERS
// =============================================================================

/** Ramp model identifiers */
export type RampModelId = 'AUN210' | 'AUN250';

/** Accessory identifiers */
export type AccessoryId = 'AC004' | '4-BEAM' | 'AC001-1' | 'AC001-2' | 'AC001-3' | 'AC012';

/** Height extension identifiers */
export type HeightExtensionId = 'AC001-1' | 'AC001-2' | 'AC001-3';

/** Bed length categories */
export type BedCategory = 'short' | 'standard' | 'long';

/** Quick wizard bed length answer (includes 'unsure') */
export type BedCategoryAnswer = BedCategory | 'unsure';

// =============================================================================
// TONNEAU COVER TYPES
// =============================================================================

/** Tonneau cover types */
export type TonneauType =
  | 'roll-up-soft'
  | 'roll-up-hard'
  | 'tri-fold-soft'
  | 'tri-fold-hard'
  | 'bi-fold'
  | 'hinged'
  | 'retractable'
  | 'other'
  | 'none';

/** Roll direction for roll-up covers */
export type RollDirection = 'on-top' | 'into-bed';

// =============================================================================
// UNIT SYSTEMS
// =============================================================================

/** Supported unit systems */
export type UnitSystem = 'imperial' | 'metric';

/** Length unit */
export type LengthUnit = 'inches' | 'cm';

/** Weight unit */
export type WeightUnit = 'lbs' | 'kg';

// =============================================================================
// RESULT TYPES
// =============================================================================

/** Recommendation classification */
export type RecommendationType = 'primary' | 'alternative' | 'not-recommended';

/** Failure severity */
export type FailureType = 'hard' | 'soft' | 'none';

/** Accessory requirement type */
export type AccessoryRequirementType = 'required' | 'recommended' | 'optional';

// =============================================================================
// QUICK WIZARD TYPES
// =============================================================================

/** Quick Wizard input data */
export interface QuickWizardInput {
  /** Bed length category or 'unsure' */
  bedLength: BedCategoryAnswer;
  /** Whether truck has a tonneau cover */
  hasTonneau: boolean;
  /** Type of tonneau cover (if applicable) */
  tonneauType?: TonneauType;
  /** Roll direction for roll-up covers (if applicable) */
  rollDirection?: RollDirection;
  /** Whether tailgate must close */
  tailgateMustClose: boolean;
  /** Whether motorcycle will be loaded when tailgate must close */
  motorcycleLoadedWhenClosed?: boolean;
}

/** Quick Wizard question definition */
export interface QuickWizardQuestion {
  id: string;
  question: string;
  helpText?: string;
  options: QuickWizardOption[];
  conditional?: {
    dependsOn: string;
    showWhen: string | string[];
  };
}

/** Quick Wizard option */
export interface QuickWizardOption {
  value: string;
  label: string;
  sublabel?: string;
}

// =============================================================================
// ADVANCED WIZARD TYPES
// =============================================================================

/** Truck measurements for advanced wizard */
export interface TruckMeasurements {
  /** Bed length with tailgate closed (inches) */
  bedLengthClosed: number;
  /** Total length including open tailgate (inches) */
  bedLengthWithTailgate: number;
  /** Top of open tailgate height from ground (inches) */
  tailgateHeight: number;
  /** Whether truck has a tonneau cover */
  hasTonneau: boolean;
  /** Type of tonneau cover (if applicable) */
  tonneauType?: TonneauType;
  /** Roll direction for roll-up covers (if applicable) */
  rollDirection?: RollDirection;
}

/** Motorcycle measurements for advanced wizard */
export interface MotorcycleMeasurements {
  /** Motorcycle weight (lbs) */
  weight: number;
  /** Motorcycle wheelbase (inches) */
  wheelbase: number;
  /** Total motorcycle length (inches) */
  totalLength: number;
}

/** Advanced Wizard complete input */
export interface AdvancedWizardInput {
  /** Truck measurements */
  truck: TruckMeasurements;
  /** Motorcycle measurements */
  motorcycle: MotorcycleMeasurements;
  /** Whether tailgate must close */
  tailgateMustClose: boolean;
  /** Whether motorcycle will be loaded when tailgate must close */
  motorcycleLoadedWhenClosed?: boolean;
  /** Unit system used for input */
  unitSystem: UnitSystem;
}

// =============================================================================
// CALCULATION TYPES
// =============================================================================

/** Calculated values from engine processing */
export interface CalculatedValues {
  /** Usable bed length after tonneau penalty */
  usableBedLength: number;
  /** Tonneau penalty applied (inches) */
  tonneauPenalty: number;
  /** Determined bed category */
  bedCategory: BedCategory;
  /** Loading angle in degrees (if calculation enabled) */
  loadingAngle?: number;
  /** Whether tailgate can close with motorcycle loaded */
  tailgateCloseWithLoadPossible: boolean;
  /** Whether configuration exceeds 4-Beam threshold */
  exceeds4BeamThreshold: boolean;
  /** Buffer-adjusted motorcycle length requirement */
  requiredBedLengthForLoad?: number;
}

/** Angle calculation result */
export interface AngleCalculation {
  /** Calculated angle in degrees */
  angleDegrees: number;
  /** Whether angle is within safe range */
  isSafe: boolean;
  /** Whether angle triggers warning */
  isWarning: boolean;
  /** Warning message if applicable */
  warningMessage?: string;
}

// =============================================================================
// ACCESSORY TYPES
// =============================================================================

/** Accessory requirement detail */
export interface AccessoryRequirement {
  /** Accessory identifier */
  accessoryId: AccessoryId;
  /** Whether accessory is required */
  required: boolean;
  /** Type of requirement */
  requirementType: AccessoryRequirementType;
  /** Reason for requirement */
  reason: string;
  /** Accessory price */
  price: number;
  /** Accessory display name */
  name: string;
}

/** Accessory compatibility check result */
export interface AccessoryCompatibility {
  /** Accessory identifier */
  accessoryId: AccessoryId;
  /** Whether compatible with selected ramp */
  isCompatible: boolean;
  /** Reason if incompatible */
  incompatibilityReason?: string;
}

// =============================================================================
// RAMP RECOMMENDATION TYPES
// =============================================================================

/** Complete ramp recommendation */
export interface RampRecommendation {
  /** Ramp model identifier */
  rampId: RampModelId;
  /** Recommendation type */
  type: RecommendationType;
  /** Display name */
  name: string;
  /** Ramp price */
  price: number;
  /** Reasons for this recommendation */
  reasons: string[];
  /** Warning messages */
  warnings: string[];
  /** Required accessories */
  requiredAccessories: AccessoryRequirement[];
  /** Optional accessories */
  optionalAccessories: AccessoryRequirement[];
  /** Total price including required accessories */
  totalWithRequired: number;
}

// =============================================================================
// UFE RESULT TYPES
// =============================================================================

/** Failure details */
export interface UFEFailure {
  /** Failure type */
  type: FailureType;
  /** User-facing message */
  message: string;
  /** Detailed explanation */
  details?: string;
  /** Suggested alternatives */
  suggestion?: string;
}

/** Complete UFE evaluation result */
export interface UFEResult {
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
  /** Tonneau-related notes */
  tonneauNotes?: string[];
  /** Angle warning (if applicable) */
  angleWarning?: string;
  /** Evaluation timestamp */
  timestamp: string;
  /** Input hash for caching/deduplication */
  inputHash: string;
}

// =============================================================================
// WIZARD SYNC TYPES
// =============================================================================

/** Wizard sync data for bidirectional transfer */
export interface WizardSyncData {
  /** Source wizard */
  source: 'quick' | 'advanced';
  /** Timestamp of sync */
  timestamp: number;
  /** Quick wizard data (if source is quick) */
  quickWizardData?: Partial<QuickWizardInput>;
  /** Advanced wizard data (if source is advanced) */
  advancedWizardData?: Partial<AdvancedWizardInput>;
  /** Previous recommendation */
  recommendation?: RampModelId;
  /** Expiry timestamp */
  expiresAt: number;
}

// =============================================================================
// CONFIG TYPES
// =============================================================================

/** Engine settings from config */
export interface EngineSettings {
  version: string;
  angleCalculation: {
    enabled: boolean;
    warningThresholdDegrees: number;
    maxSafeDegrees: number;
  };
  tonneauPenaltyInches: number;
  beamExtensionThresholdInches: number;
  tailgateCloseBufferInches: number;
  bedLengthCategories: {
    short: { max: number };
    standard: { min: number; max: number };
    long: { min: number };
  };
  measurementRanges: {
    bedLengthClosed: { min: number; max: number };
    bedLengthWithTailgate: { min: number; max: number };
    tailgateHeight: { min: number; max: number };
    motorcycleWeight: { min: number; max: number };
    motorcycleWheelbase: { min: number; max: number };
    motorcycleLength: { min: number; max: number };
  };
  unitDefaults: {
    length: LengthUnit;
    weight: WeightUnit;
  };
  pricing: {
    taxRate: number;
    processingFeeRate: number;
    freeShippingThreshold: number;
    shippingCost: number;
  };
  bulkDiscounts: Array<{
    minQuantity: number;
    discountPercent: number;
  }>;
}

/** Ramp model config */
export interface RampModelConfig {
  id: RampModelId;
  name: string;
  sku: string;
  price: number;
  folds: boolean;
  foldsWhenLoaded: boolean;
  tailgateCloseLoaded: boolean;
  tailgateCloseUnloaded: boolean;
  compatibleAccessories: AccessoryId[];
  incompatibleAccessories: AccessoryId[];
  recommendForBedCategories: BedCategory[];
  primaryRecommendationFor: BedCategory[];
  description: string;
  features: string[];
  active: boolean;
}

/** Accessory config */
export interface AccessoryConfig {
  id: AccessoryId;
  name: string;
  sku: string;
  price: number;
  type: 'tailgate-extension' | 'bed-extension' | 'height-extension' | 'accessory';
  category: 'required-conditional' | 'optional';
  compatibleRamps: RampModelId[];
  incompatibleRamps?: RampModelId[];
  description: string;
  requiredWhen?: {
    ramp?: RampModelId;
    condition: string;
    description: string;
    heightRange?: { min: number; max: number };
  };
}

/** Bed category config */
export interface BedCategoryConfig {
  id: BedCategory;
  name: string;
  displayRange: string;
  rangeInches: { min: number; max: number };
  primaryRamp: RampModelId | null;
  alternativeRamp: RampModelId | null;
  notes: string[];
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/** Validation result */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Field-specific errors */
  errors: Record<string, string>;
  /** General warnings */
  warnings: string[];
}

/** Field validation range */
export interface ValidationRange {
  min: number;
  max: number;
  unit: string;
}

// =============================================================================
// QUOTE TYPES
// =============================================================================

/** Quote line item */
export interface QuoteLineItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  required: boolean;
}

/** Complete quote breakdown */
export interface QuoteBreakdown {
  /** Ramp line item */
  ramp: QuoteLineItem;
  /** Accessory line items */
  accessories: QuoteLineItem[];
  /** Subtotal before tax/shipping */
  subtotal: number;
  /** Discount amount (if applicable) */
  discount: number;
  /** Subtotal after discount */
  subtotalAfterDiscount: number;
  /** Tax amount */
  tax: number;
  /** Processing fee */
  processingFee: number;
  /** Shipping cost */
  shipping: number;
  /** Grand total */
  total: number;
  /** Whether free shipping was applied */
  freeShipping: boolean;
}
