'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Layers,
  Package,
  ArrowRight,
  Zap,
  Info,
} from 'lucide-react'
import {
  SINGLE_TEMPLATES,
  TEMPLATE_PACKS,
  TEMPLATES_BY_CATEGORY,
  CATEGORY_LABELS,
  conditionToDisplayString,
  type RuleTemplate,
  type TemplatePack,
  type TemplateCategory,
  type VariableValues,
} from '@/lib/configurator/templates'

interface TemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: RuleTemplate, variables: VariableValues) => void
  onSelectPack: (pack: TemplatePack) => void
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'height-extensions': '📏',
  'cargo-extensions': '📦',
  'model-selection': '🏍️',
  'tiedowns': '🔗',
  'services': '🔧',
  'delivery': '🚚',
  'combinations': '⚡',
  'packs': '📦',
}

export function TemplateSelector({
  open,
  onOpenChange,
  onSelectTemplate,
  onSelectPack,
}: TemplateSelectorProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null)
  const [variableValues, setVariableValues] = useState<VariableValues>({})
  const [showVariableForm, setShowVariableForm] = useState(false)

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let templates = SINGLE_TEMPLATES

    if (selectedCategory !== 'all' && selectedCategory !== 'packs') {
      templates = TEMPLATES_BY_CATEGORY[selectedCategory] || []
    }

    if (search) {
      const lowerSearch = search.toLowerCase()
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerSearch) ||
          t.description.toLowerCase().includes(lowerSearch) ||
          t.tags.some((tag) => tag.includes(lowerSearch))
      )
    }

    return templates
  }, [selectedCategory, search])

  // Filter packs based on search
  const filteredPacks = useMemo(() => {
    if (!search) return TEMPLATE_PACKS

    const lowerSearch = search.toLowerCase()
    return TEMPLATE_PACKS.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.description.toLowerCase().includes(lowerSearch) ||
        p.tags.some((tag) => tag.includes(lowerSearch))
    )
  }, [search])

  const handleTemplateClick = (template: RuleTemplate) => {
    if (template.variables.length > 0) {
      // Initialize variables with defaults
      const defaults: VariableValues = {}
      for (const variable of template.variables) {
        if (variable.default !== undefined) {
          defaults[variable.name] = variable.default
        }
      }
      setVariableValues(defaults)
      setSelectedTemplate(template)
      setShowVariableForm(true)
    } else {
      // No variables, apply directly
      onSelectTemplate(template, {})
      onOpenChange(false)
    }
  }

  const handleApplyWithVariables = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate, variableValues)
      onOpenChange(false)
      setShowVariableForm(false)
      setSelectedTemplate(null)
      setVariableValues({})
    }
  }

  const handlePackClick = (pack: TemplatePack) => {
    onSelectPack(pack)
    onOpenChange(false)
  }

  const handleVariableChange = (name: string, value: string | number | boolean) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }))
  }

  const categories = Object.keys(TEMPLATES_BY_CATEGORY) as TemplateCategory[]

  // Variable input form
  if (showVariableForm && selectedTemplate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure Template</DialogTitle>
            <DialogDescription>
              Fill in the values for: {selectedTemplate.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {selectedTemplate.variables.map((variable) => (
              <div key={variable.name} className="grid gap-2">
                <Label htmlFor={variable.name}>
                  {variable.label}
                  {variable.required && <span className="text-destructive ml-1">*</span>}
                </Label>

                {variable.type === 'select' ? (
                  <select
                    id={variable.name}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={String(variableValues[variable.name] || '')}
                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
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
                    value={variableValues[variable.name] as number || ''}
                    onChange={(e) => handleVariableChange(variable.name, parseFloat(e.target.value) || 0)}
                  />
                ) : variable.type === 'boolean' ? (
                  <div className="flex items-center gap-2">
                    <input
                      id={variable.name}
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(variableValues[variable.name])}
                      onChange={(e) => handleVariableChange(variable.name, e.target.checked)}
                    />
                    <Label htmlFor={variable.name} className="font-normal">
                      {variable.helpText || 'Enable'}
                    </Label>
                  </div>
                ) : (
                  <Input
                    id={variable.name}
                    type="text"
                    value={String(variableValues[variable.name] || '')}
                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                  />
                )}

                {variable.helpText && variable.type !== 'boolean' && (
                  <p className="text-xs text-muted-foreground">{variable.helpText}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowVariableForm(false)
                setSelectedTemplate(null)
              }}
            >
              Back
            </Button>
            <Button onClick={handleApplyWithVariables}>
              Apply Template
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Rule Templates
          </DialogTitle>
          <DialogDescription>
            Choose a template to quickly create a rule with pre-filled values
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              All
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="packs"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Package className="h-4 w-4 mr-1" />
              Packs
            </TabsTrigger>
          </TabsList>

          {/* Single Templates */}
          <TabsContent value={selectedCategory} className="mt-4">
            {selectedCategory !== 'packs' && (
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid gap-3">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No templates found
                    </div>
                  ) : (
                    filteredTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onClick={() => handleTemplateClick(template)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Template Packs */}
          <TabsContent value="packs" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-3">
                {filteredPacks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No template packs found
                  </div>
                ) : (
                  filteredPacks.map((pack) => (
                    <PackCard
                      key={pack.id}
                      pack={pack}
                      onClick={() => handlePackClick(pack)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Template Card Component
function TemplateCard({
  template,
  onClick,
}: {
  template: RuleTemplate
  onClick: () => void
}) {
  const conditionPreview = useMemo(() => {
    if (typeof template.condition === 'string') {
      return template.condition
    }
    return conditionToDisplayString(template.condition)
  }, [template.condition])

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{template.name}</span>
            {template.isCombo && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Combo
              </Badge>
            )}
            {template.variables.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {template.variables.length} var{template.variables.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary">{template.ruleType}</Badge>
            <span className="text-muted-foreground truncate" title={conditionPreview}>
              {conditionPreview.length > 50 ? conditionPreview.slice(0, 50) + '...' : conditionPreview}
            </span>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </button>
  )
}

// Pack Card Component
function PackCard({
  pack,
  onClick,
}: {
  pack: TemplatePack
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-medium">{pack.name}</span>
            <Badge variant="default" className="text-xs">
              {pack.templates.length} rules
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{pack.description}</p>
          <div className="flex items-center gap-2 text-xs">
            <Info className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{pack.preview}</span>
          </div>
          {pack.sharedVariables.length > 0 && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {pack.sharedVariables.length} shared variable{pack.sharedVariables.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </button>
  )
}
