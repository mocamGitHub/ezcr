/**
 * Database-driven configurator settings
 * This module provides runtime access to configurator settings stored in the database
 * Replaces hardcoded values from src/types/configurator-v2.ts
 */

import type { ConfiguratorSettings } from '@/hooks/useConfiguratorSettings'

/**
 * Runtime configurator settings cache
 * This will be populated from the database via the useConfiguratorSettings hook
 */
let cachedSettings: ConfiguratorSettings | null = null

/**
 * Set the configurator settings cache
 * Called by components that fetch settings from the API
 */
export function setConfiguratorSettings(settings: ConfiguratorSettings) {
  cachedSettings = settings
}

/**
 * Get cached configurator settings
 * Returns null if settings haven't been loaded yet
 */
export function getConfiguratorSettings(): ConfiguratorSettings | null {
  return cachedSettings
}

/**
 * Get measurement ranges from cache or fallback to defaults
 */
export function getMeasurementRanges() {
  if (cachedSettings?.measurementRanges) {
    return {
      cargoMin: cachedSettings.measurementRanges.cargo_min,
      cargoMax: cachedSettings.measurementRanges.cargo_max,
      totalLengthMin: cachedSettings.measurementRanges.total_length_min,
      totalLengthMax: cachedSettings.measurementRanges.total_length_max,
      heightMax: cachedSettings.measurementRanges.height_max,
      cargoExtensionThreshold: cachedSettings.measurementRanges.cargo_extension_threshold,
      ac001Ranges: {
        'AC001-1': {
          min: cachedSettings.measurementRanges.ac001_1_min,
          max: cachedSettings.measurementRanges.ac001_1_max,
        },
        'AC001-2': {
          min: cachedSettings.measurementRanges.ac001_2_min,
          max: cachedSettings.measurementRanges.ac001_2_max,
        },
        'AC001-3': {
          min: cachedSettings.measurementRanges.ac001_3_min,
          max: cachedSettings.measurementRanges.ac001_3_max,
        },
      },
    }
  }

  // Fallback to defaults if not loaded
  return {
    cargoMin: 53.149,
    cargoMax: 98.426,
    totalLengthMin: 68,
    totalLengthMax: 98.426,
    heightMax: 60,
    cargoExtensionThreshold: 80,
    ac001Ranges: {
      'AC001-1': { min: 35, max: 42 },
      'AC001-2': { min: 43, max: 51 },
      'AC001-3': { min: 52, max: 60 },
    },
  }
}

/**
 * Get pricing from cache or fallback to defaults
 */
export function getPricing() {
  if (cachedSettings?.pricing) {
    return {
      models: Object.fromEntries(
        Object.entries(cachedSettings.pricing.models).map(([key, item]) => [
          key,
          item.price,
        ])
      ),
      extensions: Object.fromEntries(
        Object.entries(cachedSettings.pricing.extensions).map(([key, item]) => [
          key,
          item.price,
        ])
      ),
      delivery: Object.fromEntries(
        Object.entries(cachedSettings.pricing.delivery).map(([key, item]) => [
          key,
          item.price,
        ])
      ),
      services: Object.fromEntries(
        Object.entries(cachedSettings.pricing.services).map(([key, item]) => [
          key,
          item.price,
        ])
      ),
      boltlessKit: Object.fromEntries(
        Object.entries(cachedSettings.pricing.boltless_kit).map(([key, item]) => [
          key,
          item.price,
        ])
      ),
      tiedown: Object.fromEntries(
        Object.entries(cachedSettings.pricing.tiedown).map(([key, item]) => [
          key,
          item.price,
        ])
      ),
    }
  }

  // Fallback to defaults
  return {
    models: { AUN250: 1299.0, AUN210: 999.0 },
    extensions: { 'no-ext': 0, ext1: 149.0, ext2: 249.0, ext3: 349.0 },
    delivery: { pickup: 0, ship: 185.0 },
    services: { 'not-assembled': 0, assembly: 99.0, demo: 149.0 },
    boltlessKit: { 'no-kit': 0, kit: 89.0 },
    tiedown: {
      'no-tiedown': 0,
      'turnbuckle-1': 89.0,
      'turnbuckle-2': 159.0,
      straps: 29.0,
    },
  }
}

/**
 * Get product names from cache or fallback to defaults
 */
export function getProductNames() {
  if (cachedSettings?.pricing) {
    return {
      models: Object.fromEntries(
        Object.entries(cachedSettings.pricing.models).map(([key, item]) => [
          key,
          item.name,
        ])
      ),
      extensions: Object.fromEntries(
        Object.entries(cachedSettings.pricing.extensions).map(([key, item]) => [
          key,
          item.name,
        ])
      ),
      delivery: Object.fromEntries(
        Object.entries(cachedSettings.pricing.delivery).map(([key, item]) => [
          key,
          item.name,
        ])
      ),
      services: Object.fromEntries(
        Object.entries(cachedSettings.pricing.services).map(([key, item]) => [
          key,
          item.name,
        ])
      ),
      boltlessKit: Object.fromEntries(
        Object.entries(cachedSettings.pricing.boltless_kit).map(([key, item]) => [
          key,
          item.name,
        ])
      ),
      tiedown: Object.fromEntries(
        Object.entries(cachedSettings.pricing.tiedown).map(([key, item]) => [
          key,
          item.name,
        ])
      ),
    }
  }

  // Fallback to defaults
  return {
    models: { AUN250: 'AUN250', AUN210: 'AUN210' },
    extensions: {
      'no-ext': 'No Extension',
      ext1: 'Extension 1 (12")',
      ext2: 'Extension 2 (24")',
      ext3: 'Extension 3 (36")',
    },
    delivery: { pickup: 'Pickup', ship: 'Ship' },
    services: {
      'not-assembled': 'Not Assembled',
      assembly: 'Assembly Service',
      demo: 'Demo (includes assembly)',
    },
    boltlessKit: {
      'no-kit': 'No Boltless Tiedown Kit',
      kit: 'Boltless Tiedown Kit',
    },
    tiedown: {
      'no-tiedown': 'No Tiedown Accessory',
      'turnbuckle-1': 'Turnbuckles (1 pair)',
      'turnbuckle-2': 'Turnbuckles (2 pairs)',
      straps: 'Tiedown Straps',
    },
  }
}

/**
 * Get fees from cache or fallback to defaults
 */
export function getFees() {
  if (cachedSettings?.settings?.fees) {
    return {
      salesTaxRate: cachedSettings.settings.fees.sales_tax_rate,
      processingFeeRate: cachedSettings.settings.fees.processing_fee_rate,
    }
  }

  // Fallback to defaults
  return {
    salesTaxRate: 0.089,
    processingFeeRate: 0.03,
  }
}

/**
 * Get contact info from cache or fallback to defaults
 */
export function getContact() {
  if (cachedSettings?.settings?.contact) {
    return cachedSettings.settings.contact
  }

  // Fallback to defaults
  return {
    phone: '800-687-4410',
    supportUrl: '/support',
    exitUrl: '/',
  }
}

/**
 * Get conversion factors from cache or fallback to defaults
 */
export function getConversionFactors() {
  if (cachedSettings?.settings?.conversion_factors) {
    return {
      inchesToCm: cachedSettings.settings.conversion_factors.inches_to_cm,
      lbsToKg: cachedSettings.settings.conversion_factors.lbs_to_kg,
    }
  }

  // Fallback to defaults
  return {
    inchesToCm: 2.54,
    lbsToKg: 0.453592,
  }
}
