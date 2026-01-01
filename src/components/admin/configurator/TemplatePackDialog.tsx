'use client'

import { useState, useMemo } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Package, Check, AlertCircle } from 'lucide-react'
import {
  applyTemplatePack,
  validatePackVariables,
  conditionToDisplayString,
  type TemplatePack,
  type AppliedTemplate,
  type VariableValues,
  type NestedCondition,
} from '@/lib/configurator/templates'
import { RULE_TYPE_INFO } from '@/types/configurator-rules'

interface TemplatePackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pack: TemplatePack
  onApply: (rules: AppliedTemplate[]) => Promise<void>
}

export function TemplatePackDialog({
  open,
  onOpenChange,
  pack,
  onApply,
}: TemplatePackDialogProps) {
  const [variableValues, setVariableValues] = useState<VariableValues>(() => {
    // Initialize with defaults
    const defaults: VariableValues = {}
    for (const variable of pack.sharedVariables) {
      if (variable.default !== undefined) {
        defaults[variable.name] = variable.default
      }
    }
    return defaults
  })
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validate variables
  const validation = useMemo(
    () => validatePackVariables(pack, variableValues),
    [pack, variableValues]
  )

  // Preview the rules that will be created
  const previewRules = useMemo(() => {
    if (!validation.valid) return []
    try {
      return applyTemplatePack(pack, variableValues)
    } catch {
      return []
    }
  }, [pack, variableValues, validation.valid])

  const handleVariableChange = (name: string, value: string | number | boolean) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleApply = async () => {
    if (!validation.valid) {
      setError(`Missing required fields: ${validation.missing.join(', ')}`)
      return
    }

    setApplying(true)
    setError(null)

    try {
      const rules = applyTemplatePack(pack, variableValues)
      await onApply(rules)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rules')
    } finally {
      setApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {pack.name}
          </DialogTitle>
          <DialogDescription>{pack.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shared Variables */}
          {pack.sharedVariables.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Configure Variables</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {pack.sharedVariables.map((variable) => (
                  <div key={variable.name} className="grid gap-2">
                    <Label htmlFor={variable.name}>
                      {variable.label}
                      {variable.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>

                    {variable.type === 'select' ? (
                      <select
                        id={variable.name}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={String(variableValues[variable.name] || '')}
                        onChange={(e) =>
                          handleVariableChange(variable.name, e.target.value)
                        }
                      >
                        <option value="">Select...</option>
                        {variable.options?.map((opt) => (
                          <option key={String(opt.value)} value={String(opt.value)}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : variable.type === 'number' ? (
                      <Input
                        id={variable.name}
                        type="number"
                        min={variable.validation?.min}
                        max={variable.validation?.max}
                        value={(variableValues[variable.name] as number) || ''}
                        onChange={(e) =>
                          handleVariableChange(
                            variable.name,
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    ) : (
                      <Input
                        id={variable.name}
                        type="text"
                        value={String(variableValues[variable.name] || '')}
                        onChange={(e) =>
                          handleVariableChange(variable.name, e.target.value)
                        }
                      />
                    )}

                    {variable.helpText && (
                      <p className="text-xs text-muted-foreground">
                        {variable.helpText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Rules to Create</h4>
              <Badge variant="secondary">{pack.templates.length} rules</Badge>
            </div>

            <ScrollArea className="h-[250px] rounded-md border p-4">
              <div className="space-y-3">
                {pack.templates.map((template, index) => {
                  const preview = previewRules[index]
                  const typeInfo = RULE_TYPE_INFO[template.ruleType]

                  return (
                    <div
                      key={template.id}
                      className="p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-sm">
                              {template.name}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge
                              variant="outline"
                              className="font-mono"
                            >
                              {typeInfo?.label || template.ruleType}
                            </Badge>
                            {preview && (
                              <span className="text-muted-foreground truncate max-w-[300px]">
                                {typeof preview.condition === 'object'
                                  ? conditionToDisplayString(
                                      preview.condition as NestedCondition
                                    )
                                  : JSON.stringify(preview.condition)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Error */}
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
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={applying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={applying || !validation.valid}
          >
            {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create {pack.templates.length} Rules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
