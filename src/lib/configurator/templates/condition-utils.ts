// Condition Utilities
// Functions for evaluating, displaying, and manipulating nested conditions

import type {
  NestedCondition,
  FlatCondition,
  ConditionValue,
  VariableValues,
  RuleTemplate,
  AppliedTemplate,
  TemplatePack,
} from './types'
import {
  isAndCondition,
  isOrCondition,
  isNotCondition,
  isFlatCondition,
} from './types'

// =============================================================================
// CONDITION EVALUATION
// =============================================================================

/**
 * Evaluate if a nested condition matches the given context
 */
export function evaluateCondition(
  condition: NestedCondition,
  context: Record<string, unknown>
): boolean {
  // Handle AND
  if (isAndCondition(condition)) {
    return condition.$and.every((sub) => evaluateCondition(sub, context))
  }

  // Handle OR
  if (isOrCondition(condition)) {
    return condition.$or.some((sub) => evaluateCondition(sub, context))
  }

  // Handle NOT
  if (isNotCondition(condition)) {
    return !evaluateCondition(condition.$not, context)
  }

  // Handle flat condition
  if (isFlatCondition(condition)) {
    return evaluateFlatCondition(condition, context)
  }

  return false
}

/**
 * Evaluate a flat condition (key-value pairs) against context
 */
function evaluateFlatCondition(
  condition: FlatCondition,
  context: Record<string, unknown>
): boolean {
  for (const [key, expected] of Object.entries(condition)) {
    const actual = context[key]

    // Handle _min suffix (greater than or equal)
    if (key.endsWith('_min')) {
      if (typeof actual !== 'number' || actual < (expected as number)) {
        return false
      }
      continue
    }

    // Handle _max suffix (less than or equal)
    if (key.endsWith('_max')) {
      if (typeof actual !== 'number' || actual > (expected as number)) {
        return false
      }
      continue
    }

    // Handle array comparison (in array)
    if (Array.isArray(expected)) {
      if (!(expected as (string | number)[]).includes(actual as string | number)) {
        return false
      }
      continue
    }

    // Handle equality
    if (actual !== expected) {
      return false
    }
  }

  return true
}

// =============================================================================
// CONDITION DISPLAY
// =============================================================================

/**
 * Convert a nested condition to a human-readable string
 */
export function conditionToDisplayString(condition: NestedCondition): string {
  if (isAndCondition(condition)) {
    const parts = condition.$and.map((sub) => conditionToDisplayString(sub))
    return `(${parts.join(' AND ')})`
  }

  if (isOrCondition(condition)) {
    const parts = condition.$or.map((sub) => conditionToDisplayString(sub))
    return `(${parts.join(' OR ')})`
  }

  if (isNotCondition(condition)) {
    return `NOT ${conditionToDisplayString(condition.$not)}`
  }

  if (isFlatCondition(condition)) {
    return flatConditionToString(condition)
  }

  return JSON.stringify(condition)
}

/**
 * Convert a flat condition to a readable string
 */
function flatConditionToString(condition: FlatCondition): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(condition)) {
    if (key.endsWith('_min')) {
      const baseKey = key.replace('_min', '')
      parts.push(`${formatKey(baseKey)} >= ${value}`)
    } else if (key.endsWith('_max')) {
      const baseKey = key.replace('_max', '')
      parts.push(`${formatKey(baseKey)} <= ${value}`)
    } else if (Array.isArray(value)) {
      parts.push(`${formatKey(key)} in [${value.join(', ')}]`)
    } else {
      parts.push(`${formatKey(key)} = ${value}`)
    }
  }

  return parts.join(', ')
}

/**
 * Format a key for display (snake_case to Title Case)
 */
function formatKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// =============================================================================
// VARIABLE SUBSTITUTION
// =============================================================================

/**
 * Replace {{variable}} placeholders in a condition with actual values
 */
export function substituteConditionVariables(
  condition: NestedCondition | string,
  variables: VariableValues
): Record<string, unknown> {
  // If condition is a string (JSON with placeholders), parse and substitute
  if (typeof condition === 'string') {
    let json = condition
    for (const [name, value] of Object.entries(variables)) {
      const placeholder = `{{${name}}}`
      // Handle numeric values (no quotes needed)
      if (typeof value === 'number' || typeof value === 'boolean') {
        json = json.replace(new RegExp(`"${placeholder}"`, 'g'), String(value))
      }
      // Handle string values (keep quotes)
      json = json.replace(new RegExp(placeholder, 'g'), String(value))
    }
    try {
      return JSON.parse(json)
    } catch {
      console.error('Failed to parse substituted condition:', json)
      return {}
    }
  }

  // If condition is an object, recursively substitute
  return substituteInObject(condition, variables) as Record<string, unknown>
}

/**
 * Replace {{variable}} placeholders in an action object with actual values
 */
export function substituteActionVariables(
  action: Record<string, unknown> | string,
  variables: VariableValues
): Record<string, unknown> {
  if (typeof action === 'string') {
    let json = action
    for (const [name, value] of Object.entries(variables)) {
      const placeholder = `{{${name}}}`
      if (typeof value === 'number' || typeof value === 'boolean') {
        json = json.replace(new RegExp(`"${placeholder}"`, 'g'), String(value))
      }
      json = json.replace(new RegExp(placeholder, 'g'), String(value))
    }
    try {
      return JSON.parse(json)
    } catch {
      console.error('Failed to parse substituted action:', json)
      return {}
    }
  }

  return substituteInObject(action, variables) as Record<string, unknown>
}

/**
 * Replace {{variable}} placeholders in a message string
 */
export function substituteMessageVariables(
  message: string,
  variables: VariableValues
): string {
  let result = message
  for (const [name, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${name}}}`, 'g'), String(value))
  }
  return result
}

/**
 * Recursively substitute variables in an object
 */
function substituteInObject(
  obj: unknown,
  variables: VariableValues
): unknown {
  if (typeof obj === 'string') {
    // Check if entire string is a placeholder
    const match = obj.match(/^{{(\w+)}}$/)
    if (match) {
      const varName = match[1]
      if (varName in variables) {
        return variables[varName]
      }
    }
    // Otherwise, do string replacement
    let result = obj
    for (const [name, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${name}}}`, 'g'), String(value))
    }
    return result
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => substituteInObject(item, variables))
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteInObject(value, variables)
    }
    return result
  }

  return obj
}

// =============================================================================
// TEMPLATE APPLICATION
// =============================================================================

/**
 * Apply a template with variable values to create a rule
 */
export function applyTemplate(
  template: RuleTemplate,
  variables: VariableValues,
  ruleKeyOverride?: string
): AppliedTemplate {
  const condition = substituteConditionVariables(template.condition as NestedCondition | string, variables)
  const action = substituteActionVariables(template.action as Record<string, unknown> | string, variables)
  const message = substituteMessageVariables(template.message, variables)

  // Generate rule key from template id and variables
  const ruleKey = ruleKeyOverride || generateRuleKey(template, variables)

  return {
    ruleType: template.ruleType,
    ruleKey,
    condition,
    action,
    message: message || null,
    priority: template.priority,
  }
}

/**
 * Apply a template pack with shared variables to create multiple rules
 */
export function applyTemplatePack(
  pack: TemplatePack,
  variables: VariableValues
): AppliedTemplate[] {
  return pack.templates.map((template, index) => {
    // Create a full RuleTemplate from the partial template
    const fullTemplate: RuleTemplate = {
      ...template,
      category: 'packs',
      tags: [],
    }
    // Generate unique key for each rule in the pack
    const ruleKey = `${pack.id}_${template.id}_${Date.now()}_${index}`
    return applyTemplate(fullTemplate, variables, ruleKey)
  })
}

/**
 * Generate a rule key from template and variables
 */
function generateRuleKey(template: RuleTemplate, variables: VariableValues): string {
  const baseKey = template.id.replace(/-/g, '_')

  // Add variable values to make the key unique
  const varParts = Object.entries(variables)
    .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
    .map(([, value]) => String(value).replace(/\W+/g, '_'))
    .slice(0, 2) // Limit to first 2 variables

  if (varParts.length > 0) {
    return `${baseKey}_${varParts.join('_')}`
  }

  return `${baseKey}_${Date.now()}`
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Check if a template has all required variables filled
 */
export function validateTemplateVariables(
  template: RuleTemplate,
  variables: VariableValues
): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const variable of template.variables) {
    if (variable.required && !(variable.name in variables)) {
      missing.push(variable.name)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Check if all shared variables in a pack are filled
 */
export function validatePackVariables(
  pack: TemplatePack,
  variables: VariableValues
): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const variable of pack.sharedVariables) {
    if (variable.required && !(variable.name in variables)) {
      missing.push(variable.name)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

// =============================================================================
// CONDITION SERIALIZATION
// =============================================================================

/**
 * Convert a condition to JSON string for textarea display
 */
export function conditionToJson(condition: NestedCondition): string {
  return JSON.stringify(condition, null, 2)
}

/**
 * Parse a JSON string to a condition, with error handling
 */
export function parseConditionJson(json: string): {
  valid: boolean
  condition?: NestedCondition
  error?: string
} {
  try {
    const parsed = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null) {
      return { valid: false, error: 'Condition must be a JSON object' }
    }
    return { valid: true, condition: parsed as NestedCondition }
  } catch (e) {
    return { valid: false, error: `Invalid JSON: ${(e as Error).message}` }
  }
}

/**
 * Check if a condition contains nested operators ($and, $or, $not)
 */
export function hasNestedOperators(condition: NestedCondition): boolean {
  return isAndCondition(condition) || isOrCondition(condition) || isNotCondition(condition)
}

/**
 * Get the type of a condition for display
 */
export function getConditionType(condition: NestedCondition): 'and' | 'or' | 'not' | 'flat' {
  if (isAndCondition(condition)) return 'and'
  if (isOrCondition(condition)) return 'or'
  if (isNotCondition(condition)) return 'not'
  return 'flat'
}
