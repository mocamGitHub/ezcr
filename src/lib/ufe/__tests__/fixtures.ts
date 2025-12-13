/**
 * UFE Test Fixtures
 *
 * Common test data and scenarios for UFE testing.
 */

import type {
  QuickWizardInput,
  AdvancedWizardInput,
  TruckMeasurements,
  MotorcycleMeasurements,
} from '../types';

// =============================================================================
// TRUCK MEASUREMENT FIXTURES
// =============================================================================

export const shortBedTruck: TruckMeasurements = {
  bedLengthClosed: 66,
  bedLengthWithTailgate: 84,
  tailgateHeight: 22,
  hasTonneau: false,
};

export const standardBedTruck: TruckMeasurements = {
  bedLengthClosed: 78,
  bedLengthWithTailgate: 96,
  tailgateHeight: 22,
  hasTonneau: false,
};

export const longBedTruck: TruckMeasurements = {
  bedLengthClosed: 96,
  bedLengthWithTailgate: 114,
  tailgateHeight: 24,
  hasTonneau: false,
};

export const truckWithTonneauRollInto: TruckMeasurements = {
  bedLengthClosed: 78,
  bedLengthWithTailgate: 96,
  tailgateHeight: 22,
  hasTonneau: true,
  tonneauType: 'roll-up-soft',
  rollDirection: 'into-bed',
};

export const truckWithTonneauRollTop: TruckMeasurements = {
  bedLengthClosed: 78,
  bedLengthWithTailgate: 96,
  tailgateHeight: 22,
  hasTonneau: true,
  tonneauType: 'roll-up-soft',
  rollDirection: 'on-top',
};

export const truckWithTriFold: TruckMeasurements = {
  bedLengthClosed: 78,
  bedLengthWithTailgate: 96,
  tailgateHeight: 22,
  hasTonneau: true,
  tonneauType: 'tri-fold-soft',
};

// =============================================================================
// MOTORCYCLE MEASUREMENT FIXTURES
// =============================================================================

export const standardMotorcycle: MotorcycleMeasurements = {
  totalLength: 85,
  wheelbase: 60,
  weight: 450,
};

export const shortMotorcycle: MotorcycleMeasurements = {
  totalLength: 72,
  wheelbase: 52,
  weight: 350,
};

export const longMotorcycle: MotorcycleMeasurements = {
  totalLength: 95,
  wheelbase: 68,
  weight: 550,
};

export const heavyMotorcycle: MotorcycleMeasurements = {
  totalLength: 90,
  wheelbase: 64,
  weight: 800,
};

// =============================================================================
// QUICK WIZARD INPUT FIXTURES
// =============================================================================

export const quickWizardShortBed: QuickWizardInput = {
  bedLength: 'short',
  hasTonneau: false,
  tailgateMustClose: false,
  motorcycleLoadedWhenClosed: false,
};

export const quickWizardStandardBed: QuickWizardInput = {
  bedLength: 'standard',
  hasTonneau: false,
  tailgateMustClose: false,
  motorcycleLoadedWhenClosed: false,
};

export const quickWizardLongBed: QuickWizardInput = {
  bedLength: 'long',
  hasTonneau: false,
  tailgateMustClose: false,
  motorcycleLoadedWhenClosed: false,
};

export const quickWizardUnsure: QuickWizardInput = {
  bedLength: 'unsure',
  hasTonneau: false,
  tailgateMustClose: false,
  motorcycleLoadedWhenClosed: false,
};

export const quickWizardTailgateCloseUnloaded: QuickWizardInput = {
  bedLength: 'standard',
  hasTonneau: false,
  tailgateMustClose: true,
  motorcycleLoadedWhenClosed: false,
};

export const quickWizardTailgateCloseLoaded: QuickWizardInput = {
  bedLength: 'long',
  hasTonneau: false,
  tailgateMustClose: true,
  motorcycleLoadedWhenClosed: true,
};

export const quickWizardWithTonneau: QuickWizardInput = {
  bedLength: 'standard',
  hasTonneau: true,
  tonneauType: 'roll-up-soft',
  rollDirection: 'into-bed',
  tailgateMustClose: false,
  motorcycleLoadedWhenClosed: false,
};

// =============================================================================
// ADVANCED WIZARD INPUT FIXTURES
// =============================================================================

export const advancedShortBedBasic: AdvancedWizardInput = {
  truck: shortBedTruck,
  motorcycle: standardMotorcycle,
  tailgateMustClose: false,
  motorcycleLoadedWhenClosed: false,
  unitSystem: 'imperial',
};

export const advancedStandardBedBasic: AdvancedWizardInput = {
  truck: standardBedTruck,
  motorcycle: standardMotorcycle,
  tailgateMustClose: false,
  motorcycleLoadedWhenClosed: false,
  unitSystem: 'imperial',
};

export const advancedLongBedBasic: AdvancedWizardInput = {
  truck: longBedTruck,
  motorcycle: standardMotorcycle,
  tailgateMustClose: false,
  motorcycleLoadedWhenClosed: false,
  unitSystem: 'imperial',
};

export const advancedTailgateCloseLoadedFits: AdvancedWizardInput = {
  truck: longBedTruck,
  motorcycle: shortMotorcycle, // 72" motorcycle in 96" bed
  tailgateMustClose: true,
  motorcycleLoadedWhenClosed: true,
  unitSystem: 'imperial',
};

export const advancedTailgateCloseLoadedDoesNotFit: AdvancedWizardInput = {
  truck: standardBedTruck,
  motorcycle: longMotorcycle, // 95" motorcycle in 78" bed
  tailgateMustClose: true,
  motorcycleLoadedWhenClosed: true,
  unitSystem: 'imperial',
};

export const advancedTailgateCloseUnloaded: AdvancedWizardInput = {
  truck: standardBedTruck,
  motorcycle: standardMotorcycle,
  tailgateMustClose: true,
  motorcycleLoadedWhenClosed: false,
  unitSystem: 'imperial',
};

export const advancedWithTonneauPenalty: AdvancedWizardInput = {
  truck: truckWithTonneauRollInto,
  motorcycle: standardMotorcycle,
  tailgateMustClose: false,
  motorcycleLoadedWhenClosed: false,
  unitSystem: 'imperial',
};

export const advancedExceeds4BeamThreshold: AdvancedWizardInput = {
  truck: {
    bedLengthClosed: 84,
    bedLengthWithTailgate: 105, // Exceeds 101" threshold
    tailgateHeight: 24,
    hasTonneau: false,
  },
  motorcycle: standardMotorcycle,
  tailgateMustClose: false,
  motorcycleLoadedWhenClosed: false,
  unitSystem: 'imperial',
};

// =============================================================================
// EXPECTED RESULTS
// =============================================================================

export const expectedResults = {
  // Quick Wizard expectations
  shortBedRecommendation: 'AUN250',
  standardBedRecommendation: 'AUN250',
  longBedRecommendation: 'AUN210',
  unsureRecommendation: 'AUN250',
  tailgateCloseLoadedOnlyOption: 'AUN210',
  tailgateCloseUnloadedPreferred: 'AUN250',

  // Bed category boundaries
  shortMaxInches: 71.99,
  standardMinInches: 72,
  standardMaxInches: 95.99,
  longMinInches: 96,

  // Engine settings
  tonneauPenaltyInches: 10,
  tailgateBufferInches: 3,
  beamExtensionThreshold: 101,
};

// =============================================================================
// TEST SCENARIOS
// =============================================================================

export interface TestScenario {
  name: string;
  input: QuickWizardInput | AdvancedWizardInput;
  expectedRamp: 'AUN210' | 'AUN250';
  expectedSuccess: boolean;
  description: string;
}

export const quickWizardScenarios: TestScenario[] = [
  {
    name: 'Short bed - basic',
    input: quickWizardShortBed,
    expectedRamp: 'AUN250',
    expectedSuccess: true,
    description: 'Short bed without special requirements should get AUN250',
  },
  {
    name: 'Standard bed - basic',
    input: quickWizardStandardBed,
    expectedRamp: 'AUN250',
    expectedSuccess: true,
    description: 'Standard bed without special requirements should get AUN250',
  },
  {
    name: 'Long bed - basic',
    input: quickWizardLongBed,
    expectedRamp: 'AUN210',
    expectedSuccess: true,
    description: 'Long bed without special requirements should get AUN210',
  },
  {
    name: 'Unsure bed length',
    input: quickWizardUnsure,
    expectedRamp: 'AUN250',
    expectedSuccess: true,
    description: 'Unsure bed length should default to AUN250',
  },
  {
    name: 'Tailgate close - unloaded',
    input: quickWizardTailgateCloseUnloaded,
    expectedRamp: 'AUN250',
    expectedSuccess: true,
    description: 'Tailgate close when unloaded should prefer AUN250 (folds)',
  },
  {
    name: 'Tailgate close - loaded',
    input: quickWizardTailgateCloseLoaded,
    expectedRamp: 'AUN210',
    expectedSuccess: true,
    description: 'Tailgate close with motorcycle loaded requires AUN210',
  },
];

export const advancedWizardScenarios: TestScenario[] = [
  {
    name: 'Short bed - basic',
    input: advancedShortBedBasic,
    expectedRamp: 'AUN250',
    expectedSuccess: true,
    description: 'Short bed prefers AUN250 folding design',
  },
  {
    name: 'Standard bed - basic',
    input: advancedStandardBedBasic,
    expectedRamp: 'AUN250',
    expectedSuccess: true,
    description: 'Standard bed prefers AUN250 for flexibility',
  },
  {
    name: 'Long bed - basic',
    input: advancedLongBedBasic,
    expectedRamp: 'AUN210',
    expectedSuccess: true,
    description: 'Long bed prefers AUN210',
  },
  {
    name: 'Tailgate close loaded - fits',
    input: advancedTailgateCloseLoadedFits,
    expectedRamp: 'AUN210',
    expectedSuccess: true,
    description: 'When motorcycle fits, AUN210 with AC004 is possible',
  },
  {
    name: 'Tailgate close loaded - does not fit',
    input: advancedTailgateCloseLoadedDoesNotFit,
    expectedRamp: 'AUN210',
    expectedSuccess: false,
    description: 'When motorcycle does not fit, hard failure',
  },
  {
    name: 'Tailgate close - unloaded',
    input: advancedTailgateCloseUnloaded,
    expectedRamp: 'AUN250',
    expectedSuccess: true,
    description: 'Tailgate close unloaded prefers AUN250 (folds)',
  },
];
