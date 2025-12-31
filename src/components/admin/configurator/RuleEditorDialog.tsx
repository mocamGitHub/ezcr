'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertCircle } from 'lucide-react'
import type { ConfiguratorRule, RuleType, CreateRuleRequest, UpdateRuleRequest } from '@/types/configurator-rules'
import { RULE_TYPE_INFO, RULE_TYPE_CATEGORIES, CONDITION_SCHEMAS, ACTION_SCHEMAS } from '@/types/configurator-rules'

interface RuleEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: ConfiguratorRule | null
  onSave: (data: CreateRuleRequest | UpdateRuleRequest, isEdit: boolean, ruleId?: string) => Promise<void>
}

// Product-centric rule types grouped by category
const RULE_TYPES_BY_CATEGORY = {
  Models: RULE_TYPE_CATEGORIES.models,
  Accessories: RULE_TYPE_CATEGORIES.accessories,
  Tiedowns: RULE_TYPE_CATEGORIES.tiedowns,
  Services: RULE_TYPE_CATEGORIES.services,
  Delivery: RULE_TYPE_CATEGORIES.delivery,
}

function validateJson(str: string): { valid: boolean; error?: string; parsed?: Record<string, unknown> } {
  if (!str.trim()) {
    return { valid: false, error: 'JSON is required' }
  }
  try {
    const parsed = JSON.parse(str)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { valid: false, error: 'Must be a JSON object (not array or primitive)' }
    }
    return { valid: true, parsed }
  } catch {
    return { valid: false, error: 'Invalid JSON syntax' }
  }
}

export function RuleEditorDialog({
  open,
  onOpenChange,
  rule,
  onSave,
}: RuleEditorDialogProps) {
  const isEdit = !!(rule && rule.id)

  // Form state
  const [ruleType, setRuleType] = useState<RuleType>('AUN250')
  const [ruleKey, setRuleKey] = useState('')
  const [conditionJson, setConditionJson] = useState('')
  const [actionJson, setActionJson] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState(0)
  const [isActive, setIsActive] = useState(true)

  // Validation state
  const [conditionError, setConditionError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Loading state
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form when rule changes
  useEffect(() => {
    if (rule) {
      setRuleType(rule.rule_type)
      setRuleKey(rule.rule_key)
      setConditionJson(JSON.stringify(rule.condition, null, 2))
      setActionJson(JSON.stringify(rule.action, null, 2))
      setMessage(rule.message || '')
      setPriority(rule.priority)
      setIsActive(rule.is_active)
    } else {
      // Reset to defaults for new rule
      setRuleType('AUN250')
      setRuleKey('')
      setConditionJson('{\n  \n}')
      setActionJson('{\n  \n}')
      setMessage('')
      setPriority(0)
      setIsActive(true)
    }
    setConditionError(null)
    setActionError(null)
    setError(null)
  }, [rule, open])

  const handleConditionChange = (value: string) => {
    setConditionJson(value)
    if (value.trim()) {
      const result = validateJson(value)
      setConditionError(result.valid ? null : result.error || null)
    } else {
      setConditionError(null)
    }
  }

  const handleActionChange = (value: string) => {
    setActionJson(value)
    if (value.trim()) {
      const result = validateJson(value)
      setActionError(result.valid ? null : result.error || null)
    } else {
      setActionError(null)
    }
  }

  const handleFormatJson = (field: 'condition' | 'action') => {
    const value = field === 'condition' ? conditionJson : actionJson
    const setter = field === 'condition' ? setConditionJson : setActionJson
    const errorSetter = field === 'condition' ? setConditionError : setActionError

    const result = validateJson(value)
    if (result.valid && result.parsed) {
      setter(JSON.stringify(result.parsed, null, 2))
      errorSetter(null)
    }
  }

  const handleSave = async () => {
    setError(null)

    if (!ruleKey.trim()) {
      setError('Rule key is required')
      return
    }

    const conditionResult = validateJson(conditionJson)
    const actionResult = validateJson(actionJson)

    if (!conditionResult.valid) {
      setConditionError(conditionResult.error || 'Invalid JSON')
      return
    }

    if (!actionResult.valid) {
      setActionError(actionResult.error || 'Invalid JSON')
      return
    }

    setSaving(true)

    try {
      const data = {
        rule_type: ruleType,
        rule_key: ruleKey.trim(),
        condition: conditionResult.parsed!,
        action: actionResult.parsed!,
        message: message.trim() || null,
        priority,
        is_active: isActive,
      }

      await onSave(data, isEdit, rule?.id)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  const typeInfo = RULE_TYPE_INFO[ruleType]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card border-2 border-border shadow-2xl">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-xl font-semibold text-foreground">{isEdit ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            {isEdit
              ? 'Modify the configurator rule settings.'
              : 'Create a new configurator business rule for a product.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Product/Rule Type - Grouped by Category */}
          <div className="grid gap-2">
            <Label htmlFor="rule-type">Product / Rule Type</Label>
            <Select value={ruleType} onValueChange={(v) => setRuleType(v as RuleType)}>
              <SelectTrigger id="rule-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RULE_TYPES_BY_CATEGORY).map(([category, types]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      {category}
                    </div>
                    {types.map((type) => {
                      const info = RULE_TYPE_INFO[type]
                      return (
                        <SelectItem key={type} value={type}>
                          <div className="flex flex-col">
                            <span>{info.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {info.description}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {typeInfo && (
              <p className="text-xs text-muted-foreground">
                Category: {typeInfo.category}
              </p>
            )}
          </div>

          {/* Rule Key */}
          <div className="grid gap-2">
            <Label htmlFor="rule-key">Rule Key</Label>
            <Input
              id="rule-key"
              placeholder="e.g., height_35_42, long_bed_recommended"
              value={ruleKey}
              onChange={(e) => setRuleKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for this rule. Use snake_case.
            </p>
          </div>

          {/* Condition JSON */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="condition" className="font-medium">Condition (JSON)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormatJson('condition')}
              >
                Format
              </Button>
            </div>
            <Textarea
              id="condition"
              className="font-mono text-sm min-h-[100px] bg-muted/50 border-2 border-input focus:border-primary focus:ring-2 focus:ring-ring"
              placeholder={CONDITION_SCHEMAS[ruleType] || '{ }'}
              value={conditionJson}
              onChange={(e) => handleConditionChange(e.target.value)}
            />
            {conditionError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {conditionError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Expected: {CONDITION_SCHEMAS[ruleType]}
            </p>
          </div>

          {/* Action JSON */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="action" className="font-medium">Action (JSON)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormatJson('action')}
              >
                Format
              </Button>
            </div>
            <Textarea
              id="action"
              className="font-mono text-sm min-h-[100px] bg-muted/50 border-2 border-input focus:border-primary focus:ring-2 focus:ring-ring"
              placeholder={ACTION_SCHEMAS[ruleType] || '{ }'}
              value={actionJson}
              onChange={(e) => handleActionChange(e.target.value)}
            />
            {actionError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {actionError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Expected: {ACTION_SCHEMAS[ruleType]}
            </p>
          </div>

          {/* Message */}
          <div className="grid gap-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="User-facing message when this rule is triggered..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
          </div>

          {/* Priority and Active */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers = higher priority
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Active</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <span className="text-sm text-muted-foreground">
                  {isActive ? 'Rule is active' : 'Rule is disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
