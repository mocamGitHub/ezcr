/**
 * UFE Engines - Barrel Export
 */

// Bed Length Engine
export {
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
} from './bed-length.engine';

// Tailgate Engine
export {
  canTailgateCloseLoaded,
  canTailgateCloseUnloaded,
  validateTailgateRequirement,
  getRampForTailgateRequirement,
  supportsTailgateClose,
  getTailgateNotes,
} from './tailgate.engine';
export type {
  TailgateValidationInput,
  TailgateValidationResult,
} from './tailgate.engine';

// Ramp Selector Engine
export {
  selectRampQuickWizard,
  selectRampAdvancedWizard,
} from './ramp-selector.engine';
export type { RampSelectionResult } from './ramp-selector.engine';

// Accessory Engine
export {
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
} from './accessory.engine';

// Angle Engine
export {
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
} from './angle.engine';
