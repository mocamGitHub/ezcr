'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Pencil, Trash2, RefreshCw, AlertTriangle, SlidersHorizontal } from 'lucide-react'
import type { ConfiguratorRule, RuleType } from '@/types/configurator-rules'
import { RULE_TYPE_INFO } from '@/types/configurator-rules'
import { toast } from 'sonner'

interface RulesTableProps {
  rules: ConfiguratorRule[]
  loading: boolean
  error?: string | null
  onRefresh: () => void
  onEdit: (rule: ConfiguratorRule) => void
  onToggleActive: (rule: ConfiguratorRule, isActive: boolean) => Promise<void>
  onDelete: (rule: ConfiguratorRule) => Promise<void>
}

function getRuleTypeBadgeVariant(ruleType: RuleType): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (ruleType) {
    case 'incompatibility':
      return 'destructive'
    case 'recommendation':
      return 'secondary'
    case 'ac001_extension':
      return 'default'
    case 'cargo_extension':
      return 'outline'
    default:
      return 'outline'
  }
}

function formatJson(obj: Record<string, unknown>): string {
  try {
    return JSON.stringify(obj, null, 0)
      .replace(/"/g, '')
      .replace(/,/g, ', ')
      .replace(/{/g, '')
      .replace(/}/g, '')
      .trim()
  } catch {
    return String(obj)
  }
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function RulesTable({
  rules,
  loading,
  error,
  onRefresh,
  onEdit,
  onToggleActive,
  onDelete,
}: RulesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ruleToDelete, setRuleToDelete] = useState<ConfiguratorRule | null>(null)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  const handleDeleteClick = (rule: ConfiguratorRule) => {
    setRuleToDelete(rule)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (ruleToDelete) {
      await onDelete(ruleToDelete)
      setDeleteDialogOpen(false)
      setRuleToDelete(null)
    }
  }

  const handleToggleActive = async (rule: ConfiguratorRule, newValue: boolean) => {
    setTogglingIds((prev) => new Set(prev).add(rule.id))
    try {
      await onToggleActive(rule, newValue)
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(rule.id)
        return next
      })
    }
  }

  if (error) {
    return (
      <div className="border border-destructive/50 rounded-lg p-12 text-center bg-destructive/5">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="font-medium text-lg mb-1 text-destructive">Failed to load rules</h3>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <Button variant="outline" onClick={onRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 animate-pulse">
          <SlidersHorizontal className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-1">Loading rules...</h3>
        <p className="text-muted-foreground text-sm">Please wait</p>
      </div>
    )
  }

  if (rules.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <SlidersHorizontal className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-1">No rules found</h3>
        <p className="text-muted-foreground text-sm">
          There are no configurator rules matching your current filters.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Type</TableHead>
              <TableHead className="w-[120px]">Key</TableHead>
              <TableHead className="hidden lg:table-cell">Condition</TableHead>
              <TableHead className="hidden lg:table-cell">Action</TableHead>
              <TableHead className="hidden md:table-cell">Message</TableHead>
              <TableHead className="w-[80px] text-center">Priority</TableHead>
              <TableHead className="w-[80px] text-center">Active</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => {
              const typeInfo = RULE_TYPE_INFO[rule.rule_type]
              const conditionStr = formatJson(rule.condition)
              const actionStr = formatJson(rule.action)

              return (
                <TableRow
                  key={rule.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onEdit(rule)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Badge variant={getRuleTypeBadgeVariant(rule.rule_type)}>
                      {typeInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {rule.rule_key}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {truncate(conditionStr, 40)}
                    </code>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {truncate(actionStr, 40)}
                    </code>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {rule.message ? truncate(rule.message, 50) : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-sm">{rule.priority}</span>
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={rule.is_active}
                      disabled={togglingIds.has(rule.id)}
                      onCheckedChange={(checked) => handleToggleActive(rule, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(rule)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(rule)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the rule &quot;{ruleToDelete?.rule_key}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
