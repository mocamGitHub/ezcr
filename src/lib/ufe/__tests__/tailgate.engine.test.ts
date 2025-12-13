/**
 * UFE Tailgate Engine Tests
 *
 * Tests for all tailgate closure business rules.
 */

import { describe, it, expect } from 'vitest';
import {
  canTailgateCloseLoaded,
  canTailgateCloseUnloaded,
  validateTailgateRequirement,
  getRampForTailgateRequirement,
  supportsTailgateClose,
  getTailgateNotes,
} from '../engines/tailgate.engine';
import { expectedResults } from './fixtures';

describe('Tailgate Engine', () => {
  describe('canTailgateCloseLoaded', () => {
    const buffer = expectedResults.tailgateBufferInches; // 3"

    describe('AUN250', () => {
      it('should NEVER allow tailgate close with motorcycle loaded', () => {
        const result = canTailgateCloseLoaded('AUN250', 60, 96);
        expect(result.canClose).toBe(false);
        expect(result.requiresAC004).toBe(false);
      });

      it('should never allow even with plenty of room', () => {
        const result = canTailgateCloseLoaded('AUN250', 50, 120);
        expect(result.canClose).toBe(false);
      });
    });

    describe('AUN210', () => {
      it('should allow when motorcycle + buffer fits', () => {
        // 72" motorcycle + 3" buffer = 75" required, bed is 96"
        const result = canTailgateCloseLoaded('AUN210', 72, 96);
        expect(result.canClose).toBe(true);
        expect(result.requiresAC004).toBe(true);
        expect(result.marginInches).toBe(21); // 96 - 75 = 21
      });

      it('should not allow when motorcycle + buffer exceeds bed', () => {
        // 95" motorcycle + 3" buffer = 98" required, bed is 78"
        const result = canTailgateCloseLoaded('AUN210', 95, 78);
        expect(result.canClose).toBe(false);
        expect(result.requiresAC004).toBe(false);
        expect(result.marginInches).toBeLessThan(0);
      });

      it('should handle exact fit scenario', () => {
        // 90" motorcycle + 3" buffer = 93" required, bed is 93"
        const result = canTailgateCloseLoaded('AUN210', 90, 93);
        expect(result.canClose).toBe(true);
        expect(result.marginInches).toBe(0);
      });

      it('should not allow when off by 1 inch', () => {
        // 90" motorcycle + 3" buffer = 93" required, bed is 92"
        const result = canTailgateCloseLoaded('AUN210', 90, 92);
        expect(result.canClose).toBe(false);
        expect(result.marginInches).toBe(-1);
      });
    });
  });

  describe('canTailgateCloseUnloaded', () => {
    describe('AUN210', () => {
      it('should always allow tailgate close when unloaded', () => {
        const result = canTailgateCloseUnloaded('AUN210');
        expect(result.canClose).toBe(true);
        expect(result.requiresFolded).toBe(false);
      });
    });

    describe('AUN250', () => {
      it('should allow tailgate close when folded', () => {
        const result = canTailgateCloseUnloaded('AUN250');
        expect(result.canClose).toBe(true);
        expect(result.requiresFolded).toBe(true);
      });
    });
  });

  describe('validateTailgateRequirement', () => {
    describe('No tailgate requirement', () => {
      it('should pass for both ramps when tailgate does not need to close', () => {
        const aun210 = validateTailgateRequirement({
          rampId: 'AUN210',
          tailgateMustClose: false,
          motorcycleLoadedWhenClosed: false,
        });

        const aun250 = validateTailgateRequirement({
          rampId: 'AUN250',
          tailgateMustClose: false,
          motorcycleLoadedWhenClosed: false,
        });

        expect(aun210.isPossible).toBe(true);
        expect(aun210.isHardFailure).toBe(false);
        expect(aun250.isPossible).toBe(true);
        expect(aun250.isHardFailure).toBe(false);
      });
    });

    describe('Tailgate close - motorcycle NOT loaded', () => {
      it('should pass for AUN210', () => {
        const result = validateTailgateRequirement({
          rampId: 'AUN210',
          tailgateMustClose: true,
          motorcycleLoadedWhenClosed: false,
        });

        expect(result.isPossible).toBe(true);
        expect(result.requiresAC004).toBe(false);
        expect(result.requiresFolded).toBe(false);
      });

      it('should pass for AUN250 - requires folded', () => {
        const result = validateTailgateRequirement({
          rampId: 'AUN250',
          tailgateMustClose: true,
          motorcycleLoadedWhenClosed: false,
        });

        expect(result.isPossible).toBe(true);
        expect(result.requiresFolded).toBe(true);
      });
    });

    describe('Tailgate close - motorcycle LOADED', () => {
      it('should hard fail for AUN250', () => {
        const result = validateTailgateRequirement({
          rampId: 'AUN250',
          tailgateMustClose: true,
          motorcycleLoadedWhenClosed: true,
          motorcycleLength: 85,
          usableBedLength: 96,
        });

        expect(result.isPossible).toBe(false);
        expect(result.isHardFailure).toBe(true);
        expect(result.reason).toContain('AUN250 cannot close tailgate');
      });

      it('should pass for AUN210 when motorcycle fits', () => {
        const result = validateTailgateRequirement({
          rampId: 'AUN210',
          tailgateMustClose: true,
          motorcycleLoadedWhenClosed: true,
          motorcycleLength: 72,
          usableBedLength: 96,
        });

        expect(result.isPossible).toBe(true);
        expect(result.requiresAC004).toBe(true);
        expect(result.marginInches).toBeGreaterThan(0);
      });

      it('should fail for AUN210 when motorcycle does not fit', () => {
        const result = validateTailgateRequirement({
          rampId: 'AUN210',
          tailgateMustClose: true,
          motorcycleLoadedWhenClosed: true,
          motorcycleLength: 95,
          usableBedLength: 78,
        });

        expect(result.isPossible).toBe(false);
        expect(result.isHardFailure).toBe(true);
        expect(result.reason).toContain('too long');
      });

      it('should request measurements when missing', () => {
        const result = validateTailgateRequirement({
          rampId: 'AUN210',
          tailgateMustClose: true,
          motorcycleLoadedWhenClosed: true,
          // No motorcycle length or bed length
        });

        expect(result.isPossible).toBe(false);
        expect(result.isHardFailure).toBe(false);
        expect(result.reason).toContain('Measurements required');
      });
    });
  });

  describe('getRampForTailgateRequirement', () => {
    it('should return null primary when no tailgate requirement', () => {
      const result = getRampForTailgateRequirement(false, false);
      expect(result.primaryRamp).toBeNull();
      expect(result.isHardFailure).toBe(false);
    });

    it('should prefer AUN250 for tailgate close unloaded', () => {
      const result = getRampForTailgateRequirement(true, false);
      expect(result.primaryRamp).toBe('AUN250');
      expect(result.alternativeRamp).toBe('AUN210');
    });

    it('should require AUN210 for tailgate close with load', () => {
      const result = getRampForTailgateRequirement(true, true, 72, 96);
      expect(result.primaryRamp).toBe('AUN210');
      expect(result.alternativeRamp).toBeNull();
    });

    it('should hard fail when motorcycle does not fit', () => {
      const result = getRampForTailgateRequirement(true, true, 95, 78);
      expect(result.primaryRamp).toBeNull();
      expect(result.isHardFailure).toBe(true);
    });

    it('should indicate measurements needed when missing', () => {
      const result = getRampForTailgateRequirement(true, true);
      expect(result.primaryRamp).toBe('AUN210');
      expect(result.reason).toContain('measurements needed');
    });
  });

  describe('supportsTailgateClose', () => {
    it('should return correct support for AUN210', () => {
      expect(supportsTailgateClose('AUN210', true)).toBe(true);
      expect(supportsTailgateClose('AUN210', false)).toBe(true);
    });

    it('should return correct support for AUN250', () => {
      expect(supportsTailgateClose('AUN250', true)).toBe(false);
      expect(supportsTailgateClose('AUN250', false)).toBe(true);
    });
  });

  describe('getTailgateNotes', () => {
    it('should return empty array when no tailgate requirement', () => {
      const notes = getTailgateNotes('AUN210', false, false);
      expect(notes).toHaveLength(0);
    });

    it('should return folding note for AUN250 unloaded', () => {
      const notes = getTailgateNotes('AUN250', true, false);
      expect(notes.some((n) => n.includes('Fold'))).toBe(true);
    });

    it('should return cannot close note for AUN250 loaded', () => {
      const notes = getTailgateNotes('AUN250', true, true);
      expect(notes.some((n) => n.includes('cannot close'))).toBe(true);
    });

    it('should return AC004 note for AUN210 loaded', () => {
      const notes = getTailgateNotes('AUN210', true, true);
      expect(notes.some((n) => n.includes('AC004'))).toBe(true);
    });
  });
});
