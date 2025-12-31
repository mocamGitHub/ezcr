// Rule Validation Logic for Configurator Rules
// Detects conflicts, gaps, and inconsistencies in business rules

import type { ConfiguratorRule, RuleType } from '@/types/configurator-rules'

export interface RuleIssue {
  type: 'conflict' | 'gap' | 'inconsistency' | 'duplicate'
  severity: 'error' | 'warning' | 'info'
  message: string
  affectedRules: string[] // rule IDs
  ruleType: RuleType
}

/**
 * Group rules by their type
 */
function groupByType(rules: ConfiguratorRule[]): Record<RuleType, ConfiguratorRule[]> {
  return rules.reduce((acc, rule) => {
    if (!acc[rule.rule_type]) {
      acc[rule.rule_type] = []
    }
    acc[rule.rule_type].push(rule)
    return acc
  }, {} as Record<RuleType, ConfiguratorRule[]>)
}

/**
 * Check for overlapping ranges in AC001 height extension rules
 */
function checkAC001Overlaps(rules: ConfiguratorRule[]): RuleIssue[] {
  const issues: RuleIssue[] = []
  const activeRules = rules.filter(r => r.is_active)

  // Sort by height_min
  const sorted = activeRules
    .filter(r => r.condition?.height_min !== undefined)
    .sort((a, b) => (a.condition.height_min as number) - (b.condition.height_min as number))

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    const currentMax = current.condition.height_max as number
    const nextMin = next.condition.height_min as number

    // Check for overlap
    if (currentMax >= nextMin) {
      issues.push({
        type: 'conflict',
        severity: 'error',
        message: `Height ranges overlap: ${current.rule_key} (${current.condition.height_min}-${currentMax}) and ${next.rule_key} (${nextMin}-${next.condition.height_max})`,
        affectedRules: [current.id, next.id],
        ruleType: 'AC001',
      })
    }
  }

  return issues
}

/**
 * Check for gaps in AC001 height extension rules (optional, informational)
 */
function checkAC001Gaps(rules: ConfiguratorRule[]): RuleIssue[] {
  const issues: RuleIssue[] = []
  const activeRules = rules.filter(r => r.is_active)

  // Sort by height_min
  const sorted = activeRules
    .filter(r => r.condition?.height_min !== undefined)
    .sort((a, b) => (a.condition.height_min as number) - (b.condition.height_min as number))

  // Check if there's coverage from 0 to first rule
  if (sorted.length > 0) {
    const firstMin = sorted[0].condition.height_min as number
    if (firstMin > 0) {
      issues.push({
        type: 'gap',
        severity: 'info',
        message: `No AC001 extension rule for heights 0-${firstMin - 1} inches`,
        affectedRules: [],
        ruleType: 'AC001',
      })
    }
  }

  // Check for gaps between rules
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    const currentMax = current.condition.height_max as number
    const nextMin = next.condition.height_min as number

    if (nextMin > currentMax + 1) {
      issues.push({
        type: 'gap',
        severity: 'info',
        message: `Gap in height coverage: ${currentMax + 1}-${nextMin - 1} inches has no AC001 extension rule`,
        affectedRules: [current.id, next.id],
        ruleType: 'AC001',
      })
    }
  }

  return issues
}

/**
 * Check for duplicate rule keys within the same type
 */
function checkDuplicateKeys(rules: ConfiguratorRule[]): RuleIssue[] {
  const issues: RuleIssue[] = []
  const keyMap = new Map<string, ConfiguratorRule[]>()

  for (const rule of rules) {
    const key = `${rule.rule_type}:${rule.rule_key}`
    if (!keyMap.has(key)) {
      keyMap.set(key, [])
    }
    keyMap.get(key)!.push(rule)
  }

  for (const [key, duplicates] of keyMap) {
    if (duplicates.length > 1) {
      const [ruleType, ruleKey] = key.split(':')
      issues.push({
        type: 'duplicate',
        severity: 'warning',
        message: `Duplicate rule key "${ruleKey}" found ${duplicates.length} times in ${ruleType}`,
        affectedRules: duplicates.map(r => r.id),
        ruleType: ruleType as RuleType,
      })
    }
  }

  return issues
}

/**
 * Check tiedown rules for weight range overlaps/gaps
 */
function checkTiedownRanges(rules: ConfiguratorRule[]): RuleIssue[] {
  const issues: RuleIssue[] = []
  const activeRules = rules.filter(r => r.is_active)

  // Sort by weight_min
  const sorted = activeRules
    .filter(r => r.condition?.weight_min !== undefined)
    .sort((a, b) => (a.condition.weight_min as number) - (b.condition.weight_min as number))

  // Check for overlaps
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    const currentMax = current.condition.weight_max as number | undefined
    const nextMin = next.condition.weight_min as number

    if (currentMax !== undefined && currentMax >= nextMin) {
      issues.push({
        type: 'conflict',
        severity: 'error',
        message: `Weight ranges overlap: ${current.rule_key} (${current.condition.weight_min}-${currentMax}lbs) and ${next.rule_key} (${nextMin}-${next.condition.weight_max}lbs)`,
        affectedRules: [current.id, next.id],
        ruleType: current.rule_type,
      })
    }

    // Check for gaps
    if (currentMax !== undefined && nextMin > currentMax + 1) {
      issues.push({
        type: 'gap',
        severity: 'info',
        message: `Gap in weight coverage: ${currentMax + 1}-${nextMin - 1}lbs has no tiedown rule`,
        affectedRules: [current.id, next.id],
        ruleType: current.rule_type,
      })
    }
  }

  return issues
}

/**
 * Check for rules with empty or minimal conditions
 */
function checkEmptyConditions(rules: ConfiguratorRule[]): RuleIssue[] {
  const issues: RuleIssue[] = []

  for (const rule of rules) {
    const conditionKeys = Object.keys(rule.condition || {})

    if (conditionKeys.length === 0) {
      issues.push({
        type: 'inconsistency',
        severity: 'warning',
        message: `Rule "${rule.rule_key}" has empty conditions - will always match`,
        affectedRules: [rule.id],
        ruleType: rule.rule_type,
      })
    }
  }

  return issues
}

/**
 * Check for rules with empty or minimal actions
 */
function checkEmptyActions(rules: ConfiguratorRule[]): RuleIssue[] {
  const issues: RuleIssue[] = []

  for (const rule of rules) {
    const actionKeys = Object.keys(rule.action || {})

    if (actionKeys.length === 0) {
      issues.push({
        type: 'inconsistency',
        severity: 'warning',
        message: `Rule "${rule.rule_key}" has empty actions - will have no effect`,
        affectedRules: [rule.id],
        ruleType: rule.rule_type,
      })
    }
  }

  return issues
}

/**
 * Check for high inactive rule ratio
 */
function checkInactiveRatio(rules: ConfiguratorRule[]): RuleIssue[] {
  const issues: RuleIssue[] = []

  if (rules.length < 5) return issues // Skip if too few rules

  const inactiveCount = rules.filter(r => !r.is_active).length
  const inactiveRatio = inactiveCount / rules.length

  if (inactiveRatio > 0.5) {
    issues.push({
      type: 'inconsistency',
      severity: 'info',
      message: `${inactiveCount} of ${rules.length} rules (${Math.round(inactiveRatio * 100)}%) are inactive - consider cleaning up unused rules`,
      affectedRules: [],
      ruleType: 'AUN250', // Use as default type for general issues
    })
  }

  return issues
}

/**
 * Check for model rules with conflicting recommendations
 */
function checkModelConflicts(rules: ConfiguratorRule[]): RuleIssue[] {
  const issues: RuleIssue[] = []
  const activeRules = rules.filter(r => r.is_active)

  // Check for overlapping bed length recommendations
  const sorted = activeRules
    .filter(r => r.condition?.bed_length_min !== undefined)
    .sort((a, b) => (a.condition.bed_length_min as number) - (b.condition.bed_length_min as number))

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    const currentMax = current.condition.bed_length_max as number | undefined
    const nextMin = next.condition.bed_length_min as number

    if (currentMax !== undefined && currentMax >= nextMin) {
      // Only flag as conflict if both are recommended for overlapping ranges
      if (current.action.recommended && next.action.recommended) {
        issues.push({
          type: 'conflict',
          severity: 'warning',
          message: `Overlapping bed length recommendations: ${current.rule_key} and ${next.rule_key}`,
          affectedRules: [current.id, next.id],
          ruleType: current.rule_type,
        })
      }
    }
  }

  return issues
}

/**
 * Check for AC003 cargo extension range issues
 */
function checkCargoExtensionRanges(rules: ConfiguratorRule[]): RuleIssue[] {
  const issues: RuleIssue[] = []
  const activeRules = rules.filter(r => r.is_active)

  // Sort by cargo_length_min
  const sorted = activeRules
    .filter(r => r.condition?.cargo_length_min !== undefined)
    .sort((a, b) => (a.condition.cargo_length_min as number) - (b.condition.cargo_length_min as number))

  // Check for overlaps and gaps
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    const currentMin = current.condition.cargo_length_min as number
    const nextMin = next.condition.cargo_length_min as number

    // If both rules trigger on the same cargo_length_min, that's a potential conflict
    if (currentMin === nextMin) {
      issues.push({
        type: 'conflict',
        severity: 'warning',
        message: `Multiple cargo extension rules with same trigger point (${currentMin} inches)`,
        affectedRules: [current.id, next.id],
        ruleType: 'AC003',
      })
    }
  }

  return issues
}

/**
 * Analyze all rules and return detected issues
 */
export function analyzeRules(rules: ConfiguratorRule[]): RuleIssue[] {
  const issues: RuleIssue[] = []
  const rulesByType = groupByType(rules)

  // Global checks
  issues.push(...checkDuplicateKeys(rules))
  issues.push(...checkEmptyConditions(rules))
  issues.push(...checkEmptyActions(rules))
  issues.push(...checkInactiveRatio(rules))

  // AC001 Height Extension specific checks
  if (rulesByType.AC001?.length) {
    issues.push(...checkAC001Overlaps(rulesByType.AC001))
    issues.push(...checkAC001Gaps(rulesByType.AC001))
  }

  // AC003 Cargo Extension specific checks
  if (rulesByType.AC003?.length) {
    issues.push(...checkCargoExtensionRanges(rulesByType.AC003))
  }

  // Model specific checks (AUN250 and AUN210)
  if (rulesByType.AUN250?.length) {
    issues.push(...checkModelConflicts(rulesByType.AUN250))
  }
  if (rulesByType.AUN210?.length) {
    issues.push(...checkModelConflicts(rulesByType.AUN210))
  }

  // Tiedown specific checks (TURNBUCKLE, STRAPS, BOLTLESS_KIT)
  const tiedownRules = [
    ...(rulesByType.TURNBUCKLE || []),
    ...(rulesByType.STRAPS || []),
    ...(rulesByType.BOLTLESS_KIT || []),
  ]
  if (tiedownRules.length) {
    issues.push(...checkTiedownRanges(tiedownRules))
  }

  // Sort by severity: errors first, then warnings, then info
  const severityOrder = { error: 0, warning: 1, info: 2 }
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return issues
}

/**
 * Get a summary of rule coverage
 */
export function getRuleCoverageSummary(rules: ConfiguratorRule[]): {
  total: number
  active: number
  byType: Record<RuleType, { total: number; active: number }>
} {
  const rulesByType = groupByType(rules)

  const byType = Object.entries(rulesByType).reduce((acc, [type, typeRules]) => {
    acc[type as RuleType] = {
      total: typeRules.length,
      active: typeRules.filter(r => r.is_active).length,
    }
    return acc
  }, {} as Record<RuleType, { total: number; active: number }>)

  return {
    total: rules.length,
    active: rules.filter(r => r.is_active).length,
    byType,
  }
}
