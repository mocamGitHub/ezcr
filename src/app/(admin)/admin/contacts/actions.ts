'use server'

import { createClient } from '@supabase/supabase-js'
import type {
  Contact,
  ContactFilters,
  ContactFormData,
  ContactType,
  ContactStatus,
} from '@/types/contacts-tools'

// Server-side client with service role key to bypass RLS
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
}

function getTenantId(): string {
  const tenantId = process.env.EZCR_TENANT_ID
  if (!tenantId) {
    throw new Error('EZCR_TENANT_ID environment variable is not set')
  }
  return tenantId
}

// ============================================
// GET CONTACTS (List with filters)
// ============================================

export async function getContacts(filters: ContactFilters = {}): Promise<Contact[]> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  let query = supabase
    .from('tenant_contacts')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('archived_at', null)
    .order('company_name', { ascending: true })

  // Apply filters
  if (filters.search) {
    query = query.or(
      `company_name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    )
  }

  if (filters.type && filters.type !== 'all') {
    query = query.eq('contact_type', filters.type)
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching contacts:', error)
    throw new Error('Failed to fetch contacts')
  }

  return data || []
}

// ============================================
// GET SINGLE CONTACT
// ============================================

export async function getContact(id: string): Promise<Contact | null> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('tenant_contacts')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    console.error('Error fetching contact:', error)
    throw new Error('Failed to fetch contact')
  }

  return data
}

// ============================================
// CREATE CONTACT
// ============================================

export async function createContact(data: ContactFormData): Promise<Contact> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  const { data: contact, error } = await supabase
    .from('tenant_contacts')
    .insert({
      tenant_id: tenantId,
      contact_type: data.contact_type,
      company_name: data.company_name,
      contact_name: data.contact_name || null,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      address_line1: data.address_line1 || null,
      address_line2: data.address_line2 || null,
      city: data.city || null,
      state: data.state || null,
      postal_code: data.postal_code || null,
      country: data.country || 'US',
      account_number: data.account_number || null,
      tax_id: data.tax_id || null,
      payment_terms: data.payment_terms || null,
      contract_start_date: data.contract_start_date || null,
      contract_end_date: data.contract_end_date || null,
      status: data.status,
      tags: data.tags || [],
      notes: data.notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating contact:', error)
    throw new Error('Failed to create contact')
  }

  return contact
}

// ============================================
// UPDATE CONTACT
// ============================================

export async function updateContact(
  id: string,
  data: Partial<ContactFormData>
): Promise<Contact> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  // Build update object, only including defined values
  const updateData: Record<string, unknown> = {}

  if (data.contact_type !== undefined) updateData.contact_type = data.contact_type
  if (data.company_name !== undefined) updateData.company_name = data.company_name
  if (data.contact_name !== undefined) updateData.contact_name = data.contact_name || null
  if (data.email !== undefined) updateData.email = data.email || null
  if (data.phone !== undefined) updateData.phone = data.phone || null
  if (data.website !== undefined) updateData.website = data.website || null
  if (data.address_line1 !== undefined) updateData.address_line1 = data.address_line1 || null
  if (data.address_line2 !== undefined) updateData.address_line2 = data.address_line2 || null
  if (data.city !== undefined) updateData.city = data.city || null
  if (data.state !== undefined) updateData.state = data.state || null
  if (data.postal_code !== undefined) updateData.postal_code = data.postal_code || null
  if (data.country !== undefined) updateData.country = data.country || 'US'
  if (data.account_number !== undefined) updateData.account_number = data.account_number || null
  if (data.tax_id !== undefined) updateData.tax_id = data.tax_id || null
  if (data.payment_terms !== undefined) updateData.payment_terms = data.payment_terms || null
  if (data.contract_start_date !== undefined) updateData.contract_start_date = data.contract_start_date || null
  if (data.contract_end_date !== undefined) updateData.contract_end_date = data.contract_end_date || null
  if (data.status !== undefined) updateData.status = data.status
  if (data.tags !== undefined) updateData.tags = data.tags || []
  if (data.notes !== undefined) updateData.notes = data.notes || null

  const { data: contact, error } = await supabase
    .from('tenant_contacts')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) {
    console.error('Error updating contact:', error)
    throw new Error('Failed to update contact')
  }

  return contact
}

// ============================================
// DELETE CONTACT (Soft Delete)
// ============================================

export async function deleteContact(id: string): Promise<void> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  const { error } = await supabase
    .from('tenant_contacts')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error deleting contact:', error)
    throw new Error('Failed to delete contact')
  }
}

// ============================================
// GET CONTACTS FOR DROPDOWN (minimal data)
// ============================================

export async function getContactsForDropdown(): Promise<
  Array<{ id: string; company_name: string; contact_type: ContactType }>
> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('tenant_contacts')
    .select('id, company_name, contact_type')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('archived_at', null)
    .order('company_name', { ascending: true })

  if (error) {
    console.error('Error fetching contacts for dropdown:', error)
    throw new Error('Failed to fetch contacts')
  }

  return data || []
}

// ============================================
// GET CONTACT STATS
// ============================================

export async function getContactStats(): Promise<{
  total: number
  byType: Record<ContactType, number>
  byStatus: Record<ContactStatus, number>
}> {
  const supabase = getAdminClient()
  const tenantId = getTenantId()

  const { data, error } = await supabase
    .from('tenant_contacts')
    .select('contact_type, status')
    .eq('tenant_id', tenantId)
    .is('archived_at', null)

  if (error) {
    console.error('Error fetching contact stats:', error)
    throw new Error('Failed to fetch contact stats')
  }

  const contacts = data || []

  const byType: Record<ContactType, number> = {
    vendor: 0,
    service_provider: 0,
    integration: 0,
    freight: 0,
    partner: 0,
    financial: 0,
    other: 0,
  }

  const byStatus: Record<ContactStatus, number> = {
    active: 0,
    inactive: 0,
    pending: 0,
  }

  contacts.forEach((c) => {
    if (c.contact_type in byType) {
      byType[c.contact_type as ContactType]++
    }
    if (c.status in byStatus) {
      byStatus[c.status as ContactStatus]++
    }
  })

  return {
    total: contacts.length,
    byType,
    byStatus,
  }
}
