/**
 * UFE Bed Length Engine Tests
 */

import { describe, it, expect } from 'vitest';
import {
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
  isNearCategoryBoundary,
} from '../engines/bed-length.engine';
import { expectedResults } from './fixtures';

describe('Bed Length Engine', () => {
  describe('categorizeBedLength', () => {
    it('should categorize short beds (<72")', () => {
      expect(categorizeBedLength(60)).toBe('short');
      expect(categorizeBedLength(71)).toBe('short');
      expect(categorizeBedLength(71.99)).toBe('short');
    });

    it('should categorize standard beds (72-95.99")', () => {
      expect(categorizeBedLength(72)).toBe('standard');
      expect(categorizeBedLength(78)).toBe('standard');
      expect(categorizeBedLength(84)).toBe('standard');
      expect(categorizeBedLength(95)).toBe('standard');
      expect(categorizeBedLength(95.99)).toBe('standard');
    });

    it('should categorize long beds (>=96")', () => {
      expect(categorizeBedLength(96)).toBe('long');
      expect(categorizeBedLength(100)).toBe('long');
      expect(categorizeBedLength(120)).toBe('long');
    });

    it('should handle edge cases at boundaries', () => {
      // Just below standard
      expect(categorizeBedLength(71.999)).toBe('short');
      // Exactly at standard start
      expect(categorizeBedLength(expectedResults.standardMinInches)).toBe('standard');
      // Just below long
      expect(categorizeBedLength(95.999)).toBe('standard');
      // Exactly at long start
      expect(categorizeBedLength(expectedResults.longMinInches)).toBe('long');
    });
  });

  describe('isInCategory', () => {
    it('should correctly identify short bed lengths', () => {
      expect(isInCategory(60, 'short')).toBe(true);
      expect(isInCategory(72, 'short')).toBe(false);
      expect(isInCategory(96, 'short')).toBe(false);
    });

    it('should correctly identify standard bed lengths', () => {
      expect(isInCategory(60, 'standard')).toBe(false);
      expect(isInCategory(78, 'standard')).toBe(true);
      expect(isInCategory(96, 'standard')).toBe(false);
    });

    it('should correctly identify long bed lengths', () => {
      expect(isInCategory(60, 'long')).toBe(false);
      expect(isInCategory(78, 'long')).toBe(false);
      expect(isInCategory(96, 'long')).toBe(true);
    });
  });

  describe('getCategoryBounds', () => {
    it('should return correct bounds for short category', () => {
      const bounds = getCategoryBounds('short');
      expect(bounds.min).toBe(0);
      expect(bounds.max).toBeLessThan(72);
    });

    it('should return correct bounds for standard category', () => {
      const bounds = getCategoryBounds('standard');
      expect(bounds.min).toBe(72);
      expect(bounds.max).toBeLessThan(96);
    });

    it('should return correct bounds for long category', () => {
      const bounds = getCategoryBounds('long');
      expect(bounds.min).toBe(96);
      expect(bounds.max).toBeGreaterThan(96);
    });
  });

  describe('determineTonneauPenalty', () => {
    const defaultPenalty = expectedResults.tonneauPenaltyInches;

    it('should return 0 when no tonneau', () => {
      expect(determineTonneauPenalty(false)).toBe(0);
      expect(determineTonneauPenalty(false, 'roll-up-soft', 'into-bed')).toBe(0);
    });

    it('should return 0 when tonneau type is none', () => {
      expect(determineTonneauPenalty(true, 'none')).toBe(0);
    });

    it('should apply penalty for roll-up that rolls into bed', () => {
      expect(determineTonneauPenalty(true, 'roll-up-soft', 'into-bed')).toBe(defaultPenalty);
      expect(determineTonneauPenalty(true, 'roll-up-hard', 'into-bed')).toBe(defaultPenalty);
    });

    it('should return 0 for roll-up that rolls on top', () => {
      expect(determineTonneauPenalty(true, 'roll-up-soft', 'on-top')).toBe(0);
      expect(determineTonneauPenalty(true, 'roll-up-hard', 'on-top')).toBe(0);
    });

    it('should return 0 for tri-fold covers', () => {
      expect(determineTonneauPenalty(true, 'tri-fold-soft')).toBe(0);
      expect(determineTonneauPenalty(true, 'tri-fold-hard')).toBe(0);
    });

    it('should return 0 for bi-fold covers', () => {
      expect(determineTonneauPenalty(true, 'bi-fold')).toBe(0);
    });

    it('should return 0 for hinged covers', () => {
      expect(determineTonneauPenalty(true, 'hinged')).toBe(0);
    });

    it('should apply penalty for retractable covers', () => {
      expect(determineTonneauPenalty(true, 'retractable')).toBe(defaultPenalty);
    });

    it('should apply penalty for other/unknown types', () => {
      expect(determineTonneauPenalty(true, 'other')).toBe(defaultPenalty);
    });
  });

  describe('calculateUsableBedLength', () => {
    it('should subtract penalty from bed length', () => {
      expect(calculateUsableBedLength(78, 10)).toBe(68);
      expect(calculateUsableBedLength(96, 10)).toBe(86);
    });

    it('should not go below 0', () => {
      expect(calculateUsableBedLength(5, 10)).toBe(0);
    });

    it('should return full length when no penalty', () => {
      expect(calculateUsableBedLength(78, 0)).toBe(78);
    });
  });

  describe('getUsableBedLength', () => {
    it('should calculate usable length with no tonneau', () => {
      const result = getUsableBedLength(78, false);
      expect(result.usableBedLength).toBe(78);
      expect(result.tonneauPenalty).toBe(0);
    });

    it('should calculate usable length with tonneau penalty', () => {
      const result = getUsableBedLength(78, true, 'roll-up-soft', 'into-bed');
      expect(result.usableBedLength).toBe(68);
      expect(result.tonneauPenalty).toBe(10);
    });

    it('should handle tonneau with no penalty', () => {
      const result = getUsableBedLength(78, true, 'tri-fold-soft');
      expect(result.usableBedLength).toBe(78);
      expect(result.tonneauPenalty).toBe(0);
    });
  });

  describe('estimateBedLengthFromCategory', () => {
    it('should return null for unsure category', () => {
      expect(estimateBedLengthFromCategory('unsure')).toBeNull();
    });

    it('should return range for short beds', () => {
      const range = estimateBedLengthFromCategory('short');
      expect(range).not.toBeNull();
      expect(range!.min).toBeLessThan(72);
      expect(range!.max).toBeLessThan(72);
    });

    it('should return range for standard beds', () => {
      const range = estimateBedLengthFromCategory('standard');
      expect(range).not.toBeNull();
      expect(range!.min).toBeGreaterThanOrEqual(72);
      expect(range!.max).toBeLessThan(96);
    });

    it('should return range for long beds', () => {
      const range = estimateBedLengthFromCategory('long');
      expect(range).not.toBeNull();
      expect(range!.min).toBeGreaterThanOrEqual(96);
    });
  });

  describe('getEstimatedMidpoint', () => {
    it('should return null for unsure category', () => {
      expect(getEstimatedMidpoint('unsure')).toBeNull();
    });

    it('should return midpoint for categories', () => {
      const shortMid = getEstimatedMidpoint('short');
      const standardMid = getEstimatedMidpoint('standard');
      const longMid = getEstimatedMidpoint('long');

      expect(shortMid).not.toBeNull();
      expect(standardMid).not.toBeNull();
      expect(longMid).not.toBeNull();

      // Midpoints should be in appropriate ranges
      expect(shortMid!).toBeLessThan(72);
      expect(standardMid!).toBeGreaterThanOrEqual(72);
      expect(standardMid!).toBeLessThan(96);
      expect(longMid!).toBeGreaterThanOrEqual(96);
    });
  });

  describe('isValidBedLength', () => {
    it('should validate normal bed lengths', () => {
      expect(isValidBedLength(66)).toBe(true);
      expect(isValidBedLength(78)).toBe(true);
      expect(isValidBedLength(96)).toBe(true);
    });

    it('should reject unreasonable bed lengths', () => {
      expect(isValidBedLength(10)).toBe(false); // Too short
      expect(isValidBedLength(200)).toBe(false); // Too long
    });
  });

  describe('isValidTotalLength', () => {
    it('should validate normal total lengths', () => {
      expect(isValidTotalLength(84)).toBe(true);
      expect(isValidTotalLength(96)).toBe(true);
      expect(isValidTotalLength(120)).toBe(true);
    });

    it('should reject unreasonable total lengths', () => {
      expect(isValidTotalLength(20)).toBe(false); // Too short
      expect(isValidTotalLength(250)).toBe(false); // Too long
    });
  });

  describe('isNearCategoryBoundary', () => {
    it('should detect near short-standard boundary', () => {
      const result = isNearCategoryBoundary(71);
      expect(result.isNearBoundary).toBe(true);
      expect(result.nearBoundary).toBe('short-standard');
    });

    it('should detect near standard-long boundary', () => {
      const result = isNearCategoryBoundary(95);
      expect(result.isNearBoundary).toBe(true);
      expect(result.nearBoundary).toBe('standard-long');
    });

    it('should not flag values well within categories', () => {
      expect(isNearCategoryBoundary(60).isNearBoundary).toBe(false);
      expect(isNearCategoryBoundary(84).isNearBoundary).toBe(false);
      expect(isNearCategoryBoundary(110).isNearBoundary).toBe(false);
    });

    it('should respect tolerance parameter', () => {
      // Default tolerance is 3"
      expect(isNearCategoryBoundary(69).isNearBoundary).toBe(true);
      expect(isNearCategoryBoundary(68).isNearBoundary).toBe(false);

      // Custom tolerance
      expect(isNearCategoryBoundary(68, 5).isNearBoundary).toBe(true);
    });
  });
});
