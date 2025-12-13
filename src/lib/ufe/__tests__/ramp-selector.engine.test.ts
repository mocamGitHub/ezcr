/**
 * UFE Ramp Selector Engine Tests
 *
 * Tests for the main recommendation logic.
 */

import { describe, it, expect } from 'vitest';
import { selectRampQuickWizard, selectRampAdvancedWizard } from '../engines/ramp-selector.engine';
import type { QuickWizardInput, AdvancedWizardInput } from '../types';
import {
  quickWizardShortBed,
  quickWizardStandardBed,
  quickWizardLongBed,
  quickWizardUnsure,
  quickWizardTailgateCloseUnloaded,
  quickWizardTailgateCloseLoaded,
  advancedShortBedBasic,
  advancedStandardBedBasic,
  advancedLongBedBasic,
  advancedTailgateCloseLoadedFits,
  advancedTailgateCloseLoadedDoesNotFit,
  advancedTailgateCloseUnloaded,
  advancedWithTonneauPenalty,
  advancedExceeds4BeamThreshold,
  quickWizardScenarios,
  advancedWizardScenarios,
} from './fixtures';

describe('Ramp Selector Engine', () => {
  describe('Quick Wizard Selection', () => {
    describe('Bed Length Based Selection', () => {
      it('should recommend AUN250 for short bed', () => {
        const result = selectRampQuickWizard(quickWizardShortBed);
        expect(result.success).toBe(true);
        expect(result.primaryRecommendation?.rampId).toBe('AUN250');
      });

      it('should recommend AUN250 for standard bed', () => {
        const result = selectRampQuickWizard(quickWizardStandardBed);
        expect(result.success).toBe(true);
        expect(result.primaryRecommendation?.rampId).toBe('AUN250');
        // Should have AUN210 as alternative
        expect(result.alternativeRecommendation?.rampId).toBe('AUN210');
      });

      it('should recommend AUN210 for long bed', () => {
        const result = selectRampQuickWizard(quickWizardLongBed);
        expect(result.success).toBe(true);
        expect(result.primaryRecommendation?.rampId).toBe('AUN210');
        // Should have AUN250 as alternative
        expect(result.alternativeRecommendation?.rampId).toBe('AUN250');
      });

      it('should default to AUN250 when unsure', () => {
        const result = selectRampQuickWizard(quickWizardUnsure);
        expect(result.success).toBe(true);
        expect(result.primaryRecommendation?.rampId).toBe('AUN250');
        expect(result.primaryRecommendation?.warnings.length).toBeGreaterThan(0);
      });
    });

    describe('Tailgate Requirement Based Selection', () => {
      it('should recommend AUN250 for tailgate close unloaded', () => {
        const result = selectRampQuickWizard(quickWizardTailgateCloseUnloaded);
        expect(result.success).toBe(true);
        expect(result.primaryRecommendation?.rampId).toBe('AUN250');
        expect(result.primaryRecommendation?.reasons.some((r) => r.includes('fold'))).toBe(true);
      });

      it('should recommend AUN210 for tailgate close with motorcycle loaded', () => {
        const result = selectRampQuickWizard(quickWizardTailgateCloseLoaded);
        expect(result.success).toBe(true);
        expect(result.primaryRecommendation?.rampId).toBe('AUN210');
        // Should warn about needing measurements
        expect(result.primaryRecommendation?.warnings.length).toBeGreaterThan(0);
      });
    });

    describe('Quick Wizard Scenarios', () => {
      quickWizardScenarios.forEach((scenario) => {
        it(scenario.description, () => {
          const result = selectRampQuickWizard(scenario.input as QuickWizardInput);
          expect(result.success).toBe(scenario.expectedSuccess);
          if (scenario.expectedSuccess) {
            expect(result.primaryRecommendation?.rampId).toBe(scenario.expectedRamp);
          }
        });
      });
    });
  });

  describe('Advanced Wizard Selection', () => {
    describe('Bed Length Based Selection', () => {
      it('should recommend AUN250 for short bed', () => {
        const result = selectRampAdvancedWizard(advancedShortBedBasic);
        expect(result.success).toBe(true);
        expect(result.primaryRecommendation?.rampId).toBe('AUN250');
        expect(result.calculatedValues.bedCategory).toBe('short');
      });

      it('should recommend AUN250 for standard bed', () => {
        const result = selectRampAdvancedWizard(advancedStandardBedBasic);
        expect(result.success).toBe(true);
        expect(result.primaryRecommendation?.rampId).toBe('AUN250');
        expect(result.calculatedValues.bedCategory).toBe('standard');
      });

      it('should recommend AUN210 for long bed', () => {
        const result = selectRampAdvancedWizard(advancedLongBedBasic);
        expect(result.success).toBe(true);
        expect(result.primaryRecommendation?.rampId).toBe('AUN210');
        expect(result.calculatedValues.bedCategory).toBe('long');
      });
    });

    describe('Tailgate Close Requirements', () => {
      it('should recommend AUN210 when motorcycle fits for loaded tailgate close', () => {
        const result = selectRampAdvancedWizard(advancedTailgateCloseLoadedFits);
        expect(result.success).toBe(true);
        expect(result.primaryRecommendation?.rampId).toBe('AUN210');
        expect(result.calculatedValues.tailgateCloseWithLoadPossible).toBe(true);
      });

      it('should return hard failure when motorcycle does not fit', () => {
        const result = selectRampAdvancedWizard(advancedTailgateCloseLoadedDoesNotFit);
        expect(result.success).toBe(false);
        expect(result.failure).toBeDefined();
        expect(result.failure?.type).toBe('hard');
        expect(result.calculatedValues.tailgateCloseWithLoadPossible).toBe(false);
      });

      it('should recommend AUN250 for tailgate close unloaded', () => {
        const result = selectRampAdvancedWizard(advancedTailgateCloseUnloaded);
        expect(result.success).toBe(true);
        expect(result.primaryRecommendation?.rampId).toBe('AUN250');
      });
    });

    describe('Tonneau Cover Handling', () => {
      it('should calculate tonneau penalty', () => {
        const result = selectRampAdvancedWizard(advancedWithTonneauPenalty);
        expect(result.success).toBe(true);
        expect(result.calculatedValues.tonneauPenalty).toBe(10);
        expect(result.calculatedValues.usableBedLength).toBe(68); // 78 - 10
      });
    });

    describe('4-Beam Extension Threshold', () => {
      it('should flag when exceeding 4-beam threshold', () => {
        const result = selectRampAdvancedWizard(advancedExceeds4BeamThreshold);
        expect(result.success).toBe(true);
        expect(result.calculatedValues.exceeds4BeamThreshold).toBe(true);
      });
    });

    describe('Calculated Values', () => {
      it('should calculate all required values', () => {
        const result = selectRampAdvancedWizard(advancedStandardBedBasic);
        expect(result.calculatedValues).toBeDefined();
        expect(result.calculatedValues.usableBedLength).toBeDefined();
        expect(result.calculatedValues.tonneauPenalty).toBeDefined();
        expect(result.calculatedValues.bedCategory).toBeDefined();
        expect(result.calculatedValues.tailgateCloseWithLoadPossible).toBeDefined();
        expect(result.calculatedValues.exceeds4BeamThreshold).toBeDefined();
      });
    });

    describe('Recommendation Structure', () => {
      it('should include required accessories for AUN210', () => {
        const result = selectRampAdvancedWizard(advancedTailgateCloseLoadedFits);
        expect(result.primaryRecommendation?.requiredAccessories).toBeDefined();
        // Should require AC004 for tailgate close with load
        const hasAC004 = result.primaryRecommendation?.requiredAccessories.some(
          (a) => a.accessoryId === 'AC004'
        );
        expect(hasAC004).toBe(true);
      });

      it('should calculate total with required accessories', () => {
        const result = selectRampAdvancedWizard(advancedTailgateCloseLoadedFits);
        expect(result.primaryRecommendation?.totalWithRequired).toBeGreaterThanOrEqual(
          result.primaryRecommendation?.price ?? 0
        );
      });

      it('should include reasons and warnings', () => {
        const result = selectRampAdvancedWizard(advancedLongBedBasic);
        expect(result.primaryRecommendation?.reasons).toBeDefined();
        expect(result.primaryRecommendation?.reasons.length).toBeGreaterThan(0);
      });
    });

    describe('Advanced Wizard Scenarios', () => {
      advancedWizardScenarios.forEach((scenario) => {
        it(scenario.description, () => {
          const result = selectRampAdvancedWizard(scenario.input as AdvancedWizardInput);
          expect(result.success).toBe(scenario.expectedSuccess);
          if (scenario.expectedSuccess) {
            expect(result.primaryRecommendation?.rampId).toBe(scenario.expectedRamp);
          }
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary bed length at 72 inches (standard start)', () => {
      const input = {
        truck: {
          bedLengthClosed: 72,
          bedLengthWithTailgate: 90,
          tailgateHeight: 22,
          hasTonneau: false,
        },
        motorcycle: { totalLength: 85, wheelbase: 60, weight: 450 },
        tailgateMustClose: false,
        motorcycleLoadedWhenClosed: false,
        unitSystem: 'imperial' as const,
      };
      const result = selectRampAdvancedWizard(input);
      expect(result.calculatedValues.bedCategory).toBe('standard');
    });

    it('should handle boundary bed length at 96 inches (long start)', () => {
      const input = {
        truck: {
          bedLengthClosed: 96,
          bedLengthWithTailgate: 114,
          tailgateHeight: 24,
          hasTonneau: false,
        },
        motorcycle: { totalLength: 85, wheelbase: 60, weight: 450 },
        tailgateMustClose: false,
        motorcycleLoadedWhenClosed: false,
        unitSystem: 'imperial' as const,
      };
      const result = selectRampAdvancedWizard(input);
      expect(result.calculatedValues.bedCategory).toBe('long');
    });

    it('should handle exact fit scenario (motorcycle + 3" buffer = usable length)', () => {
      const input = {
        truck: {
          bedLengthClosed: 90, // No tonneau, so usable = 90
          bedLengthWithTailgate: 108,
          tailgateHeight: 22,
          hasTonneau: false,
        },
        motorcycle: { totalLength: 87, wheelbase: 62, weight: 450 }, // 87 + 3 = 90
        tailgateMustClose: true,
        motorcycleLoadedWhenClosed: true,
        unitSystem: 'imperial' as const,
      };
      const result = selectRampAdvancedWizard(input);
      expect(result.success).toBe(true);
      expect(result.calculatedValues.tailgateCloseWithLoadPossible).toBe(true);
    });

    it('should handle off-by-one scenario (motorcycle + buffer exceeds by 1")', () => {
      const input = {
        truck: {
          bedLengthClosed: 89,
          bedLengthWithTailgate: 107,
          tailgateHeight: 22,
          hasTonneau: false,
        },
        motorcycle: { totalLength: 87, wheelbase: 62, weight: 450 }, // 87 + 3 = 90, bed is 89
        tailgateMustClose: true,
        motorcycleLoadedWhenClosed: true,
        unitSystem: 'imperial' as const,
      };
      const result = selectRampAdvancedWizard(input);
      expect(result.success).toBe(false);
      expect(result.calculatedValues.tailgateCloseWithLoadPossible).toBe(false);
    });
  });
});
