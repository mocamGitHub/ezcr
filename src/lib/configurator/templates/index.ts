// Configurator Rule Templates - Main Export

// Types
export type {
  ConditionValue,
  FlatCondition,
  AndCondition,
  OrCondition,
  NotCondition,
  NestedCondition,
  TemplateCategory,
  TemplateVariable,
  RuleTemplate,
  TemplatePack,
  AppliedTemplate,
  VariableValues,
} from './types'

export {
  isAndCondition,
  isOrCondition,
  isNotCondition,
  isFlatCondition,
  isTemplatePack,
} from './types'

// Single Templates
export {
  SINGLE_TEMPLATES,
  TEMPLATES_BY_CATEGORY,
  CATEGORY_LABELS,
  // Individual templates (for direct access if needed)
  HEIGHT_12_INCH,
  HEIGHT_24_INCH,
  HEIGHT_36_INCH,
  HEIGHT_CUSTOM_RANGE,
  CARGO_LONG_BED,
  CARGO_OPTIONAL,
  MODEL_AUN250_LONG_BED,
  MODEL_AUN210_SHORT_BED,
  TIEDOWN_HEAVY_MOTORCYCLE,
  TIEDOWN_MEDIUM_MOTORCYCLE,
  TIEDOWN_STRAPS_LIGHT,
  BOLTLESS_KIT_NO_DRILL,
  ASSEMBLY_BEGINNER,
  DEMO_WITH_INSTRUCTION,
  SHIPPING_LONG_DISTANCE,
  PICKUP_LOCAL,
  COMBO_HEAVY_AND_LONG_BED,
  COMBO_BEGINNER_OR_EXPENSIVE,
  COMBO_AUN250_AND_HEAVY,
  COMBO_NOT_AUN210_FOR_HEAVY,
} from './single-templates'

// Template Packs
export {
  TEMPLATE_PACKS,
  PACKS_BY_USE_CASE,
  // Individual packs
  HEAVY_CRUISER_BUNDLE,
  LONG_BED_SETUP_BUNDLE,
  BEGINNER_PACKAGE_BUNDLE,
  HEIGHT_EXTENSIONS_COMPLETE,
  TIEDOWN_WEIGHT_COVERAGE,
} from './template-packs'

// Condition Utilities
export {
  // Evaluation
  evaluateCondition,
  // Display
  conditionToDisplayString,
  // Variable substitution
  substituteConditionVariables,
  substituteActionVariables,
  substituteMessageVariables,
  // Template application
  applyTemplate,
  applyTemplatePack,
  // Validation
  validateTemplateVariables,
  validatePackVariables,
  // Serialization
  conditionToJson,
  parseConditionJson,
  hasNestedOperators,
  getConditionType,
} from './condition-utils'

// =============================================================================
// REGISTRY FUNCTIONS
// =============================================================================

import { SINGLE_TEMPLATES, TEMPLATES_BY_CATEGORY } from './single-templates'
import { TEMPLATE_PACKS } from './template-packs'
import type { RuleTemplate, TemplatePack, TemplateCategory } from './types'

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): RuleTemplate | undefined {
  return SINGLE_TEMPLATES.find((t) => t.id === id)
}

/**
 * Get a template pack by ID
 */
export function getPackById(id: string): TemplatePack | undefined {
  return TEMPLATE_PACKS.find((p) => p.id === id)
}

/**
 * Get all templates for a category
 */
export function getTemplatesByCategory(category: TemplateCategory): RuleTemplate[] {
  return TEMPLATES_BY_CATEGORY[category] || []
}

/**
 * Search templates by name, description, or tags
 */
export function searchTemplates(query: string): RuleTemplate[] {
  const lowerQuery = query.toLowerCase()
  return SINGLE_TEMPLATES.filter((t) =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Search template packs by name, description, or tags
 */
export function searchPacks(query: string): TemplatePack[] {
  const lowerQuery = query.toLowerCase()
  return TEMPLATE_PACKS.filter((p) =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Get all templates that use AND/OR conditions
 */
export function getComboTemplates(): RuleTemplate[] {
  return SINGLE_TEMPLATES.filter((t) => t.isCombo)
}

/**
 * Get all available categories
 */
export function getCategories(): TemplateCategory[] {
  return Object.keys(TEMPLATES_BY_CATEGORY) as TemplateCategory[]
}

/**
 * Get template and pack counts by category
 */
export function getTemplateCounts(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const [category, templates] of Object.entries(TEMPLATES_BY_CATEGORY)) {
    counts[category] = templates.length
  }
  counts['packs'] = TEMPLATE_PACKS.length
  return counts
}
