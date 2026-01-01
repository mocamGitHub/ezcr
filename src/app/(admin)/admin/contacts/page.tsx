'use client'

import React, { useState, useEffect, useTransition, useCallback, useMemo } from 'react'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  ExternalLink,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportToCSV, contactColumns, getExportFilename } from '@/lib/utils/export'
import {
  getContactsPaginated,
  getContactsForExport,
  createContact,
  updateContact,
  deleteContact,
} from './actions'
import type {
  Contact,
  ContactFormData,
  ContactType,
  ContactStatus,
} from '@/types/contacts-tools'
import { CONTACT_TYPE_LABELS } from '@/types/contacts-tools'
import {
  AdminDataTable,
  AdminFilterBar,
  FilterPresetDropdown,
  PageHeader,
  useFilters,
  type ColumnDef,
  type RowAction,
  type FilterConfig,
} from '@/components/admin'

export default function ContactsPage() {
  // Table state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [sortColumn, setSortColumn] = useState('company_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // URL-synced filters with presets
  type ContactFilters = {
    type: ContactType | 'all'
    status: ContactStatus | 'all'
    dateRange: DateRange | undefined
    [key: string]: unknown
  }

  const {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    applyPreset,
  } = useFilters<ContactFilters>({
    initialState: {
      type: 'all',
      status: 'all',
      dateRange: undefined,
    },
    syncToUrl: true,
    urlPrefix: 'f_',
  })

  const { type: typeFilter, status: statusFilter, dateRange } = filters

  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)

  // Form state
  const [formData, setFormData] = useState<ContactFormData>({
    contact_type: 'vendor',
    company_name: '',
    status: 'active',
  })

  const [isPending, startTransition] = useTransition()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getContactsPaginated({
        page,
        pageSize,
        sortColumn,
        sortDirection,
        search,
        type: typeFilter,
        status: statusFilter,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
      })
      setContacts(result.data)
      setTotalCount(result.totalCount)
    } catch (err: any) {
      console.error('Error loading contacts:', err)
      setError(err.message || 'Failed to load contacts')
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortColumn, sortDirection, search, typeFilter, statusFilter, dateRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleTypeFilterChange = (value: ContactType | 'all') => {
    updateFilter('type', value)
    setPage(1)
  }

  const handleStatusFilterChange = (value: ContactStatus | 'all') => {
    updateFilter('status', value)
    setPage(1)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    updateFilter('dateRange', range)
    setPage(1)
  }

  const handleClearFilters = () => {
    resetFilters()
    setPage(1)
  }

  const handleApplyPreset = (preset: Record<string, unknown>) => {
    if (applyPreset) {
      applyPreset(preset as Partial<ContactFilters>)
      setPage(1)
    }
  }

  const handleExport = async () => {
    try {
      const exportData = await getContactsForExport({
        search,
        type: typeFilter,
        status: statusFilter,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
      })
      exportToCSV(exportData, contactColumns, getExportFilename('contacts'))
      const filterNote = hasActiveFilters ? ' (filtered)' : ''
      toast.success(`Exported ${exportData.length} contacts${filterNote} to CSV`)
    } catch (err) {
      console.error('Error exporting contacts:', err)
      toast.error('Failed to export contacts')
    }
  }

  // Build filter config for AdminFilterBar
  const filterConfig: FilterConfig[] = useMemo(() => [
    {
      type: 'select' as const,
      key: 'type',
      label: 'Type',
      value: typeFilter,
      onChange: (v: string) => handleTypeFilterChange(v as ContactType | 'all'),
      allLabel: 'All Types',
      options: Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      type: 'select' as const,
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: (v: string) => handleStatusFilterChange(v as ContactStatus | 'all'),
      allLabel: 'All Statuses',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
      ],
    },
    {
      type: 'daterange' as const,
      key: 'dateRange',
      label: 'Created Date',
      value: dateRange,
      onChange: handleDateRangeChange,
      placeholder: 'Filter by date',
      presets: true,
    },
  ], [typeFilter, statusFilter, dateRange])

  // Reset form
  const resetForm = () => {
    setFormData({
      contact_type: 'vendor',
      company_name: '',
      status: 'active',
    })
    setEditingContact(null)
  }

  // Open create dialog
  const handleCreate = () => {
    resetForm()
    setIsFormDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      contact_type: contact.contact_type,
      company_name: contact.company_name,
      contact_name: contact.contact_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      website: contact.website || '',
      address_line1: contact.address_line1 || '',
      address_line2: contact.address_line2 || '',
      city: contact.city || '',
      state: contact.state || '',
      postal_code: contact.postal_code || '',
      country: contact.country || 'US',
      account_number: contact.account_number || '',
      tax_id: contact.tax_id || '',
      payment_terms: contact.payment_terms || '',
      contract_start_date: contact.contract_start_date || '',
      contract_end_date: contact.contract_end_date || '',
      status: contact.status,
      notes: contact.notes || '',
    })
    setIsFormDialogOpen(true)
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.company_name.trim()) {
      toast.error('Company name is required')
      return
    }

    startTransition(async () => {
      try {
        if (editingContact) {
          await updateContact(editingContact.id, formData)
          toast.success('Contact updated successfully')
        } else {
          await createContact(formData)
          toast.success('Contact created successfully')
        }
        setIsFormDialogOpen(false)
        resetForm()
        loadData()
      } catch (err) {
        toast.error('Failed to save contact')
        console.error(err)
      }
    })
  }

  // Delete contact
  const handleDelete = async () => {
    if (!contactToDelete) return

    startTransition(async () => {
      try {
        await deleteContact(contactToDelete.id)
        toast.success('Contact deleted successfully')
        setIsDeleteDialogOpen(false)
        setContactToDelete(null)
        loadData()
      } catch (err) {
        toast.error('Failed to delete contact')
        console.error(err)
      }
    })
  }

  // Inline update type
  const handleTypeChange = (contact: Contact, newType: ContactType) => {
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, contact_type: newType } : c))
    )
    // Background save
    startTransition(async () => {
      try {
        await updateContact(contact.id, { contact_type: newType })
      } catch (err) {
        // Revert on error
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id ? { ...c, contact_type: contact.contact_type } : c
          )
        )
        toast.error('Failed to update type')
        console.error(err)
      }
    })
  }

  // Inline update status
  const handleStatusChange = (contact: Contact, newStatus: ContactStatus) => {
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, status: newStatus } : c))
    )
    // Background save
    startTransition(async () => {
      try {
        await updateContact(contact.id, { status: newStatus })
      } catch (err) {
        // Revert on error
        setContacts((prev) =>
          prev.map((c) => (c.id === contact.id ? { ...c, status: contact.status } : c))
        )
        toast.error('Failed to update status')
        console.error(err)
      }
    })
  }

  // Column definitions
  const columns: ColumnDef<Contact>[] = [
    {
      key: 'contact_name',
      header: 'Contact',
      sortable: true,
      cell: (contact) => (
        <div className="space-y-1">
          {contact.contact_name && (
            <p className="text-sm font-medium">{contact.contact_name}</p>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-3 w-3" />
              {contact.email}
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone.replace(/\D/g, '')}`}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3 w-3" />
              {contact.phone}
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'company_name',
      header: 'Company',
      sortable: true,
      cell: (contact) => (
        <div>
          {contact.website ? (
            <a
              href={contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {contact.company_name}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <p className="font-medium">{contact.company_name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'contact_type',
      header: 'Type',
      sortable: true,
      cell: (contact) => (
        <Select
          value={contact.contact_type}
          onValueChange={(v) => handleTypeChange(contact, v as ContactType)}
        >
          <SelectTrigger
            className="h-8 w-[140px]"
            onClick={(e) => e.stopPropagation()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: 'city',
      header: 'Location',
      sortable: true,
      cell: (contact) =>
        contact.city || contact.state ? (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {[contact.city, contact.state].filter(Boolean).join(', ')}
          </p>
        ) : null,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (contact) => (
        <Select
          value={contact.status}
          onValueChange={(v) => handleStatusChange(contact, v as ContactStatus)}
        >
          <SelectTrigger
            className="h-8 w-[110px]"
            onClick={(e) => e.stopPropagation()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ]

  // Row actions
  const getRowActions = (contact: Contact): RowAction<Contact>[] => [
    {
      label: 'Edit',
      onClick: () => handleEdit(contact),
      icon: <Edit className="h-4 w-4" />,
    },
    {
      label: 'Delete',
      onClick: () => {
        setContactToDelete(contact)
        setIsDeleteDialogOpen(true)
      },
      icon: <Trash2 className="h-4 w-4" />,
      destructive: true,
      separator: true,
    },
  ]

  return (
    <div className="p-8">
      <PageHeader
        title="Business Contacts"
        description="Manage vendors, suppliers, partners, and service providers"
        primaryAction={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <AdminFilterBar
          filters={filterConfig}
          onClearAll={handleClearFilters}
          showFilterIcon
        />
        <FilterPresetDropdown
          page="contacts"
          currentFilters={filters}
          onApplyPreset={handleApplyPreset}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <AdminDataTable
        data={contacts}
        columns={columns}
        keyField="id"
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search contacts..."
        loading={loading}
        error={error}
        onRetry={loadData}
        emptyTitle="No contacts found"
        emptyDescription="Add business contacts to manage your vendors, suppliers, and partners."
        emptyAction={{
          label: 'Add your first contact',
          onClick: handleCreate,
        }}
        rowActions={getRowActions}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_type">Type *</Label>
                <Select
                  value={formData.contact_type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, contact_type: v as ContactType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData({ ...formData, status: v as ContactStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Person</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="flex gap-1">
                  <Input
                    id="website"
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="https://"
                  />
                  {formData.website && (
                    <a
                      href={formData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-md border border-input bg-background hover:bg-accent"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Address</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={formData.address_line1 || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, address_line1: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={formData.address_line2 || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, address_line2: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, postal_code: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Business Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, account_number: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Input
                    id="payment_terms"
                    value={formData.payment_terms || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_terms: e.target.value })
                    }
                    placeholder="e.g., Net 30"
                  />
                </div>
              </div>
            </div>

            {/* Contract Dates */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Contract Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_start_date">Start Date</Label>
                  <Input
                    id="contract_start_date"
                    type="date"
                    value={formData.contract_start_date || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract_start_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_end_date">End Date</Label>
                  <Input
                    id="contract_end_date"
                    type="date"
                    value={formData.contract_end_date || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract_end_date: e.target.value,
                      })
                    }
                  />
                </div>
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
                ) : editingContact ? (
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{contactToDelete?.company_name}</strong>? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
