// Configurator Rule Templates - Type Definitions

import type { RuleType } from '@/types/configurator-rules'

// =============================================================================
// NESTED CONDITION TYPES
// =============================================================================

/** Primitive condition value types */
export type ConditionValue = string | number | boolean | string[] | number[]

/** Simple flat condition (existing format) - key-value pairs */
export type FlatCondition = Record<string, ConditionValue>

/** AND condition - all sub-conditions must match */
export interface AndCondition {
  $and: NestedCondition[]
}

/** OR condition - at least one sub-condition must match */
export interface OrCondition {
  $or: NestedCondition[]
}

/** NOT condition - sub-condition must NOT match */
export interface NotCondition {
  $not: NestedCondition
}

/** A nested condition can be flat, AND, OR, or NOT */
export type NestedCondition = FlatCondition | AndCondition | OrCondition | NotCondition

// =============================================================================
// TEMPLATE VARIABLE TYPES
// =============================================================================

/** Categories for organizing templates */
export type TemplateCategory =
  | 'height-extensions'
  | 'cargo-extensions'
  | 'model-selection'
  | 'tiedowns'
  | 'services'
  | 'delivery'
  | 'combinations'
  | 'packs'

/** A variable in a template that needs user input */
export interface TemplateVariable {
  /** Variable name used in placeholders like {{varName}} */
  name: string
  /** Display label for the input */
  label: string
  /** Input type */
  type: 'number' | 'string' | 'select' | 'boolean'
  /** Whether the variable is required */
  required: boolean
  /** Default value if not provided */
  default?: ConditionValue
  /** Options for select type */
  options?: { value: string | number; label: string }[]
  /** Validation constraints */
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  /** Help text shown below the input */
  helpText?: string
}

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

/** A single rule template */
export interface RuleTemplate {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Description of what this template does */
  description: string
  /** Category for filtering */
  category: TemplateCategory
  /** The rule type this template creates */
  ruleType: RuleType
  /** Pre-filled condition (can include {{placeholders}}) */
  condition: NestedCondition | string
  /** Pre-filled action (can include {{placeholders}}) */
  action: Record<string, unknown> | string
  /** Pre-filled message with optional {{placeholders}} */
  message: string
  /** Default priority */
  priority: number
  /** Variables that need user input */
  variables: TemplateVariable[]
  /** Tags for search/filtering */
  tags: string[]
  /** Whether this template uses AND/OR conditions */
  isCombo?: boolean
}

/** A template pack that creates multiple rules */
export interface TemplatePack {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Description of what this pack does */
  description: string
  /** Category (always 'packs') */
  category: 'packs'
  /** Individual templates in this pack */
  templates: Omit<RuleTemplate, 'category' | 'tags'>[]
  /** Shared variables across all templates */
  sharedVariables: TemplateVariable[]
  /** Preview text showing what will be created */
  preview: string
  /** Tags for search/filtering */
  tags: string[]
}

// =============================================================================
// APPLIED TEMPLATE TYPES
// =============================================================================

/** Result of applying a template with variables filled in */
export interface AppliedTemplate {
  ruleType: RuleType
  ruleKey: string
  condition: Record<string, unknown>
  action: Record<string, unknown>
  message: string | null
  priority: number
}

/** Variable values provided by the user */
export type VariableValues = Record<string, ConditionValue>

// =============================================================================
// TYPE GUARDS
// =============================================================================

/** Check if a condition is an AND condition */
export function isAndCondition(condition: NestedCondition): condition is AndCondition {
  return typeof condition === 'object' && '$and' in condition
}

/** Check if a condition is an OR condition */
export function isOrCondition(condition: NestedCondition): condition is OrCondition {
  return typeof condition === 'object' && '$or' in condition
}

/** Check if a condition is a NOT condition */
export function isNotCondition(condition: NestedCondition): condition is NotCondition {
  return typeof condition === 'object' && '$not' in condition
}

/** Check if a condition is a flat condition (no operators) */
export function isFlatCondition(condition: NestedCondition): condition is FlatCondition {
  return (
    typeof condition === 'object' &&
    !('$and' in condition) &&
    !('$or' in condition) &&
    !('$not' in condition)
  )
}

/** Check if a template is a pack */
export function isTemplatePack(
  template: RuleTemplate | TemplatePack
): template is TemplatePack {
  return 'templates' in template && Array.isArray(template.templates)
}
