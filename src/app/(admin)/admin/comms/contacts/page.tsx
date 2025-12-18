'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Plus, Mail, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { getContacts, createContact } from '../actions'

type Contact = {
  id: string
  email: string | null
  phone_e164: string | null
  display_name: string | null
  created_at: string
  preferences?: Array<{
    channel: string
    consent_status: string
  }>
}

export default function ContactsPage() {
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newContact, setNewContact] = useState({
    email: '',
    phone: '',
    display_name: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getContacts(search || undefined)
      setContacts(data)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleCreateContact = async () => {
    if (!newContact.email && !newContact.phone) {
      alert('Please enter an email or phone number')
      return
    }

    setSaving(true)
    try {
      await createContact({
        email: newContact.email,
        phone: newContact.phone,
        display_name: newContact.display_name,
      })

      setDialogOpen(false)
      setNewContact({ email: '', phone: '', display_name: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating contact:', error)
      alert('Error creating contact')
    } finally {
      setSaving(false)
    }
  }

  const getConsentBadge = (preferences: Contact['preferences'], channel: string) => {
    const pref = preferences?.find(p => p.channel === channel)
    if (!pref) return null

    const color = pref.consent_status === 'opted_in'
      ? 'bg-green-100 text-green-700'
      : pref.consent_status === 'opted_out'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-700'

    return (
      <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>
        {pref.consent_status.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage communication contacts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Name</Label>
                  <Input
                    id="display_name"
                    value={newContact.display_name}
                    onChange={(e) => setNewContact({ ...newContact, display_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (E.164 format)</Label>
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="+15555551234"
                  />
                </div>
                <Button onClick={handleCreateContact} disabled={saving} className="w-full">
                  {saving ? 'Creating...' : 'Create Contact'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Contacts List */}
      <div className="bg-card border rounded-lg">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-[64px]" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {search ? 'No contacts found matching your search' : 'No contacts yet'}
          </div>
        ) : (
          <div className="divide-y">
            {contacts.map((contact) => (
              <div key={contact.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {contact.display_name || contact.email || contact.phone_e164 || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone_e164 && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone_e164}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.email && getConsentBadge(contact.preferences, 'email')}
                    {contact.phone_e164 && getConsentBadge(contact.preferences, 'sms')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
