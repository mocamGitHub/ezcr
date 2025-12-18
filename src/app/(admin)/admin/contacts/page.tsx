'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
} from '@/components/ui/table'
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from './actions'
import type {
  Contact,
  ContactFormData,
  ContactType,
  ContactStatus,
  ContactFilters,
} from '@/types/contacts-tools'
import { CONTACT_TYPE_LABELS, STATUS_LABELS } from '@/types/contacts-tools'

// ============================================
// CONTACTS PAGE
// ============================================

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<ContactType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all')

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

  // Messages
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch contacts
  useEffect(() => {
    fetchContacts()
  }, [typeFilter, statusFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchContacts = async () => {
    setIsLoading(true)
    try {
      const filters: ContactFilters = {
        search: searchQuery || undefined,
        type: typeFilter,
        status: statusFilter,
      }
      const data = await getContacts(filters)
      setContacts(data)
    } catch (err) {
      setError('Failed to load contacts')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

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
    setError(null)

    if (!formData.company_name.trim()) {
      setError('Company name is required')
      return
    }

    startTransition(async () => {
      try {
        if (editingContact) {
          await updateContact(editingContact.id, formData)
          setSuccessMessage('Contact updated successfully')
        } else {
          await createContact(formData)
          setSuccessMessage('Contact created successfully')
        }
        setIsFormDialogOpen(false)
        resetForm()
        fetchContacts()
      } catch (err) {
        setError('Failed to save contact')
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
        setSuccessMessage('Contact deleted successfully')
        setIsDeleteDialogOpen(false)
        setContactToDelete(null)
        fetchContacts()
      } catch (err) {
        setError('Failed to delete contact')
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

  // Get status badge variant
  const getStatusBadgeVariant = (status: ContactStatus) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'pending':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            Business Contacts
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage vendors, suppliers, partners, and service providers
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
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

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as ContactType | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ContactStatus | 'all')}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No contacts found</p>
            <Button variant="outline" onClick={handleCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add your first contact
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contact.company_name}</p>
                      {contact.website && (
                        <a
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          Website
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {CONTACT_TYPE_LABELS[contact.contact_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {contact.contact_name && (
                        <p className="text-sm">{contact.contact_name}</p>
                      )}
                      {contact.email && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </p>
                      )}
                      {contact.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(contact.city || contact.state) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[contact.city, contact.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(contact.status)}>
                      {STATUS_LABELS[contact.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setContactToDelete(contact)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

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
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete{' '}
            <strong>{contactToDelete?.company_name}</strong>? This action cannot
            be undone.
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
