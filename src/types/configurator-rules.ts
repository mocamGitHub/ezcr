// Configurator Rules Types
// Used for admin management of configurator business rules

export type RuleType =
  | 'ac001_extension'
  | 'cargo_extension'
  | 'incompatibility'
  | 'recommendation'

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

// Rule type metadata for UI
export const RULE_TYPE_INFO: Record<
  RuleType,
  { label: string; description: string; color: string }
> = {
  ac001_extension: {
    label: 'AC001 Extension',
    description: 'Height-based extension recommendations',
    color: 'blue',
  },
  cargo_extension: {
    label: 'Cargo Extension',
    description: 'Cargo length requirements',
    color: 'green',
  },
  incompatibility: {
    label: 'Incompatibility',
    description: 'Conflicting product/service selections',
    color: 'red',
  },
  recommendation: {
    label: 'Recommendation',
    description: 'Suggested add-ons and accessories',
    color: 'amber',
  },
}

// Condition schemas for validation hints
export const CONDITION_SCHEMAS: Record<RuleType, string> = {
  ac001_extension: '{ "height_min": number, "height_max": number }',
  cargo_extension: '{ "cargo_min": number }',
  incompatibility: '{ "service": string, "delivery": string }',
  recommendation: '{ "trigger": string }',
}

// Action schemas for validation hints
export const ACTION_SCHEMAS: Record<RuleType, string> = {
  ac001_extension: '{ "extension": "AC001-1" | "AC001-2" | "AC001-3" }',
  cargo_extension: '{ "requires_extension": boolean }',
  incompatibility: '{ "block": boolean }',
  recommendation: '{ "recommend": string }',
}
