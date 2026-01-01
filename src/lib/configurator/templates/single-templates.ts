// Single Rule Templates
// Pre-configured templates for common configurator rules

import type { RuleTemplate } from './types'

// =============================================================================
// HEIGHT EXTENSION TEMPLATES (AC001)
// =============================================================================

export const HEIGHT_12_INCH: RuleTemplate = {
  id: 'height-12in',
  name: '12" Height Extension (Low Profile)',
  description: 'Recommend 12" extension for low-height loads (under 35 inches)',
  category: 'height-extensions',
  ruleType: 'AC001',
  condition: { height_min: 0, height_max: 35 },
  action: { variant: '12in', sku: 'AC001-1' },
  message: 'Based on your load height, the 12" extension provides optimal clearance.',
  priority: 1,
  variables: [],
  tags: ['ac001', 'extension', 'height', '12in', 'low-profile'],
}

export const HEIGHT_24_INCH: RuleTemplate = {
  id: 'height-24in',
  name: '24" Height Extension (Standard)',
  description: 'Recommend 24" extension for medium-height loads (35-50 inches)',
  category: 'height-extensions',
  ruleType: 'AC001',
  condition: { height_min: 35, height_max: 50 },
  action: { variant: '24in', sku: 'AC001-2' },
  message: 'The 24" extension is recommended for loads 35-50 inches in height.',
  priority: 1,
  variables: [],
  tags: ['ac001', 'extension', 'height', '24in', 'standard'],
}

export const HEIGHT_36_INCH: RuleTemplate = {
  id: 'height-36in',
  name: '36" Height Extension (Tall)',
  description: 'Recommend 36" extension for tall loads (over 50 inches)',
  category: 'height-extensions',
  ruleType: 'AC001',
  condition: { height_min: 50, height_max: 999 },
  action: { variant: '36in', sku: 'AC001-3' },
  message: 'For tall loads over 50", the 36" extension provides maximum clearance.',
  priority: 1,
  variables: [],
  tags: ['ac001', 'extension', 'height', '36in', 'tall'],
}

export const HEIGHT_CUSTOM_RANGE: RuleTemplate = {
  id: 'height-custom',
  name: 'Custom Height Range',
  description: 'Define your own height range for extension recommendation',
  category: 'height-extensions',
  ruleType: 'AC001',
  condition: { height_min: '{{minHeight}}', height_max: '{{maxHeight}}' },
  action: { variant: '{{variant}}', sku: '{{sku}}' },
  message: 'Based on your load height of {{minHeight}}-{{maxHeight}} inches, the {{variant}} extension is recommended.',
  priority: 1,
  variables: [
    { name: 'minHeight', label: 'Minimum Height (inches)', type: 'number', required: true, default: 0, validation: { min: 0, max: 100 } },
    { name: 'maxHeight', label: 'Maximum Height (inches)', type: 'number', required: true, default: 35, validation: { min: 1, max: 100 } },
    { name: 'variant', label: 'Extension Variant', type: 'select', required: true, options: [
      { value: '12in', label: '12" Extension (AC001-1)' },
      { value: '24in', label: '24" Extension (AC001-2)' },
      { value: '36in', label: '36" Extension (AC001-3)' },
    ]},
    { name: 'sku', label: 'Product SKU', type: 'string', required: true, default: 'AC001-1' },
  ],
  tags: ['ac001', 'extension', 'height', 'custom'],
}

// =============================================================================
// CARGO EXTENSION TEMPLATES (AC003)
// =============================================================================

export const CARGO_LONG_BED: RuleTemplate = {
  id: 'cargo-long-bed',
  name: 'Cargo Extension for Long Bed',
  description: 'Require cargo extension for trucks with 8ft+ beds',
  category: 'cargo-extensions',
  ruleType: 'AC003',
  condition: { cargo_length_min: 96 },
  action: { required: true, sku: 'AC003' },
  message: 'Long bed trucks (8ft+) require the cargo extension for proper fit.',
  priority: 1,
  variables: [],
  tags: ['ac003', 'cargo', 'long-bed', 'extension'],
}

export const CARGO_OPTIONAL: RuleTemplate = {
  id: 'cargo-optional',
  name: 'Optional Cargo Extension',
  description: 'Recommend (but not require) cargo extension based on length',
  category: 'cargo-extensions',
  ruleType: 'AC003',
  condition: { cargo_length_min: '{{minLength}}' },
  action: { required: false, recommend: true, sku: 'AC003' },
  message: 'The cargo extension is recommended for additional cargo space.',
  priority: 2,
  variables: [
    { name: 'minLength', label: 'Minimum Cargo Length (inches)', type: 'number', required: true, default: 72, validation: { min: 48, max: 120 } },
  ],
  tags: ['ac003', 'cargo', 'optional', 'extension'],
}

// =============================================================================
// MODEL SELECTION TEMPLATES (AUN250, AUN210)
// =============================================================================

export const MODEL_AUN250_LONG_BED: RuleTemplate = {
  id: 'model-aun250-long-bed',
  name: 'AUN250 for Long Bed Trucks',
  description: 'Recommend premium AUN250 ramp for long bed trucks',
  category: 'model-selection',
  ruleType: 'AUN250',
  condition: { bed_length_min: 80, cargo_length_min: 72 },
  action: { compatible_with: ['AC003', 'AC004'], requires: [] },
  message: 'The AUN250 is ideal for long bed trucks with its extended design.',
  priority: 1,
  variables: [],
  tags: ['aun250', 'model', 'long-bed', 'premium'],
}

export const MODEL_AUN210_SHORT_BED: RuleTemplate = {
  id: 'model-aun210-short-bed',
  name: 'AUN210 for Short/Standard Beds',
  description: 'Recommend standard AUN210 ramp for short/standard bed trucks',
  category: 'model-selection',
  ruleType: 'AUN210',
  condition: { bed_length_min: 60, bed_length_max: 80 },
  action: { compatible_with: ['AC001'], incompatible_with: ['AC004'] },
  message: 'The AUN210 is perfectly sized for short to standard bed trucks.',
  priority: 1,
  variables: [],
  tags: ['aun210', 'model', 'short-bed', 'standard'],
}

// =============================================================================
// TIEDOWN TEMPLATES (TURNBUCKLE, STRAPS, BOLTLESS_KIT)
// =============================================================================

export const TIEDOWN_HEAVY_MOTORCYCLE: RuleTemplate = {
  id: 'tiedown-heavy',
  name: 'Turnbuckles for Heavy Motorcycles',
  description: 'Require turnbuckle tiedowns for motorcycles over 600 lbs',
  category: 'tiedowns',
  ruleType: 'TURNBUCKLE',
  condition: { weight_min: 600, weight_max: 999 },
  action: { quantity: 2, sku: 'TURNBUCKLE-2' },
  message: 'Heavy motorcycles (600+ lbs) require 2 pairs of turnbuckle tiedowns for secure transport.',
  priority: 1,
  variables: [],
  tags: ['turnbuckle', 'tiedown', 'heavy', 'motorcycle'],
}

export const TIEDOWN_MEDIUM_MOTORCYCLE: RuleTemplate = {
  id: 'tiedown-medium',
  name: 'Tiedowns for Medium Motorcycles',
  description: 'Recommend 1 pair of turnbuckles for medium-weight motorcycles',
  category: 'tiedowns',
  ruleType: 'TURNBUCKLE',
  condition: { weight_min: 400, weight_max: 600 },
  action: { quantity: 1, sku: 'TURNBUCKLE-1' },
  message: 'For motorcycles 400-600 lbs, 1 pair of turnbuckle tiedowns is recommended.',
  priority: 1,
  variables: [],
  tags: ['turnbuckle', 'tiedown', 'medium', 'motorcycle'],
}

export const TIEDOWN_STRAPS_LIGHT: RuleTemplate = {
  id: 'tiedown-straps-light',
  name: 'Straps for Light Loads',
  description: 'Standard straps sufficient for lighter motorcycles',
  category: 'tiedowns',
  ruleType: 'STRAPS',
  condition: { weight_max: 400 },
  action: { quantity: 4, sku: 'STRAPS-4' },
  message: 'Standard tiedown straps are sufficient for motorcycles under 400 lbs.',
  priority: 1,
  variables: [],
  tags: ['straps', 'tiedown', 'light', 'motorcycle'],
}

export const BOLTLESS_KIT_NO_DRILL: RuleTemplate = {
  id: 'boltless-no-drill',
  name: 'Boltless Kit for No-Drill Install',
  description: 'Recommend boltless kit when customer prefers no drilling',
  category: 'tiedowns',
  ruleType: 'BOLTLESS_KIT',
  condition: { install_type: 'no_drill' },
  action: { required: false, recommend: true },
  message: 'The Boltless Tiedown Kit allows secure mounting without drilling into your truck bed.',
  priority: 1,
  variables: [],
  tags: ['boltless', 'tiedown', 'no-drill', 'kit'],
}

// =============================================================================
// SERVICE TEMPLATES (ASSEMBLY, DEMO)
// =============================================================================

export const ASSEMBLY_BEGINNER: RuleTemplate = {
  id: 'assembly-beginner',
  name: 'Assembly Service for Beginners',
  description: 'Recommend professional assembly for inexperienced customers',
  category: 'services',
  ruleType: 'ASSEMBLY',
  condition: { experience: 'beginner' },
  action: { recommend: true, price: 149 },
  message: 'Professional assembly is recommended for first-time ramp owners.',
  priority: 1,
  variables: [],
  tags: ['assembly', 'service', 'beginner', 'professional'],
}

export const DEMO_WITH_INSTRUCTION: RuleTemplate = {
  id: 'demo-instruction',
  name: 'Demo Service with Instruction',
  description: 'In-person demonstration and assembly (pickup orders only)',
  category: 'services',
  ruleType: 'DEMO',
  condition: { wants_instruction: true },
  action: { requires_pickup: true, price: 199 },
  message: 'Our demo service includes in-person instruction and professional assembly. Available for pickup orders only.',
  priority: 1,
  variables: [],
  tags: ['demo', 'service', 'instruction', 'pickup'],
}

// =============================================================================
// DELIVERY TEMPLATES (SHIPPING, PICKUP)
// =============================================================================

export const SHIPPING_LONG_DISTANCE: RuleTemplate = {
  id: 'shipping-long-distance',
  name: 'Freight Shipping (Long Distance)',
  description: 'Use freight shipping for orders over 500 miles',
  category: 'delivery',
  ruleType: 'SHIPPING',
  condition: { distance_min: 500 },
  action: { carrier: 'tforce', base_price: 299 },
  message: 'Orders over 500 miles ship via TForce Freight.',
  priority: 1,
  variables: [],
  tags: ['shipping', 'freight', 'tforce', 'long-distance'],
}

export const PICKUP_LOCAL: RuleTemplate = {
  id: 'pickup-local',
  name: 'Local Pickup Option',
  description: 'Offer pickup discount for local customers',
  category: 'delivery',
  ruleType: 'PICKUP',
  condition: { zip_code_pattern: '{{zipPattern}}' },
  action: { location: '{{location}}', discount: '{{discount}}' },
  message: 'Local pickup available at {{location}} with ${{discount}} discount.',
  priority: 1,
  variables: [
    { name: 'zipPattern', label: 'ZIP Code Pattern (e.g., 90*)', type: 'string', required: true, helpText: 'Use * for wildcards' },
    { name: 'location', label: 'Pickup Location Name', type: 'string', required: true, default: 'Main Warehouse' },
    { name: 'discount', label: 'Pickup Discount ($)', type: 'number', required: true, default: 100, validation: { min: 0, max: 500 } },
  ],
  tags: ['pickup', 'local', 'discount', 'delivery'],
}

// =============================================================================
// COMBINATION TEMPLATES (AND/OR Logic)
// =============================================================================

export const COMBO_HEAVY_AND_LONG_BED: RuleTemplate = {
  id: 'combo-heavy-long-bed',
  name: 'Heavy Motorcycle + Long Bed',
  description: 'Recommend extra tiedowns when heavy motorcycle in long bed truck',
  category: 'combinations',
  ruleType: 'TURNBUCKLE',
  condition: {
    $and: [
      { weight_min: 600 },
      { bed_length_min: 80 },
    ],
  },
  action: { quantity: 2, recommend_boltless: true, sku: 'TURNBUCKLE-2' },
  message: 'For heavy motorcycles in long bed trucks, we recommend 2 pairs of turnbuckles plus the Boltless Kit.',
  priority: 0, // High priority for combo rules
  variables: [],
  tags: ['combo', 'and', 'heavy', 'long-bed', 'turnbuckle'],
  isCombo: true,
}

export const COMBO_BEGINNER_OR_EXPENSIVE: RuleTemplate = {
  id: 'combo-beginner-or-premium',
  name: 'Assembly for Beginners or Premium Orders',
  description: 'Recommend assembly for beginners OR orders over $2000',
  category: 'combinations',
  ruleType: 'ASSEMBLY',
  condition: {
    $or: [
      { experience: 'beginner' },
      { order_total_min: 2000 },
    ],
  },
  action: { recommend: true, discount: 50 },
  message: 'Assembly service recommended - includes $50 discount for qualifying orders.',
  priority: 0,
  variables: [],
  tags: ['combo', 'or', 'assembly', 'beginner', 'premium'],
  isCombo: true,
}

export const COMBO_AUN250_AND_HEAVY: RuleTemplate = {
  id: 'combo-aun250-heavy',
  name: 'AUN250 + Heavy Load = 4-Beam Required',
  description: 'Require 4-beam extension for heavy loads on AUN250',
  category: 'combinations',
  ruleType: 'AC004',
  condition: {
    $and: [
      { model: 'AUN250' },
      { weight_min: 700 },
    ],
  },
  action: { required: true, sku: 'AC004' },
  message: 'Heavy loads (700+ lbs) on the AUN250 require the 4-beam extension for additional support.',
  priority: 0,
  variables: [],
  tags: ['combo', 'and', 'ac004', '4-beam', 'aun250', 'heavy'],
  isCombo: true,
}

export const COMBO_NOT_AUN210_FOR_HEAVY: RuleTemplate = {
  id: 'combo-not-aun210-heavy',
  name: 'Block AUN210 for Heavy Loads',
  description: 'Prevent AUN210 selection for motorcycles over 650 lbs',
  category: 'combinations',
  ruleType: 'AUN210',
  condition: {
    $not: { weight_max: 650 },
  },
  action: { block: true, suggest: 'AUN250', reason: 'weight_exceeded' },
  message: 'The AUN210 is not recommended for loads over 650 lbs. Please consider the AUN250.',
  priority: 0,
  variables: [],
  tags: ['combo', 'not', 'aun210', 'heavy', 'block'],
  isCombo: true,
}

// =============================================================================
// ALL TEMPLATES EXPORT
// =============================================================================

export const SINGLE_TEMPLATES: RuleTemplate[] = [
  // Height Extensions
  HEIGHT_12_INCH,
  HEIGHT_24_INCH,
  HEIGHT_36_INCH,
  HEIGHT_CUSTOM_RANGE,
  // Cargo Extensions
  CARGO_LONG_BED,
  CARGO_OPTIONAL,
  // Model Selection
  MODEL_AUN250_LONG_BED,
  MODEL_AUN210_SHORT_BED,
  // Tiedowns
  TIEDOWN_HEAVY_MOTORCYCLE,
  TIEDOWN_MEDIUM_MOTORCYCLE,
  TIEDOWN_STRAPS_LIGHT,
  BOLTLESS_KIT_NO_DRILL,
  // Services
  ASSEMBLY_BEGINNER,
  DEMO_WITH_INSTRUCTION,
  // Delivery
  SHIPPING_LONG_DISTANCE,
  PICKUP_LOCAL,
  // Combinations
  COMBO_HEAVY_AND_LONG_BED,
  COMBO_BEGINNER_OR_EXPENSIVE,
  COMBO_AUN250_AND_HEAVY,
  COMBO_NOT_AUN210_FOR_HEAVY,
]

// Templates grouped by category for UI
export const TEMPLATES_BY_CATEGORY: Record<string, RuleTemplate[]> = {
  'height-extensions': [HEIGHT_12_INCH, HEIGHT_24_INCH, HEIGHT_36_INCH, HEIGHT_CUSTOM_RANGE],
  'cargo-extensions': [CARGO_LONG_BED, CARGO_OPTIONAL],
  'model-selection': [MODEL_AUN250_LONG_BED, MODEL_AUN210_SHORT_BED],
  'tiedowns': [TIEDOWN_HEAVY_MOTORCYCLE, TIEDOWN_MEDIUM_MOTORCYCLE, TIEDOWN_STRAPS_LIGHT, BOLTLESS_KIT_NO_DRILL],
  'services': [ASSEMBLY_BEGINNER, DEMO_WITH_INSTRUCTION],
  'delivery': [SHIPPING_LONG_DISTANCE, PICKUP_LOCAL],
  'combinations': [COMBO_HEAVY_AND_LONG_BED, COMBO_BEGINNER_OR_EXPENSIVE, COMBO_AUN250_AND_HEAVY, COMBO_NOT_AUN210_FOR_HEAVY],
}

// Category display names
export const CATEGORY_LABELS: Record<string, string> = {
  'height-extensions': 'Height Extensions',
  'cargo-extensions': 'Cargo Extensions',
  'model-selection': 'Model Selection',
  'tiedowns': 'Tiedowns',
  'services': 'Services',
  'delivery': 'Delivery',
  'combinations': 'Combinations (AND/OR)',
  'packs': 'Template Packs',
}
