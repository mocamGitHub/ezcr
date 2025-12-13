/**
 * UFE Config Loader
 *
 * Loads and validates configuration from JSON files.
 * Provides typed access to all UFE configuration.
 */

import type {
  EngineSettings,
  RampModelConfig,
  AccessoryConfig,
  BedCategoryConfig,
  RampModelId,
  AccessoryId,
  BedCategory,
} from '../types';

// Import JSON configs
import engineSettingsJson from './engine-settings.json';
import rampModelsJson from './ramp-models.json';
import accessoriesJson from './accessories.json';
import bedCategoriesJson from './bed-categories.json';
import messagesJson from './messages.json';

// =============================================================================
// CONFIG TYPES
// =============================================================================

interface RampModelsConfig {
  models: Record<string, RampModelConfig>;
  decisionRules: Record<string, unknown>;
}

interface AccessoriesConfigFile {
  accessories: Record<string, AccessoryConfig>;
  compatibilityMatrix: Record<string, { compatible: string[]; incompatible: string[] }>;
}

interface BedCategoriesConfig {
  categories: Record<string, BedCategoryConfig>;
  quickWizardOptions: Array<{ value: string; label: string; sublabel?: string }>;
  measurementHints: Record<string, unknown>;
}

interface MessagesConfig {
  recommendations: Record<string, Record<string, string>>;
  warnings: Record<string, unknown>;
  errors: Record<string, unknown>;
  info: Record<string, unknown>;
  cta: Record<string, string>;
  labels: Record<string, string>;
}

// =============================================================================
// LOADED CONFIG (Singleton Pattern)
// =============================================================================

let loadedConfig: UFEConfig | null = null;

export interface UFEConfig {
  engineSettings: EngineSettings;
  rampModels: RampModelsConfig;
  accessories: AccessoriesConfigFile;
  bedCategories: BedCategoriesConfig;
  messages: MessagesConfig;
}

/**
 * Load all UFE configuration
 * Uses singleton pattern - configs are loaded once and cached
 */
export function loadConfig(): UFEConfig {
  if (loadedConfig) {
    return loadedConfig;
  }

  loadedConfig = {
    engineSettings: engineSettingsJson as EngineSettings,
    rampModels: rampModelsJson as unknown as RampModelsConfig,
    accessories: accessoriesJson as unknown as AccessoriesConfigFile,
    bedCategories: bedCategoriesJson as unknown as BedCategoriesConfig,
    messages: messagesJson as unknown as MessagesConfig,
  };

  return loadedConfig;
}

/**
 * Force reload configuration (useful for testing)
 */
export function reloadConfig(): UFEConfig {
  loadedConfig = null;
  return loadConfig();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get engine settings
 */
export function getEngineSettings(): EngineSettings {
  return loadConfig().engineSettings;
}

/**
 * Get ramp model by ID
 */
export function getRampModel(id: RampModelId): RampModelConfig | undefined {
  const config = loadConfig();
  return config.rampModels.models[id] as RampModelConfig | undefined;
}

/**
 * Get all active ramp models
 */
export function getActiveRampModels(): RampModelConfig[] {
  const config = loadConfig();
  return Object.values(config.rampModels.models).filter(
    (model) => (model as RampModelConfig).active
  ) as RampModelConfig[];
}

/**
 * Get accessory by ID
 */
export function getAccessory(id: AccessoryId): AccessoryConfig | undefined {
  const config = loadConfig();
  return config.accessories.accessories[id] as AccessoryConfig | undefined;
}

/**
 * Get all accessories
 */
export function getAllAccessories(): AccessoryConfig[] {
  const config = loadConfig();
  return Object.values(config.accessories.accessories) as AccessoryConfig[];
}

/**
 * Get accessories compatible with a ramp
 */
export function getCompatibleAccessories(rampId: RampModelId): AccessoryConfig[] {
  const config = loadConfig();
  const matrix = config.accessories.compatibilityMatrix[rampId];
  if (!matrix) return [];

  return matrix.compatible
    .map((id) => config.accessories.accessories[id])
    .filter(Boolean) as AccessoryConfig[];
}

/**
 * Check if accessory is compatible with ramp
 */
export function isAccessoryCompatible(accessoryId: AccessoryId, rampId: RampModelId): boolean {
  const config = loadConfig();
  const matrix = config.accessories.compatibilityMatrix[rampId];
  if (!matrix) return false;
  return matrix.compatible.includes(accessoryId);
}

/**
 * Get bed category config by ID
 */
export function getBedCategory(id: BedCategory): BedCategoryConfig | undefined {
  const config = loadConfig();
  return config.bedCategories.categories[id] as BedCategoryConfig | undefined;
}

/**
 * Get all bed categories
 */
export function getAllBedCategories(): BedCategoryConfig[] {
  const config = loadConfig();
  return Object.values(config.bedCategories.categories) as BedCategoryConfig[];
}

/**
 * Get quick wizard options for bed length
 */
export function getQuickWizardBedOptions(): Array<{ value: string; label: string; sublabel?: string }> {
  const config = loadConfig();
  return config.bedCategories.quickWizardOptions;
}

/**
 * Get message by path (e.g., 'recommendations.AUN210.primary')
 */
export function getMessage(path: string, replacements?: Record<string, string | number>): string {
  const config = loadConfig();
  const parts = path.split('.');

  let current: unknown = config.messages;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path; // Return path if message not found
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  // Apply replacements
  let message = current;
  if (replacements) {
    for (const [key, value] of Object.entries(replacements)) {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }

  return message;
}

/**
 * Get pricing configuration
 */
export function getPricingConfig() {
  const config = loadConfig();
  return config.engineSettings.pricing;
}

/**
 * Get bulk discount percentage for quantity
 */
export function getBulkDiscount(quantity: number): number {
  const config = loadConfig();
  const discounts = config.engineSettings.bulkDiscounts;

  // Sort descending by minQuantity and find first matching
  const sorted = [...discounts].sort((a, b) => b.minQuantity - a.minQuantity);
  const applicable = sorted.find((d) => quantity >= d.minQuantity);

  return applicable?.discountPercent ?? 0;
}

/**
 * Validate that all required config fields are present
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = loadConfig();

  // Validate engine settings
  if (!config.engineSettings.version) {
    errors.push('Engine settings missing version');
  }
  if (typeof config.engineSettings.tonneauPenaltyInches !== 'number') {
    errors.push('Engine settings missing tonneauPenaltyInches');
  }
  if (typeof config.engineSettings.beamExtensionThresholdInches !== 'number') {
    errors.push('Engine settings missing beamExtensionThresholdInches');
  }
  if (typeof config.engineSettings.tailgateCloseBufferInches !== 'number') {
    errors.push('Engine settings missing tailgateCloseBufferInches');
  }

  // Validate ramp models
  const rampModels = Object.keys(config.rampModels.models);
  if (rampModels.length === 0) {
    errors.push('No ramp models defined');
  }
  for (const modelId of rampModels) {
    const model = config.rampModels.models[modelId];
    if (!model.name || typeof model.price !== 'number') {
      errors.push(`Ramp model ${modelId} missing required fields`);
    }
  }

  // Validate accessories
  const accessories = Object.keys(config.accessories.accessories);
  if (accessories.length === 0) {
    errors.push('No accessories defined');
  }

  // Validate bed categories
  const categories = Object.keys(config.bedCategories.categories);
  if (categories.length === 0) {
    errors.push('No bed categories defined');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  engineSettingsJson,
  rampModelsJson,
  accessoriesJson,
  bedCategoriesJson,
  messagesJson,
};
