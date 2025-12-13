/**
 * UFE Config Tests
 *
 * Tests for configuration loading and access.
 */

import { describe, it, expect } from 'vitest';
import {
  loadConfig,
  reloadConfig,
  getEngineSettings,
  getRampModel,
  getActiveRampModels,
  getAccessory,
  getAllAccessories,
  getCompatibleAccessories,
  isAccessoryCompatible,
  getBedCategory,
  getAllBedCategories,
  getQuickWizardBedOptions,
  getMessage,
  getPricingConfig,
  getBulkDiscount,
  validateConfig,
} from '../config';

describe('UFE Config', () => {
  describe('loadConfig', () => {
    it('should load all configuration files', () => {
      const config = loadConfig();
      expect(config).toBeDefined();
      expect(config.engineSettings).toBeDefined();
      expect(config.rampModels).toBeDefined();
      expect(config.accessories).toBeDefined();
      expect(config.bedCategories).toBeDefined();
      expect(config.messages).toBeDefined();
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const config1 = loadConfig();
      const config2 = loadConfig();
      expect(config1).toBe(config2);
    });
  });

  describe('reloadConfig', () => {
    it('should reload configuration', () => {
      const config1 = loadConfig();
      const config2 = reloadConfig();
      // After reload, should be a fresh instance
      expect(config2).toBeDefined();
      expect(config2.engineSettings).toBeDefined();
    });
  });

  describe('getEngineSettings', () => {
    it('should return engine settings', () => {
      const settings = getEngineSettings();
      expect(settings).toBeDefined();
      expect(settings.version).toBeDefined();
      expect(typeof settings.tonneauPenaltyInches).toBe('number');
      expect(typeof settings.beamExtensionThresholdInches).toBe('number');
      expect(typeof settings.tailgateCloseBufferInches).toBe('number');
    });

    it('should have correct bed length categories', () => {
      const settings = getEngineSettings();
      expect(settings.bedLengthCategories).toBeDefined();
      expect(settings.bedLengthCategories.short).toBeDefined();
      expect(settings.bedLengthCategories.standard).toBeDefined();
      expect(settings.bedLengthCategories.long).toBeDefined();
    });

    it('should have measurement ranges', () => {
      const settings = getEngineSettings();
      expect(settings.measurementRanges).toBeDefined();
      expect(settings.measurementRanges.bedLengthClosed).toBeDefined();
      expect(settings.measurementRanges.bedLengthWithTailgate).toBeDefined();
    });
  });

  describe('getRampModel', () => {
    it('should return AUN210 model', () => {
      const model = getRampModel('AUN210');
      expect(model).toBeDefined();
      expect(model?.name).toBeDefined();
      expect(typeof model?.price).toBe('number');
      expect(model?.folds).toBe(false);
      expect(model?.tailgateCloseLoaded).toBe(true);
    });

    it('should return AUN250 model', () => {
      const model = getRampModel('AUN250');
      expect(model).toBeDefined();
      expect(model?.name).toBeDefined();
      expect(typeof model?.price).toBe('number');
      expect(model?.folds).toBe(true);
      expect(model?.tailgateCloseLoaded).toBe(false);
    });

    it('should return undefined for unknown model', () => {
      const model = getRampModel('UNKNOWN' as any);
      expect(model).toBeUndefined();
    });
  });

  describe('getActiveRampModels', () => {
    it('should return all active ramp models', () => {
      const models = getActiveRampModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      // All returned models should be active
      models.forEach((model) => {
        expect(model.active).toBe(true);
      });
    });
  });

  describe('getAccessory', () => {
    it('should return AC004 accessory', () => {
      const acc = getAccessory('AC004');
      expect(acc).toBeDefined();
      expect(acc?.name).toBeDefined();
      expect(typeof acc?.price).toBe('number');
    });

    it('should return 4-BEAM accessory', () => {
      const acc = getAccessory('4-BEAM');
      expect(acc).toBeDefined();
      expect(acc?.name).toBeDefined();
    });

    it('should return height extensions', () => {
      expect(getAccessory('AC001-1')).toBeDefined();
      expect(getAccessory('AC001-2')).toBeDefined();
      expect(getAccessory('AC001-3')).toBeDefined();
    });

    it('should return undefined for unknown accessory', () => {
      expect(getAccessory('UNKNOWN' as any)).toBeUndefined();
    });
  });

  describe('getAllAccessories', () => {
    it('should return all accessories', () => {
      const accessories = getAllAccessories();
      expect(Array.isArray(accessories)).toBe(true);
      expect(accessories.length).toBeGreaterThan(0);
    });
  });

  describe('getCompatibleAccessories', () => {
    it('should return accessories compatible with AUN210', () => {
      const accessories = getCompatibleAccessories('AUN210');
      expect(Array.isArray(accessories)).toBe(true);
      // Should include AC004 but not 4-BEAM
      expect(accessories.some((a) => a.id === 'AC004')).toBe(true);
      expect(accessories.some((a) => a.id === '4-BEAM')).toBe(false);
    });

    it('should return accessories compatible with AUN250', () => {
      const accessories = getCompatibleAccessories('AUN250');
      expect(Array.isArray(accessories)).toBe(true);
      // Should include 4-BEAM but not AC004
      expect(accessories.some((a) => a.id === '4-BEAM')).toBe(true);
      expect(accessories.some((a) => a.id === 'AC004')).toBe(false);
    });
  });

  describe('isAccessoryCompatible', () => {
    it('should correctly identify AC004 compatibility', () => {
      expect(isAccessoryCompatible('AC004', 'AUN210')).toBe(true);
      expect(isAccessoryCompatible('AC004', 'AUN250')).toBe(false);
    });

    it('should correctly identify 4-BEAM compatibility', () => {
      expect(isAccessoryCompatible('4-BEAM', 'AUN250')).toBe(true);
      expect(isAccessoryCompatible('4-BEAM', 'AUN210')).toBe(false);
    });

    it('should return true for universally compatible accessories', () => {
      // Height extensions should be compatible with both
      expect(isAccessoryCompatible('AC001-1', 'AUN210')).toBe(true);
      expect(isAccessoryCompatible('AC001-1', 'AUN250')).toBe(true);
    });
  });

  describe('getBedCategory', () => {
    it('should return short bed category', () => {
      const category = getBedCategory('short');
      expect(category).toBeDefined();
      expect(category?.name).toBeDefined();
      expect(category?.rangeInches).toBeDefined();
    });

    it('should return standard bed category', () => {
      const category = getBedCategory('standard');
      expect(category).toBeDefined();
      expect(category?.rangeInches.min).toBe(72);
    });

    it('should return long bed category', () => {
      const category = getBedCategory('long');
      expect(category).toBeDefined();
      expect(category?.rangeInches.min).toBe(96);
    });
  });

  describe('getAllBedCategories', () => {
    it('should return all bed categories', () => {
      const categories = getAllBedCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(3); // short, standard, long
    });
  });

  describe('getQuickWizardBedOptions', () => {
    it('should return options for Quick Wizard', () => {
      const options = getQuickWizardBedOptions();
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThan(0);
      // Should include unsure option
      expect(options.some((o) => o.value === 'unsure')).toBe(true);
    });
  });

  describe('getMessage', () => {
    it('should return messages by path', () => {
      const message = getMessage('cta.tryFullConfigurator');
      expect(message).toBeDefined();
      expect(typeof message).toBe('string');
    });

    it('should apply replacements', () => {
      const message = getMessage('warnings.tonneau.rollsIntoBed', { penalty: '10' });
      expect(message).toContain('10');
    });

    it('should return path when message not found', () => {
      const message = getMessage('nonexistent.path');
      expect(message).toBe('nonexistent.path');
    });
  });

  describe('getPricingConfig', () => {
    it('should return pricing configuration', () => {
      const pricing = getPricingConfig();
      expect(pricing).toBeDefined();
      expect(typeof pricing.taxRate).toBe('number');
      expect(typeof pricing.processingFeeRate).toBe('number');
      expect(typeof pricing.freeShippingThreshold).toBe('number');
    });
  });

  describe('getBulkDiscount', () => {
    it('should return 0 for quantity 1', () => {
      expect(getBulkDiscount(1)).toBe(0);
    });

    it('should return appropriate discount for larger quantities', () => {
      // Based on config, check discount tiers
      const discount2 = getBulkDiscount(2);
      const discount5 = getBulkDiscount(5);
      const discount10 = getBulkDiscount(10);

      // Higher quantities should have higher or equal discounts
      expect(discount5).toBeGreaterThanOrEqual(discount2);
      expect(discount10).toBeGreaterThanOrEqual(discount5);
    });
  });

  describe('validateConfig', () => {
    it('should validate configuration without errors', () => {
      const result = validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
