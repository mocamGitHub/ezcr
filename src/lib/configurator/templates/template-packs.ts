// Template Packs
// Bundles that create multiple related rules at once

import type { TemplatePack } from './types'

// =============================================================================
// HEAVY CRUISER BUNDLE
// =============================================================================

export const HEAVY_CRUISER_BUNDLE: TemplatePack = {
  id: 'heavy-cruiser-bundle',
  name: 'Heavy Cruiser Complete Bundle',
  description: 'Complete rule set for heavy cruiser motorcycles (600-900 lbs). Creates tiedown, model, and boltless kit rules.',
  category: 'packs',
  sharedVariables: [
    {
      name: 'weightMin',
      label: 'Minimum Weight (lbs)',
      type: 'number',
      required: true,
      default: 600,
      validation: { min: 400, max: 1000 },
      helpText: 'Motorcycles at or above this weight trigger the rules',
    },
    {
      name: 'weightMax',
      label: 'Maximum Weight (lbs)',
      type: 'number',
      required: true,
      default: 900,
      validation: { min: 500, max: 1200 },
      helpText: 'Upper weight limit for these rules',
    },
  ],
  templates: [
    {
      id: 'hc-tiedown',
      name: 'Heavy Cruiser Tiedowns',
      description: 'Require 2 pairs of turnbuckles for heavy motorcycles',
      ruleType: 'TURNBUCKLE',
      condition: { weight_min: '{{weightMin}}', weight_max: '{{weightMax}}' },
      action: { quantity: 2, required: true, sku: 'TURNBUCKLE-2' },
      message: 'For motorcycles {{weightMin}}-{{weightMax}} lbs, 2 pairs of turnbuckle tiedowns are required for safe transport.',
      priority: 1,
      variables: [],
    },
    {
      id: 'hc-boltless',
      name: 'Heavy Cruiser Boltless Kit',
      description: 'Recommend boltless kit for heavy loads',
      ruleType: 'BOLTLESS_KIT',
      condition: { weight_min: '{{weightMin}}' },
      action: { recommend: true, reason: 'heavy_load' },
      message: 'The Boltless Tiedown Kit is highly recommended for secure mounting of heavy motorcycles.',
      priority: 2,
      variables: [],
    },
    {
      id: 'hc-model',
      name: 'Heavy Cruiser Model Recommendation',
      description: 'Recommend AUN250 for heavy loads',
      ruleType: 'AUN250',
      condition: { weight_min: '{{weightMin}}' },
      action: { recommended: true, reason: 'heavy_load_capacity', compatible_with: ['AC004'], requires: [] },
      message: 'The AUN250 is recommended for heavy motorcycles due to its superior load capacity.',
      priority: 1,
      variables: [],
    },
  ],
  preview: 'Creates 3 rules: Turnbuckle requirement, Boltless Kit recommendation, AUN250 model recommendation',
  tags: ['heavy', 'cruiser', 'bundle', 'complete', 'tiedown', 'model'],
}

// =============================================================================
// LONG BED SETUP BUNDLE
// =============================================================================

export const LONG_BED_SETUP_BUNDLE: TemplatePack = {
  id: 'long-bed-setup',
  name: 'Long Bed Truck Setup',
  description: 'Complete rules for long bed trucks (8ft+). Includes cargo extension, 4-beam support, and shipping options.',
  category: 'packs',
  sharedVariables: [
    {
      name: 'bedLengthMin',
      label: 'Minimum Bed Length (inches)',
      type: 'number',
      required: true,
      default: 96,
      validation: { min: 72, max: 120 },
      helpText: 'Trucks with beds at or above this length',
    },
  ],
  templates: [
    {
      id: 'lb-cargo',
      name: 'Long Bed Cargo Extension',
      description: 'Require cargo extension for long bed trucks',
      ruleType: 'AC003',
      condition: { cargo_length_min: '{{bedLengthMin}}' },
      action: { required: true, sku: 'AC003' },
      message: 'Long bed trucks ({{bedLengthMin}}"+ ) require the cargo extension for proper ramp fit.',
      priority: 1,
      variables: [],
    },
    {
      id: 'lb-4beam',
      name: 'Long Bed 4-Beam Extension',
      description: 'Recommend 4-beam extension for long bed with AUN250',
      ruleType: 'AC004',
      condition: {
        $and: [
          { model: 'AUN250' },
          { bed_length_min: '{{bedLengthMin}}' },
        ],
      },
      action: { recommend: true, sku: 'AC004' },
      message: 'The 4-beam extension provides additional support for AUN250 in long bed trucks.',
      priority: 2,
      variables: [],
    },
    {
      id: 'lb-model',
      name: 'Long Bed Model Selection',
      description: 'Recommend AUN250 for long bed trucks',
      ruleType: 'AUN250',
      condition: { bed_length_min: '{{bedLengthMin}}', cargo_length_min: 72 },
      action: { compatible_with: ['AC003', 'AC004'], requires: [] },
      message: 'The AUN250 is ideal for long bed trucks, supporting cargo and 4-beam extensions.',
      priority: 1,
      variables: [],
    },
  ],
  preview: 'Creates 3 rules: Cargo extension requirement, 4-beam recommendation, AUN250 model selection',
  tags: ['long-bed', 'truck', 'cargo', '4-beam', 'aun250'],
}

// =============================================================================
// BEGINNER PACKAGE BUNDLE
// =============================================================================

export const BEGINNER_PACKAGE_BUNDLE: TemplatePack = {
  id: 'beginner-package',
  name: 'Beginner-Friendly Package',
  description: 'Rules for first-time ramp owners. Recommends assembly service, demo, and easier installation options.',
  category: 'packs',
  sharedVariables: [
    {
      name: 'assemblyPrice',
      label: 'Assembly Service Price ($)',
      type: 'number',
      required: true,
      default: 149,
      validation: { min: 0, max: 500 },
    },
    {
      name: 'demoPrice',
      label: 'Demo Service Price ($)',
      type: 'number',
      required: true,
      default: 199,
      validation: { min: 0, max: 500 },
    },
  ],
  templates: [
    {
      id: 'bp-assembly',
      name: 'Beginner Assembly Service',
      description: 'Recommend professional assembly for beginners',
      ruleType: 'ASSEMBLY',
      condition: { experience: 'beginner' },
      action: { recommend: true, price: '{{assemblyPrice}}' },
      message: 'As a first-time ramp owner, we recommend our professional assembly service (${{assemblyPrice}}).',
      priority: 1,
      variables: [],
    },
    {
      id: 'bp-demo',
      name: 'Beginner Demo Service',
      description: 'Offer demo service for hands-on instruction',
      ruleType: 'DEMO',
      condition: { experience: 'beginner', wants_instruction: true },
      action: { requires_pickup: true, price: '{{demoPrice}}' },
      message: 'Our demo service (${{demoPrice}}) includes hands-on instruction. Available for pickup orders.',
      priority: 1,
      variables: [],
    },
    {
      id: 'bp-boltless',
      name: 'Beginner Boltless Kit',
      description: 'Recommend boltless kit for easy installation',
      ruleType: 'BOLTLESS_KIT',
      condition: { experience: 'beginner' },
      action: { recommend: true, reason: 'easy_install' },
      message: 'The Boltless Kit allows easy installation without drilling - perfect for first-time owners.',
      priority: 2,
      variables: [],
    },
  ],
  preview: 'Creates 3 rules: Assembly service, Demo service, Boltless Kit recommendation',
  tags: ['beginner', 'new-owner', 'assembly', 'demo', 'easy-install'],
}

// =============================================================================
// HEIGHT EXTENSIONS COMPLETE
// =============================================================================

export const HEIGHT_EXTENSIONS_COMPLETE: TemplatePack = {
  id: 'height-extensions-complete',
  name: 'Complete Height Extension Rules',
  description: 'Full coverage of height-based extension recommendations (12", 24", 36").',
  category: 'packs',
  sharedVariables: [],
  templates: [
    {
      id: 'he-12in',
      name: '12" Extension (Low Profile)',
      description: 'For loads under 35 inches',
      ruleType: 'AC001',
      condition: { height_min: 0, height_max: 35 },
      action: { variant: '12in', sku: 'AC001-1' },
      message: 'Based on your load height, the 12" extension provides optimal clearance.',
      priority: 1,
      variables: [],
    },
    {
      id: 'he-24in',
      name: '24" Extension (Standard)',
      description: 'For loads 35-50 inches',
      ruleType: 'AC001',
      condition: { height_min: 35, height_max: 50 },
      action: { variant: '24in', sku: 'AC001-2' },
      message: 'The 24" extension is recommended for loads 35-50 inches in height.',
      priority: 1,
      variables: [],
    },
    {
      id: 'he-36in',
      name: '36" Extension (Tall)',
      description: 'For loads over 50 inches',
      ruleType: 'AC001',
      condition: { height_min: 50, height_max: 999 },
      action: { variant: '36in', sku: 'AC001-3' },
      message: 'For tall loads over 50", the 36" extension provides maximum clearance.',
      priority: 1,
      variables: [],
    },
  ],
  preview: 'Creates 3 rules covering all height ranges: 0-35" (12in), 35-50" (24in), 50"+ (36in)',
  tags: ['height', 'extension', 'ac001', 'complete', 'coverage'],
}

// =============================================================================
// TIEDOWN WEIGHT COVERAGE
// =============================================================================

export const TIEDOWN_WEIGHT_COVERAGE: TemplatePack = {
  id: 'tiedown-weight-coverage',
  name: 'Complete Tiedown Weight Coverage',
  description: 'Full tiedown rules based on motorcycle weight ranges (light, medium, heavy).',
  category: 'packs',
  sharedVariables: [
    {
      name: 'lightMax',
      label: 'Light Weight Max (lbs)',
      type: 'number',
      required: true,
      default: 400,
      validation: { min: 200, max: 500 },
    },
    {
      name: 'mediumMin',
      label: 'Medium Weight Min (lbs)',
      type: 'number',
      required: true,
      default: 400,
      validation: { min: 300, max: 600 },
    },
    {
      name: 'mediumMax',
      label: 'Medium Weight Max (lbs)',
      type: 'number',
      required: true,
      default: 600,
      validation: { min: 400, max: 700 },
    },
    {
      name: 'heavyMin',
      label: 'Heavy Weight Min (lbs)',
      type: 'number',
      required: true,
      default: 600,
      validation: { min: 500, max: 800 },
    },
  ],
  templates: [
    {
      id: 'tw-light',
      name: 'Light Motorcycle Straps',
      description: 'Standard straps for light motorcycles',
      ruleType: 'STRAPS',
      condition: { weight_max: '{{lightMax}}' },
      action: { quantity: 4, sku: 'STRAPS-4' },
      message: 'Standard tiedown straps are sufficient for motorcycles under {{lightMax}} lbs.',
      priority: 1,
      variables: [],
    },
    {
      id: 'tw-medium',
      name: 'Medium Motorcycle Turnbuckles',
      description: '1 pair of turnbuckles for medium-weight motorcycles',
      ruleType: 'TURNBUCKLE',
      condition: { weight_min: '{{mediumMin}}', weight_max: '{{mediumMax}}' },
      action: { quantity: 1, sku: 'TURNBUCKLE-1' },
      message: 'For motorcycles {{mediumMin}}-{{mediumMax}} lbs, 1 pair of turnbuckle tiedowns is recommended.',
      priority: 1,
      variables: [],
    },
    {
      id: 'tw-heavy',
      name: 'Heavy Motorcycle Turnbuckles',
      description: '2 pairs of turnbuckles for heavy motorcycles',
      ruleType: 'TURNBUCKLE',
      condition: { weight_min: '{{heavyMin}}', weight_max: 999 },
      action: { quantity: 2, required: true, sku: 'TURNBUCKLE-2' },
      message: 'Heavy motorcycles ({{heavyMin}}+ lbs) require 2 pairs of turnbuckle tiedowns.',
      priority: 1,
      variables: [],
    },
  ],
  preview: 'Creates 3 rules: Light (straps), Medium (1 turnbuckle), Heavy (2 turnbuckles)',
  tags: ['tiedown', 'weight', 'straps', 'turnbuckle', 'complete', 'coverage'],
}

// =============================================================================
// ALL PACKS EXPORT
// =============================================================================

export const TEMPLATE_PACKS: TemplatePack[] = [
  HEAVY_CRUISER_BUNDLE,
  LONG_BED_SETUP_BUNDLE,
  BEGINNER_PACKAGE_BUNDLE,
  HEIGHT_EXTENSIONS_COMPLETE,
  TIEDOWN_WEIGHT_COVERAGE,
]

// Packs grouped by use case
export const PACKS_BY_USE_CASE: Record<string, TemplatePack[]> = {
  'vehicle-setup': [LONG_BED_SETUP_BUNDLE],
  'motorcycle-weight': [HEAVY_CRUISER_BUNDLE, TIEDOWN_WEIGHT_COVERAGE],
  'customer-experience': [BEGINNER_PACKAGE_BUNDLE],
  'accessories': [HEIGHT_EXTENSIONS_COMPLETE],
}
