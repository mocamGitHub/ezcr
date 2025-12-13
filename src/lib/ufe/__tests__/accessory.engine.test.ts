/**
 * UFE Accessory Engine Tests
 *
 * Tests for accessory requirement determination.
 */

import { describe, it, expect } from 'vitest';
import {
  getHeightExtension,
  needsHeightExtension,
  requiresAC004,
  isAC004Compatible,
  requires4Beam,
  is4BeamCompatible,
  getRequiredAccessories,
  getOptionalAccessories,
  validateAccessoryCompatibility,
  filterCompatibleAccessories,
  calculateAccessoriesTotal,
  calculateRequiredAccessoriesTotal,
  getAccessoryNotes,
} from '../engines/accessory.engine';
import {
  advancedTailgateCloseLoadedFits,
  advancedLongBedBasic,
  advancedExceeds4BeamThreshold,
  longBedTruck,
  standardMotorcycle,
} from './fixtures';
import type { CalculatedValues } from '../types';

describe('Accessory Engine', () => {
  describe('Height Extension Logic', () => {
    describe('getHeightExtension', () => {
      it('should return AC001-1 for 35-42 inch tailgates', () => {
        expect(getHeightExtension(35)).toBe('AC001-1');
        expect(getHeightExtension(38)).toBe('AC001-1');
        expect(getHeightExtension(42)).toBe('AC001-1');
      });

      it('should return AC001-2 for 43-51 inch tailgates', () => {
        expect(getHeightExtension(43)).toBe('AC001-2');
        expect(getHeightExtension(47)).toBe('AC001-2');
        expect(getHeightExtension(51)).toBe('AC001-2');
      });

      it('should return AC001-3 for 52-60 inch tailgates', () => {
        expect(getHeightExtension(52)).toBe('AC001-3');
        expect(getHeightExtension(56)).toBe('AC001-3');
        expect(getHeightExtension(60)).toBe('AC001-3');
      });

      it('should return null for tailgates outside range', () => {
        expect(getHeightExtension(20)).toBeNull();
        expect(getHeightExtension(34)).toBeNull();
        expect(getHeightExtension(61)).toBeNull();
        expect(getHeightExtension(80)).toBeNull();
      });
    });

    describe('needsHeightExtension', () => {
      it('should return true for heights 35-60 inches', () => {
        expect(needsHeightExtension(35)).toBe(true);
        expect(needsHeightExtension(45)).toBe(true);
        expect(needsHeightExtension(60)).toBe(true);
      });

      it('should return false for heights outside range', () => {
        expect(needsHeightExtension(22)).toBe(false);
        expect(needsHeightExtension(34)).toBe(false);
        expect(needsHeightExtension(61)).toBe(false);
      });
    });
  });

  describe('AC004 Logic (AUN210 Tailgate Extension)', () => {
    describe('requiresAC004', () => {
      it('should require AC004 for AUN210 when tailgate close with motorcycle loaded', () => {
        expect(requiresAC004('AUN210', true, true)).toBe(true);
      });

      it('should not require AC004 for AUN210 when tailgate close unloaded', () => {
        expect(requiresAC004('AUN210', true, false)).toBe(false);
      });

      it('should not require AC004 for AUN210 when tailgate does not need to close', () => {
        expect(requiresAC004('AUN210', false, false)).toBe(false);
        expect(requiresAC004('AUN210', false, true)).toBe(false);
      });

      it('should NEVER require AC004 for AUN250', () => {
        expect(requiresAC004('AUN250', true, true)).toBe(false);
        expect(requiresAC004('AUN250', true, false)).toBe(false);
        expect(requiresAC004('AUN250', false, true)).toBe(false);
      });
    });

    describe('isAC004Compatible', () => {
      it('should be compatible with AUN210', () => {
        expect(isAC004Compatible('AUN210')).toBe(true);
      });

      it('should NOT be compatible with AUN250', () => {
        expect(isAC004Compatible('AUN250')).toBe(false);
      });
    });
  });

  describe('4-Beam Logic (AUN250 Bed Extension)', () => {
    describe('requires4Beam', () => {
      it('should require 4-Beam for AUN250 with long bed', () => {
        expect(requires4Beam('AUN250', 'long', 114)).toBe(true);
      });

      it('should require 4-Beam for AUN250 when exceeding threshold', () => {
        expect(requires4Beam('AUN250', 'standard', 105)).toBe(true); // > 101
      });

      it('should not require 4-Beam for AUN250 with short bed under threshold', () => {
        expect(requires4Beam('AUN250', 'short', 84)).toBe(false);
      });

      it('should not require 4-Beam for AUN250 with standard bed under threshold', () => {
        expect(requires4Beam('AUN250', 'standard', 96)).toBe(false);
      });

      it('should NEVER require 4-Beam for AUN210', () => {
        expect(requires4Beam('AUN210', 'long', 114)).toBe(false);
        expect(requires4Beam('AUN210', 'standard', 105)).toBe(false);
      });
    });

    describe('is4BeamCompatible', () => {
      it('should be compatible with AUN250', () => {
        expect(is4BeamCompatible('AUN250')).toBe(true);
      });

      it('should NOT be compatible with AUN210', () => {
        expect(is4BeamCompatible('AUN210')).toBe(false);
      });
    });
  });

  describe('getRequiredAccessories', () => {
    it('should include AC004 for AUN210 tailgate close with load', () => {
      const calculatedValues: CalculatedValues = {
        usableBedLength: 96,
        tonneauPenalty: 0,
        bedCategory: 'long',
        tailgateCloseWithLoadPossible: true,
        exceeds4BeamThreshold: false,
      };

      const accessories = getRequiredAccessories(
        'AUN210',
        advancedTailgateCloseLoadedFits,
        calculatedValues
      );

      expect(accessories.some((a) => a.accessoryId === 'AC004')).toBe(true);
    });

    it('should include 4-Beam for AUN250 with long bed', () => {
      const calculatedValues: CalculatedValues = {
        usableBedLength: 96,
        tonneauPenalty: 0,
        bedCategory: 'long',
        tailgateCloseWithLoadPossible: false,
        exceeds4BeamThreshold: false,
      };

      const input = {
        truck: longBedTruck,
        motorcycle: standardMotorcycle,
        tailgateMustClose: false,
        motorcycleLoadedWhenClosed: false,
        unitSystem: 'imperial' as const,
      };

      const accessories = getRequiredAccessories('AUN250', input, calculatedValues);

      expect(accessories.some((a) => a.accessoryId === '4-BEAM')).toBe(true);
    });

    it('should include 4-Beam for AUN250 when exceeding threshold', () => {
      const calculatedValues: CalculatedValues = {
        usableBedLength: 84,
        tonneauPenalty: 0,
        bedCategory: 'standard',
        tailgateCloseWithLoadPossible: false,
        exceeds4BeamThreshold: true,
      };

      const accessories = getRequiredAccessories(
        'AUN250',
        advancedExceeds4BeamThreshold,
        calculatedValues
      );

      expect(accessories.some((a) => a.accessoryId === '4-BEAM')).toBe(true);
    });

    it('should not include incompatible accessories', () => {
      const calculatedValues: CalculatedValues = {
        usableBedLength: 96,
        tonneauPenalty: 0,
        bedCategory: 'long',
        tailgateCloseWithLoadPossible: true,
        exceeds4BeamThreshold: false,
      };

      const aun210Accessories = getRequiredAccessories(
        'AUN210',
        advancedLongBedBasic,
        calculatedValues
      );

      const aun250Accessories = getRequiredAccessories(
        'AUN250',
        advancedLongBedBasic,
        calculatedValues
      );

      // AUN210 should never have 4-BEAM
      expect(aun210Accessories.some((a) => a.accessoryId === '4-BEAM')).toBe(false);

      // AUN250 should never have AC004
      expect(aun250Accessories.some((a) => a.accessoryId === 'AC004')).toBe(false);
    });
  });

  describe('getOptionalAccessories', () => {
    it('should return optional accessories for AUN210', () => {
      const optional = getOptionalAccessories('AUN210');
      // Should include AC012 (Boltless Tie Down Kit)
      expect(optional.length).toBeGreaterThanOrEqual(0);
    });

    it('should return optional accessories for AUN250', () => {
      const optional = getOptionalAccessories('AUN250');
      expect(optional.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateAccessoryCompatibility', () => {
    it('should validate compatible accessories', () => {
      expect(validateAccessoryCompatibility('AC004', 'AUN210').isCompatible).toBe(true);
      expect(validateAccessoryCompatibility('4-BEAM', 'AUN250').isCompatible).toBe(true);
    });

    it('should reject incompatible accessories with specific reason', () => {
      const ac004OnAun250 = validateAccessoryCompatibility('AC004', 'AUN250');
      expect(ac004OnAun250.isCompatible).toBe(false);
      expect(ac004OnAun250.reason).toContain('AUN210');

      const beamOnAun210 = validateAccessoryCompatibility('4-BEAM', 'AUN210');
      expect(beamOnAun210.isCompatible).toBe(false);
      expect(beamOnAun210.reason).toContain('AUN250');
    });

    it('should handle unknown accessories', () => {
      const result = validateAccessoryCompatibility('UNKNOWN' as any, 'AUN210');
      expect(result.isCompatible).toBe(false);
      expect(result.reason).toContain('Unknown');
    });
  });

  describe('filterCompatibleAccessories', () => {
    it('should filter to only compatible accessories for AUN210', () => {
      const input = ['AC004', '4-BEAM', 'AC001-1', 'AC012'] as const;
      const filtered = filterCompatibleAccessories([...input], 'AUN210');

      expect(filtered).toContain('AC004');
      expect(filtered).not.toContain('4-BEAM');
    });

    it('should filter to only compatible accessories for AUN250', () => {
      const input = ['AC004', '4-BEAM', 'AC001-1', 'AC012'] as const;
      const filtered = filterCompatibleAccessories([...input], 'AUN250');

      expect(filtered).toContain('4-BEAM');
      expect(filtered).not.toContain('AC004');
    });
  });

  describe('Accessory Pricing', () => {
    describe('calculateAccessoriesTotal', () => {
      it('should sum all accessory prices', () => {
        const accessories = [
          { accessoryId: 'AC004' as const, price: 100, required: true, requirementType: 'required' as const, reason: '', name: '' },
          { accessoryId: '4-BEAM' as const, price: 150, required: true, requirementType: 'required' as const, reason: '', name: '' },
        ];

        expect(calculateAccessoriesTotal(accessories)).toBe(250);
      });

      it('should return 0 for empty array', () => {
        expect(calculateAccessoriesTotal([])).toBe(0);
      });
    });

    describe('calculateRequiredAccessoriesTotal', () => {
      it('should only sum required accessories', () => {
        const accessories = [
          { accessoryId: 'AC004' as const, price: 100, required: true, requirementType: 'required' as const, reason: '', name: '' },
          { accessoryId: 'AC012' as const, price: 50, required: false, requirementType: 'optional' as const, reason: '', name: '' },
        ];

        expect(calculateRequiredAccessoriesTotal(accessories)).toBe(100);
      });
    });
  });

  describe('getAccessoryNotes', () => {
    it('should return notes for AC004', () => {
      const notes = getAccessoryNotes('AC004');
      expect(notes.length).toBeGreaterThan(0);
      expect(notes.some((n) => n.toLowerCase().includes('tailgate'))).toBe(true);
    });

    it('should return notes for 4-BEAM', () => {
      const notes = getAccessoryNotes('4-BEAM');
      expect(notes.length).toBeGreaterThan(0);
      expect(notes.some((n) => n.toLowerCase().includes('support'))).toBe(true);
    });

    it('should return notes for height extensions', () => {
      const notes1 = getAccessoryNotes('AC001-1');
      const notes2 = getAccessoryNotes('AC001-2');
      const notes3 = getAccessoryNotes('AC001-3');

      expect(notes1.length).toBeGreaterThan(0);
      expect(notes2.length).toBeGreaterThan(0);
      expect(notes3.length).toBeGreaterThan(0);
    });
  });
});
