/**
 * UFE Integration Tests
 *
 * End-to-end tests for complete wizard flows.
 */

import { describe, it, expect } from 'vitest';
import { evaluateQuick, evaluateAdvanced } from '../index';
import {
  quickWizardShortBed,
  quickWizardLongBed,
  quickWizardTailgateCloseLoaded,
  advancedShortBedBasic,
  advancedLongBedBasic,
  advancedTailgateCloseLoadedFits,
  advancedTailgateCloseLoadedDoesNotFit,
  advancedWithTonneauPenalty,
} from './fixtures';

describe('UFE Integration', () => {
  describe('Quick Wizard Flow', () => {
    it('should return complete result for short bed', () => {
      const result = evaluateQuick(quickWizardShortBed);

      expect(result.success).toBe(true);
      expect(result.primaryRecommendation).toBeDefined();
      expect(result.primaryRecommendation?.rampId).toBe('AUN250');
      expect(result.timestamp).toBeDefined();
      expect(result.inputHash).toBeDefined();
    });

    it('should return complete result for long bed', () => {
      const result = evaluateQuick(quickWizardLongBed);

      expect(result.success).toBe(true);
      expect(result.primaryRecommendation?.rampId).toBe('AUN210');
      expect(result.alternativeRecommendation?.rampId).toBe('AUN250');
    });

    it('should handle tailgate close requirements', () => {
      const result = evaluateQuick(quickWizardTailgateCloseLoaded);

      expect(result.success).toBe(true);
      expect(result.primaryRecommendation?.rampId).toBe('AUN210');
      // Should have warnings about needing measurements
      expect(result.primaryRecommendation?.warnings.length).toBeGreaterThan(0);
    });

    it('should include tonneau notes when applicable', () => {
      const inputWithTonneau = {
        ...quickWizardShortBed,
        hasTonneau: true,
        tonneauType: 'roll-up-soft' as const,
        rollDirection: 'into-bed' as const,
      };

      const result = evaluateQuick(inputWithTonneau);

      expect(result.tonneauNotes).toBeDefined();
      expect(result.tonneauNotes?.length).toBeGreaterThan(0);
    });
  });

  describe('Advanced Wizard Flow', () => {
    it('should return complete result with calculated values', () => {
      const result = evaluateAdvanced(advancedShortBedBasic);

      expect(result.success).toBe(true);
      expect(result.primaryRecommendation).toBeDefined();
      expect(result.calculatedValues).toBeDefined();
      expect(result.calculatedValues.usableBedLength).toBe(66);
      expect(result.calculatedValues.bedCategory).toBe('short');
      expect(result.timestamp).toBeDefined();
      expect(result.inputHash).toBeDefined();
    });

    it('should include accessories for tailgate close with load', () => {
      const result = evaluateAdvanced(advancedTailgateCloseLoadedFits);

      expect(result.success).toBe(true);
      expect(result.primaryRecommendation?.rampId).toBe('AUN210');
      expect(result.primaryRecommendation?.requiredAccessories).toBeDefined();

      // Should require AC004
      const hasAC004 = result.primaryRecommendation?.requiredAccessories.some(
        (a) => a.accessoryId === 'AC004'
      );
      expect(hasAC004).toBe(true);
    });

    it('should return failure for impossible configuration', () => {
      const result = evaluateAdvanced(advancedTailgateCloseLoadedDoesNotFit);

      expect(result.success).toBe(false);
      expect(result.failure).toBeDefined();
      expect(result.failure?.type).toBe('hard');
      expect(result.failure?.message).toBeDefined();
      expect(result.failure?.suggestion).toBeDefined();
    });

    it('should calculate tonneau penalty correctly', () => {
      const result = evaluateAdvanced(advancedWithTonneauPenalty);

      expect(result.success).toBe(true);
      expect(result.calculatedValues.tonneauPenalty).toBe(10);
      // Original bed is 78", penalty is 10", usable should be 68"
      expect(result.calculatedValues.usableBedLength).toBe(68);
    });

    it('should include tonneau notes for soft roll-up into bed', () => {
      const result = evaluateAdvanced(advancedWithTonneauPenalty);

      expect(result.tonneauNotes).toBeDefined();
      expect(result.tonneauNotes?.length).toBeGreaterThan(0);
    });

    it('should calculate total price with accessories', () => {
      const result = evaluateAdvanced(advancedLongBedBasic);

      expect(result.primaryRecommendation?.price).toBeGreaterThan(0);
      expect(result.primaryRecommendation?.totalWithRequired).toBeGreaterThanOrEqual(
        result.primaryRecommendation?.price ?? 0
      );
    });
  });

  describe('Complete Scenarios', () => {
    it('Scenario: Budget-conscious user with short bed truck', () => {
      const input = {
        bedLength: 'short' as const,
        hasTonneau: false,
        tailgateMustClose: false,
        motorcycleLoadedWhenClosed: false,
      };

      const result = evaluateQuick(input);

      expect(result.success).toBe(true);
      expect(result.primaryRecommendation?.rampId).toBe('AUN250');
      // No special requirements, should be straightforward
      expect(result.primaryRecommendation?.warnings.length).toBe(0);
    });

    it('Scenario: User needs tailgate closure with motorcycle loaded', () => {
      // Long bed, needs to close tailgate with motorcycle inside
      const input = {
        truck: {
          bedLengthClosed: 96,
          bedLengthWithTailgate: 114,
          tailgateHeight: 24,
          hasTonneau: false,
        },
        motorcycle: {
          totalLength: 85, // 85 + 3 = 88, fits in 96
          wheelbase: 60,
          weight: 450,
        },
        tailgateMustClose: true,
        motorcycleLoadedWhenClosed: true,
        unitSystem: 'imperial' as const,
      };

      const result = evaluateAdvanced(input);

      expect(result.success).toBe(true);
      expect(result.primaryRecommendation?.rampId).toBe('AUN210');
      expect(result.calculatedValues.tailgateCloseWithLoadPossible).toBe(true);

      // Must have AC004
      const hasAC004 = result.primaryRecommendation?.requiredAccessories.some(
        (a) => a.accessoryId === 'AC004'
      );
      expect(hasAC004).toBe(true);
    });

    it('Scenario: User with tonneau cover that rolls into bed', () => {
      const input = {
        truck: {
          bedLengthClosed: 78,
          bedLengthWithTailgate: 96,
          tailgateHeight: 22,
          hasTonneau: true,
          tonneauType: 'roll-up-soft' as const,
          rollDirection: 'into-bed' as const,
        },
        motorcycle: {
          totalLength: 85,
          wheelbase: 60,
          weight: 450,
        },
        tailgateMustClose: false,
        motorcycleLoadedWhenClosed: false,
        unitSystem: 'imperial' as const,
      };

      const result = evaluateAdvanced(input);

      expect(result.success).toBe(true);
      // 10" penalty applied
      expect(result.calculatedValues.tonneauPenalty).toBe(10);
      expect(result.calculatedValues.usableBedLength).toBe(68);
      // Should have tonneau notes
      expect(result.tonneauNotes?.length).toBeGreaterThan(0);
    });

    it('Scenario: User unsure about measurements uses Quick Wizard', () => {
      const input = {
        bedLength: 'unsure' as const,
        hasTonneau: false,
        tailgateMustClose: false,
        motorcycleLoadedWhenClosed: false,
      };

      const result = evaluateQuick(input);

      expect(result.success).toBe(true);
      // Should default to AUN250 with warning to use Full Configurator
      expect(result.primaryRecommendation?.rampId).toBe('AUN250');
      expect(result.primaryRecommendation?.warnings.some((w) => w.includes('Configurator'))).toBe(
        true
      );
    });

    it('Scenario: User needs AUN250 with long bed (requires 4-beam)', () => {
      const input = {
        truck: {
          bedLengthClosed: 96,
          bedLengthWithTailgate: 114,
          tailgateHeight: 22,
          hasTonneau: false,
        },
        motorcycle: {
          totalLength: 85,
          wheelbase: 60,
          weight: 450,
        },
        tailgateMustClose: true,
        motorcycleLoadedWhenClosed: false, // Doesn't need loaded, so AUN250 can fold
        unitSystem: 'imperial' as const,
      };

      const result = evaluateAdvanced(input);

      expect(result.success).toBe(true);
      // Should prefer AUN250 for tailgate close unloaded
      expect(result.primaryRecommendation?.rampId).toBe('AUN250');
      expect(result.calculatedValues.bedCategory).toBe('long');

      // Long bed with AUN250 should require 4-beam
      const has4Beam = result.primaryRecommendation?.requiredAccessories.some(
        (a) => a.accessoryId === '4-BEAM'
      );
      expect(has4Beam).toBe(true);
    });

    it('Scenario: Edge case - motorcycle exactly fits with 0 margin', () => {
      // Bed length 90, motorcycle 87, buffer 3 = exactly 90 required
      const input = {
        truck: {
          bedLengthClosed: 90,
          bedLengthWithTailgate: 108,
          tailgateHeight: 22,
          hasTonneau: false,
        },
        motorcycle: {
          totalLength: 87,
          wheelbase: 62,
          weight: 450,
        },
        tailgateMustClose: true,
        motorcycleLoadedWhenClosed: true,
        unitSystem: 'imperial' as const,
      };

      const result = evaluateAdvanced(input);

      expect(result.success).toBe(true);
      expect(result.primaryRecommendation?.rampId).toBe('AUN210');
      // Should be exactly possible with 0 margin
      expect(result.calculatedValues.tailgateCloseWithLoadPossible).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalInput = {
        bedLength: 'standard' as const,
        hasTonneau: false,
        tailgateMustClose: false,
        motorcycleLoadedWhenClosed: false,
      };

      const result = evaluateQuick(minimalInput);
      expect(result.success).toBe(true);
    });

    it('should generate unique input hashes', () => {
      const result1 = evaluateQuick(quickWizardShortBed);
      const result2 = evaluateQuick(quickWizardLongBed);

      expect(result1.inputHash).toBeDefined();
      expect(result2.inputHash).toBeDefined();
      expect(result1.inputHash).not.toBe(result2.inputHash);
    });

    it('should generate timestamp for each evaluation', () => {
      const result = evaluateQuick(quickWizardShortBed);
      expect(result.timestamp).toBeDefined();

      // Should be valid ISO string
      const date = new Date(result.timestamp);
      expect(date.toISOString()).toBe(result.timestamp);
    });
  });
});
