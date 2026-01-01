// Configurator Rules Types
// Product-centric rule types - each product/accessory has its own rules

// =============================================================================
// NESTED CONDITION TYPES (for AND/OR logic)
// =============================================================================

/** Primitive condition value types */
export type ConditionValue = string | number | boolean | string[] | number[]

/** Simple flat condition - key-value pairs */
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

// =============================================================================
// RULE TYPE DEFINITIONS
// =============================================================================

// Models
export type ModelRuleType = 'AUN250' | 'AUN210'

// Accessories
export type AccessoryRuleType =
  | 'AC001' // Height extensions (12", 24", 36")
  | 'AC003' // Cargo extension
  | 'AC004' // 4-beam extension

// Tiedowns
export type TiedownRuleType =
  | 'TURNBUCKLE' // Turnbuckle tiedowns
  | 'STRAPS' // Tiedown straps
  | 'BOLTLESS_KIT' // Boltless tiedown kit

// Services
export type ServiceRuleType =
  | 'ASSEMBLY' // Assembly service
  | 'DEMO' // Demo service (includes assembly)

// Delivery
export type DeliveryRuleType = 'SHIPPING' | 'PICKUP'

// All rule types
export type RuleType =
  | ModelRuleType
  | AccessoryRuleType
  | TiedownRuleType
  | ServiceRuleType
  | DeliveryRuleType

export interface ConfiguratorRule {
  id: string
  tenant_id: string
  rule_type: RuleType
  rule_key: string
  condition: Record<string, unknown>
  action: Record<string, unknown>
  message: string | null
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// API request/response types
export interface CreateRuleRequest {
  rule_type: RuleType
  rule_key: string
  condition: Record<string, unknown>
  action: Record<string, unknown>
  message?: string
  priority?: number
  is_active?: boolean
}

export interface UpdateRuleRequest {
  rule_type?: RuleType
  rule_key?: string
  condition?: Record<string, unknown>
  action?: Record<string, unknown>
  message?: string | null
  priority?: number
  is_active?: boolean
}

export interface RulesListResponse {
  rules: ConfiguratorRule[]
  total: number
}

// Rule type categories for organization
export const RULE_TYPE_CATEGORIES = {
  models: ['AUN250', 'AUN210'] as RuleType[],
  accessories: ['AC001', 'AC003', 'AC004'] as RuleType[],
  tiedowns: ['TURNBUCKLE', 'STRAPS', 'BOLTLESS_KIT'] as RuleType[],
  services: ['ASSEMBLY', 'DEMO'] as RuleType[],
  delivery: ['SHIPPING', 'PICKUP'] as RuleType[],
}

// Rule type metadata for UI
export const RULE_TYPE_INFO: Record<
  RuleType,
  { label: string; description: string; color: string; category: string }
> = {
  // Models
  AUN250: {
    label: 'AUN250 Ramp',
    description: 'Premium folding ramp - supports long beds, 4-beam extensions',
    color: 'blue',
    category: 'Models',
  },
  AUN210: {
    label: 'AUN210 Ramp',
    description: 'Standard ramp - ideal for short/standard beds',
    color: 'sky',
    category: 'Models',
  },

  // Accessories
  AC001: {
    label: 'AC001 Extension',
    description: 'Height extensions (12", 24", 36") based on load height',
    color: 'green',
    category: 'Accessories',
  },
  AC003: {
    label: 'AC003 Cargo Extension',
    description: 'Cargo area extension for long bed trucks',
    color: 'emerald',
    category: 'Accessories',
  },
  AC004: {
    label: 'AC004 4-Beam Extension',
    description: '4-beam extension for extra support (AUN250 only)',
    color: 'teal',
    category: 'Accessories',
  },

  // Tiedowns
  TURNBUCKLE: {
    label: 'Turnbuckle Tiedowns',
    description: 'Heavy-duty turnbuckle tiedowns for secure transport',
    color: 'orange',
    category: 'Tiedowns',
  },
  STRAPS: {
    label: 'Tiedown Straps',
    description: 'Standard tiedown straps for lighter loads',
    color: 'amber',
    category: 'Tiedowns',
  },
  BOLTLESS_KIT: {
    label: 'Boltless Tiedown Kit',
    description: 'No-drill installation kit for tiedowns',
    color: 'yellow',
    category: 'Tiedowns',
  },

  // Services
  ASSEMBLY: {
    label: 'Assembly Service',
    description: 'Professional assembly service',
    color: 'purple',
    category: 'Services',
  },
  DEMO: {
    label: 'Demo Service',
    description: 'In-person demonstration with assembly (pickup only)',
    color: 'violet',
    category: 'Services',
  },

  // Delivery
  SHIPPING: {
    label: 'Shipping',
    description: 'Freight shipping via carrier',
    color: 'indigo',
    category: 'Delivery',
  },
  PICKUP: {
    label: 'Local Pickup',
    description: 'Customer pickup at location',
    color: 'slate',
    category: 'Delivery',
  },
}

// Condition schemas for validation hints (product-centric)
export const CONDITION_SCHEMAS: Record<RuleType, string> = {
  // Models - when to recommend this model
  AUN250: '{ "bed_length_min": number, "cargo_length_min": number }',
  AUN210: '{ "bed_length_min": number, "bed_length_max": number }',

  // Accessories - when this accessory applies
  AC001: '{ "height_min": number, "height_max": number }',
  AC003: '{ "cargo_length_min": number }',
  AC004: '{ "model": "AUN250", "load_weight_min": number }',

  // Tiedowns - when to recommend
  TURNBUCKLE: '{ "weight_min": number, "weight_max": number }',
  STRAPS: '{ "weight_max": number }',
  BOLTLESS_KIT: '{ "install_type": "no_drill" }',

  // Services
  ASSEMBLY: '{ "experience": "beginner" | "intermediate" }',
  DEMO: '{ "wants_instruction": true }',

  // Delivery
  SHIPPING: '{ "distance_min": number }',
  PICKUP: '{ "zip_code_pattern": string }',
}

// Action schemas for validation hints (product-centric)
export const ACTION_SCHEMAS: Record<RuleType, string> = {
  // Models - what happens when selected
  AUN250: '{ "compatible_with": string[], "requires": string[] }',
  AUN210: '{ "compatible_with": string[], "incompatible_with": string[] }',

  // Accessories - what variant to use
  AC001: '{ "variant": "12in" | "24in" | "36in", "sku": string }',
  AC003: '{ "required": boolean, "sku": string }',
  AC004: '{ "required": boolean, "sku": string }',

  // Tiedowns
  TURNBUCKLE: '{ "quantity": 1 | 2, "sku": string }',
  STRAPS: '{ "quantity": number, "sku": string }',
  BOLTLESS_KIT: '{ "required": boolean, "recommend": boolean }',

  // Services
  ASSEMBLY: '{ "recommend": boolean, "price": number }',
  DEMO: '{ "requires_pickup": true, "price": number }',

  // Delivery
  SHIPPING: '{ "carrier": "tforce" | "ups", "base_price": number }',
  PICKUP: '{ "location": string, "discount": number }',
}
