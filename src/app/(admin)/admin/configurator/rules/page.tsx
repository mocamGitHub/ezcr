'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  SlidersHorizontal,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { RulesTable } from '@/components/admin/configurator/RulesTable'
import { RuleEditorDialog } from '@/components/admin/configurator/RuleEditorDialog'
import type {
  ConfiguratorRule,
  RuleType,
  CreateRuleRequest,
  UpdateRuleRequest,
} from '@/types/configurator-rules'
import { RULE_TYPE_INFO } from '@/types/configurator-rules'
import { toast } from 'sonner'

interface PaginationMeta {
  total: number
  page: number
  limit: number
  total_pages: number
  has_next_page: boolean
  has_prev_page: boolean
}

const RULE_TYPES: RuleType[] = ['ac001_extension', 'cargo_extension', 'incompatibility', 'recommendation']

export default function ConfiguratorRulesPage() {
  usePageTitle('Configurator Rules')

  // Data state
  const [rules, setRules] = useState<ConfiguratorRule[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [ruleTypeFilter, setRuleTypeFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog state
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<ConfiguratorRule | null>(null)

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Fetch rules
  const fetchRules = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (ruleTypeFilter !== 'all') {
        params.set('rule_type', ruleTypeFilter)
      }

      if (activeFilter !== 'all') {
        params.set('is_active', activeFilter)
      }

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }

      const response = await fetch(`/api/admin/configurator/rules?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setRules(data.rules)
        setPagination(data.pagination)
      } else {
        setError(data.error || 'Failed to fetch rules')
      }
    } catch (err) {
      console.error('Error fetching rules:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [ruleTypeFilter, activeFilter, searchQuery])

  // Initial fetch and refetch on filter change
  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRules()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle create/edit rule
  const handleSaveRule = async (
    data: CreateRuleRequest | UpdateRuleRequest,
    isEdit: boolean,
    ruleId?: string
  ) => {
    const url = isEdit
      ? `/api/admin/configurator/rules/${ruleId}`
      : '/api/admin/configurator/rules'

    const response = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save rule')
    }

    setSuccessMessage(isEdit ? 'Rule updated successfully' : 'Rule created successfully')
    fetchRules()
  }

  // Handle toggle active
  const handleToggleActive = async (rule: ConfiguratorRule, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/configurator/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update rule')
      }

      toast.success(`Rule ${isActive ? 'activated' : 'deactivated'}`)
      fetchRules()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update rule')
    }
  }

  // Handle delete
  const handleDelete = async (rule: ConfiguratorRule) => {
    try {
      const response = await fetch(`/api/admin/configurator/rules/${rule.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete rule')
      }

      toast.success('Rule deleted successfully')
      fetchRules()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete rule')
    }
  }

  // Handle edit
  const handleEdit = (rule: ConfiguratorRule) => {
    setSelectedRule(rule)
    setEditorOpen(true)
  }

  // Handle create new
  const handleCreateNew = () => {
    setSelectedRule(null)
    setEditorOpen(true)
  }

  // Calculate stats
  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.is_active).length,
    inactive: rules.filter((r) => !r.is_active).length,
    byType: RULE_TYPES.reduce(
      (acc, type) => {
        acc[type] = rules.filter((r) => r.rule_type === type).length
        return acc
      },
      {} as Record<RuleType, number>
    ),
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <SlidersHorizontal className="h-8 w-8" />
            Configurator Rules
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage business rules for the product configurator
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Rules</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        {RULE_TYPES.map((type) => (
          <div key={type} className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold">{stats.byType[type]}</div>
            <div className="text-sm text-muted-foreground">{RULE_TYPE_INFO[type].label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by key or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={ruleTypeFilter} onValueChange={setRuleTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rule Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {RULE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {RULE_TYPE_INFO[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={fetchRules} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Rules Table */}
      <RulesTable
        rules={rules}
        loading={isLoading}
        error={error}
        onRefresh={fetchRules}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />

      {/* Editor Dialog */}
      <RuleEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        rule={selectedRule}
        onSave={handleSaveRule}
      />
    </div>
  )
}
