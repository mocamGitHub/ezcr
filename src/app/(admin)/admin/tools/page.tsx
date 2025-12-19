'use client'

import React, { useState, useEffect, useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  SortableTableHead,
  type SortDirection,
} from '@/components/ui/table'
import {
  Wrench,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Clock,
} from 'lucide-react'
import {
  getTools,
  createTool,
  updateTool,
  deleteTool,
  getToolStats,
  getUpcomingRenewals,
} from './actions'
import { getContactsForDropdown } from '../contacts/actions'
import type {
  Tool,
  ToolFormData,
  ToolCategory,
  ToolStatus,
  ToolFilters,
  BillingCycle,
  IntegrationStatus,
  UpcomingRenewal,
} from '@/types/contacts-tools'
import {
  TOOL_CATEGORY_LABELS,
  BILLING_CYCLE_LABELS,
  STATUS_LABELS,
  INTEGRATION_STATUS_LABELS,
  getDaysUntilRenewal,
} from '@/types/contacts-tools'

// ============================================
// TOOLS PAGE
// ============================================

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Stats
  const [stats, setStats] = useState<{
    total: number
    totalMonthlyCost: number
    totalAnnualCost: number
  }>({ total: 0, totalMonthlyCost: 0, totalAnnualCost: 0 })
  const [upcomingRenewals, setUpcomingRenewals] = useState<UpcomingRenewal[]>([])

  // Vendor contacts for dropdown
  const [vendorContacts, setVendorContacts] = useState<
    Array<{ id: string; company_name: string }>
  >([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ToolCategory | 'all'>(
    'all'
  )
  const [statusFilter, setStatusFilter] = useState<ToolStatus | 'all'>('all')

  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [toolToDelete, setToolToDelete] = useState<Tool | null>(null)

  // Form state
  const [formData, setFormData] = useState<ToolFormData>({
    name: '',
    category: 'other',
    status: 'active',
  })

  // Messages
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Handle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Sorted tools
  const sortedTools = useMemo(() => {
    if (!sortColumn || !sortDirection) return tools

    return [...tools].sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      switch (sortColumn) {
        case 'name':
          aVal = a.name
          bVal = b.name
          break
        case 'category':
          aVal = a.category
          bVal = b.category
          break
        case 'cost':
          aVal = a.cost_amount || 0
          bVal = b.cost_amount || 0
          break
        case 'renewal':
          aVal = a.renewal_date || ''
          bVal = b.renewal_date || ''
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        default:
          return 0
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      const comparison = String(aVal || '').localeCompare(String(bVal || ''))
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [tools, sortColumn, sortDirection])

  // Fetch data
  useEffect(() => {
    fetchTools()
    fetchStats()
    fetchRenewals()
    fetchVendorContacts()
  }, [categoryFilter, statusFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTools()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchTools = async () => {
    setIsLoading(true)
    try {
      const filters: ToolFilters = {
        search: searchQuery || undefined,
        category: categoryFilter,
        status: statusFilter,
      }
      const data = await getTools(filters)
      setTools(data)
    } catch (err) {
      setError('Failed to load tools')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await getToolStats()
      setStats({
        total: data.total,
        totalMonthlyCost: data.totalMonthlyCost,
        totalAnnualCost: data.totalAnnualCost,
      })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const fetchRenewals = async () => {
    try {
      const data = await getUpcomingRenewals(30)
      setUpcomingRenewals(data)
    } catch (err) {
      console.error('Failed to fetch renewals:', err)
    }
  }

  const fetchVendorContacts = async () => {
    try {
      const data = await getContactsForDropdown()
      setVendorContacts(data)
    } catch (err) {
      console.error('Failed to fetch vendor contacts:', err)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: 'other',
      status: 'active',
    })
    setEditingTool(null)
  }

  // Open create dialog
  const handleCreate = () => {
    resetForm()
    setIsFormDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (tool: Tool) => {
    setEditingTool(tool)
    setFormData({
      name: tool.name,
      description: tool.description || '',
      category: tool.category,
      vendor_contact_id: tool.vendor_contact_id || '',
      website_url: tool.website_url || '',
      login_url: tool.login_url || '',
      documentation_url: tool.documentation_url || '',
      account_email: tool.account_email || '',
      account_username: tool.account_username || '',
      api_key_name: tool.api_key_name || '',
      has_mfa: tool.has_mfa,
      mfa_method: tool.mfa_method || '',
      billing_cycle: tool.billing_cycle || undefined,
      cost_amount: tool.cost_amount || undefined,
      cost_currency: tool.cost_currency || 'USD',
      renewal_date: tool.renewal_date || '',
      auto_renew: tool.auto_renew,
      cancellation_notice_days: tool.cancellation_notice_days,
      integration_status: tool.integration_status,
      status: tool.status,
      notes: tool.notes || '',
    })
    setIsFormDialogOpen(true)
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Tool name is required')
      return
    }

    startTransition(async () => {
      try {
        if (editingTool) {
          await updateTool(editingTool.id, formData)
          setSuccessMessage('Tool updated successfully')
        } else {
          await createTool(formData)
          setSuccessMessage('Tool created successfully')
        }
        setIsFormDialogOpen(false)
        resetForm()
        fetchTools()
        fetchStats()
        fetchRenewals()
      } catch (err) {
        setError('Failed to save tool')
        console.error(err)
      }
    })
  }

  // Delete tool
  const handleDelete = async () => {
    if (!toolToDelete) return

    startTransition(async () => {
      try {
        await deleteTool(toolToDelete.id)
        setSuccessMessage('Tool deleted successfully')
        setIsDeleteDialogOpen(false)
        setToolToDelete(null)
        fetchTools()
        fetchStats()
        fetchRenewals()
      } catch (err) {
        setError('Failed to delete tool')
        console.error(err)
      }
    })
  }

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: ToolStatus) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'trial':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      case 'expired':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  // Get renewal urgency badge
  const getRenewalBadge = (renewal: UpcomingRenewal) => {
    switch (renewal.urgency) {
      case 'critical':
        return (
          <Badge variant="destructive" className="text-xs">
            {renewal.days_until_renewal} days
          </Badge>
        )
      case 'warning':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 text-xs">
            {renewal.days_until_renewal} days
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {renewal.days_until_renewal} days
          </Badge>
        )
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Wrench className="h-8 w-8" />
            Tools & Subscriptions
          </h1>
          <p className="text-muted-foreground mt-2">
            Track software, services, and subscription costs
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tool
        </Button>
      </div>

      {/* Messages */}
      {successMessage && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tools</p>
              <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Cost</p>
              <p className="text-2xl font-bold text-card-foreground">
                {formatCurrency(stats.totalMonthlyCost)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Annual Cost</p>
              <p className="text-2xl font-bold text-card-foreground">
                {formatCurrency(stats.totalAnnualCost)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Renewal Alerts */}
      {upcomingRenewals.length > 0 && (
        <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            <span className="font-medium text-yellow-600 dark:text-yellow-400">
              {upcomingRenewals.length} renewal
              {upcomingRenewals.length !== 1 ? 's' : ''} coming up:
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {upcomingRenewals.slice(0, 5).map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400"
                >
                  {r.name} {getRenewalBadge(r)}
                </span>
              ))}
              {upcomingRenewals.length > 5 && (
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  +{upcomingRenewals.length - 5} more
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as ToolCategory | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(TOOL_CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ToolStatus | 'all')}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground">
            {tools.length} tool{tools.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tools.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No tools found</p>
            <Button variant="outline" onClick={handleCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add your first tool
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  sortKey="name"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                >
                  Tool
                </SortableTableHead>
                <SortableTableHead
                  sortKey="category"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                >
                  Category
                </SortableTableHead>
                <SortableTableHead
                  sortKey="cost"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="text-center"
                >
                  Cost
                </SortableTableHead>
                <SortableTableHead
                  sortKey="renewal"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                >
                  Renewal
                </SortableTableHead>
                <SortableTableHead
                  sortKey="status"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                >
                  Status
                </SortableTableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTools.map((tool) => {
                const daysUntil = getDaysUntilRenewal(tool.renewal_date)
                return (
                  <TableRow key={tool.id}>
                    <TableCell>
                      <div>
                        {tool.website_url ? (
                          <a
                            href={tool.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {tool.name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="font-medium">{tool.name}</p>
                        )}
                        {tool.description && (
                          <p className="text-xs text-muted-foreground max-w-[300px]">
                            {tool.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={tool.category}
                        onValueChange={(v) => {
                          const newCategory = v as ToolCategory
                          // Optimistic update
                          setTools(prev => prev.map(t =>
                            t.id === tool.id ? { ...t, category: newCategory } : t
                          ))
                          // Background save
                          startTransition(async () => {
                            try {
                              await updateTool(tool.id, { category: newCategory })
                            } catch (err) {
                              // Revert on error
                              setTools(prev => prev.map(t =>
                                t.id === tool.id ? { ...t, category: tool.category } : t
                              ))
                              setError('Failed to update category')
                              console.error(err)
                            }
                          })
                        }}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TOOL_CATEGORY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      {tool.cost_amount ? (
                        <div>
                          <p className="font-medium">
                            {formatCurrency(tool.cost_amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tool.billing_cycle
                              ? BILLING_CYCLE_LABELS[tool.billing_cycle]
                              : '-'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tool.renewal_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">
                              {new Date(tool.renewal_date).toLocaleDateString()}
                            </p>
                            {daysUntil !== null && daysUntil <= 30 && (
                              <Badge
                                variant={
                                  daysUntil <= 7 ? 'destructive' : 'outline'
                                }
                                className="text-xs mt-1"
                              >
                                {daysUntil} days
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={tool.status}
                        onValueChange={(v) => {
                          const newStatus = v as ToolStatus
                          // Optimistic update
                          setTools(prev => prev.map(t =>
                            t.id === tool.id ? { ...t, status: newStatus } : t
                          ))
                          // Background save
                          startTransition(async () => {
                            try {
                              await updateTool(tool.id, { status: newStatus })
                              // Refresh stats since status affects active tool counts
                              fetchStats()
                            } catch (err) {
                              // Revert on error
                              setTools(prev => prev.map(t =>
                                t.id === tool.id ? { ...t, status: tool.status } : t
                              ))
                              setError('Failed to update status')
                              console.error(err)
                            }
                          })
                        }}
                      >
                        <SelectTrigger className="h-8 w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(tool)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setToolToDelete(tool)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTool ? 'Edit Tool' : 'Add Tool'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tool Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v as ToolCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TOOL_CATEGORY_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData({ ...formData, status: v as ToolStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor_contact_id">Vendor Contact</Label>
                <Select
                  value={formData.vendor_contact_id || 'none'}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      vendor_contact_id: v === 'none' ? undefined : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No vendor linked</SelectItem>
                    {vendorContacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* URLs */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">URLs & Links</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <div className="flex gap-1">
                    <Input
                      id="website_url"
                      type="url"
                      placeholder="https://"
                      value={formData.website_url || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, website_url: e.target.value })
                      }
                    />
                    {formData.website_url && (
                      <a
                        href={formData.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 rounded-md border border-input bg-background hover:bg-accent"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login_url">Login URL</Label>
                  <div className="flex gap-1">
                    <Input
                      id="login_url"
                      type="url"
                      placeholder="https://"
                      value={formData.login_url || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, login_url: e.target.value })
                      }
                    />
                    {formData.login_url && (
                      <a
                        href={formData.login_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 rounded-md border border-input bg-background hover:bg-accent"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentation_url">Documentation URL</Label>
                  <div className="flex gap-1">
                    <Input
                      id="documentation_url"
                      type="url"
                      placeholder="https://"
                      value={formData.documentation_url || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          documentation_url: e.target.value,
                        })
                      }
                    />
                    {formData.documentation_url && (
                      <a
                        href={formData.documentation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 rounded-md border border-input bg-background hover:bg-accent"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Account Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_email">Account Email</Label>
                  <Input
                    id="account_email"
                    type="email"
                    value={formData.account_email || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, account_email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_username">Username</Label>
                  <Input
                    id="account_username"
                    value={formData.account_username || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        account_username: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="has_mfa"
                    checked={formData.has_mfa || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, has_mfa: checked })
                    }
                  />
                  <Label htmlFor="has_mfa">MFA Enabled</Label>
                </div>
                {formData.has_mfa && (
                  <Input
                    placeholder="MFA Method (e.g., Authenticator app)"
                    value={formData.mfa_method || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, mfa_method: e.target.value })
                    }
                    className="flex-1"
                  />
                )}
              </div>
            </div>

            {/* Billing */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Billing</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing_cycle">Billing Cycle</Label>
                  <Select
                    value={formData.billing_cycle || 'none'}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        billing_cycle:
                          v === 'none' ? undefined : (v as BillingCycle),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      {Object.entries(BILLING_CYCLE_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_amount">Cost Amount</Label>
                  <Input
                    id="cost_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_amount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cost_amount: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renewal_date">Renewal Date</Label>
                  <Input
                    id="renewal_date"
                    type="date"
                    value={formData.renewal_date || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, renewal_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Switch
                  id="auto_renew"
                  checked={formData.auto_renew ?? true}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, auto_renew: checked })
                  }
                />
                <Label htmlFor="auto_renew">Auto-renew enabled</Label>
              </div>
            </div>

            {/* Integration */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Integration</h3>
              <div className="space-y-2">
                <Label htmlFor="integration_status">Integration Status</Label>
                <Select
                  value={formData.integration_status || 'not_integrated'}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      integration_status: v as IntegrationStatus,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INTEGRATION_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingTool ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tool</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{toolToDelete?.name}</strong>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
