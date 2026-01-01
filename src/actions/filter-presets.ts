'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'

// ============================================
// Types
// ============================================

export interface FilterPreset {
  id: string
  name: string
  page: string // 'orders' | 'crm' | 'audit' | 'scheduler' | etc.
  filters: Record<string, unknown>
  createdAt: string
}

interface UserMetadataWithPresets {
  crm_preferences?: {
    show_health_score?: boolean
  }
  filter_presets?: FilterPreset[]
}

// ============================================
// Helper Functions
// ============================================

async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  return user
}

async function getUserMetadata(userId: string): Promise<UserMetadataWithPresets> {
  const tenantId = await getTenantId()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('metadata')
    .eq('id', userId)
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    console.error('Error fetching user metadata:', error)
    return {}
  }

  return (data?.metadata as UserMetadataWithPresets) || {}
}

async function updateUserMetadata(
  userId: string,
  metadata: UserMetadataWithPresets
): Promise<void> {
  const tenantId = await getTenantId()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('user_profiles')
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error updating user metadata:', error)
    throw new Error('Failed to update user preferences')
  }
}

// ============================================
// Server Actions
// ============================================

/**
 * Save a new filter preset for the current user
 */
export async function saveFilterPreset(
  page: string,
  name: string,
  filters: Record<string, unknown>
): Promise<FilterPreset> {
  const user = await getCurrentUser()
  const metadata = await getUserMetadata(user.id)

  const newPreset: FilterPreset = {
    id: crypto.randomUUID(),
    name: name.trim(),
    page,
    filters,
    createdAt: new Date().toISOString(),
  }

  const existingPresets = metadata.filter_presets || []

  // Check for duplicate names on same page
  const duplicateName = existingPresets.find(
    (p) => p.page === page && p.name.toLowerCase() === name.trim().toLowerCase()
  )
  if (duplicateName) {
    throw new Error(`A preset named "${name}" already exists for this page`)
  }

  // Limit to 20 presets per user
  if (existingPresets.length >= 20) {
    throw new Error('Maximum of 20 presets reached. Please delete some to add new ones.')
  }

  const updatedMetadata: UserMetadataWithPresets = {
    ...metadata,
    filter_presets: [...existingPresets, newPreset],
  }

  await updateUserMetadata(user.id, updatedMetadata)

  return newPreset
}

/**
 * Get all filter presets for a specific page
 */
export async function getFilterPresets(page: string): Promise<FilterPreset[]> {
  const user = await getCurrentUser()
  const metadata = await getUserMetadata(user.id)

  const presets = metadata.filter_presets || []
  return presets.filter((p) => p.page === page).sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get all filter presets for the current user (all pages)
 */
export async function getAllFilterPresets(): Promise<FilterPreset[]> {
  const user = await getCurrentUser()
  const metadata = await getUserMetadata(user.id)

  return (metadata.filter_presets || []).sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Delete a filter preset by ID
 */
export async function deleteFilterPreset(presetId: string): Promise<void> {
  const user = await getCurrentUser()
  const metadata = await getUserMetadata(user.id)

  const existingPresets = metadata.filter_presets || []
  const presetIndex = existingPresets.findIndex((p) => p.id === presetId)

  if (presetIndex === -1) {
    throw new Error('Preset not found')
  }

  const updatedPresets = existingPresets.filter((p) => p.id !== presetId)

  const updatedMetadata: UserMetadataWithPresets = {
    ...metadata,
    filter_presets: updatedPresets,
  }

  await updateUserMetadata(user.id, updatedMetadata)
}

/**
 * Update an existing filter preset
 */
export async function updateFilterPreset(
  presetId: string,
  updates: { name?: string; filters?: Record<string, unknown> }
): Promise<FilterPreset> {
  const user = await getCurrentUser()
  const metadata = await getUserMetadata(user.id)

  const existingPresets = metadata.filter_presets || []
  const presetIndex = existingPresets.findIndex((p) => p.id === presetId)

  if (presetIndex === -1) {
    throw new Error('Preset not found')
  }

  const existingPreset = existingPresets[presetIndex]

  // Check for duplicate name if renaming
  if (updates.name && updates.name.trim().toLowerCase() !== existingPreset.name.toLowerCase()) {
    const duplicateName = existingPresets.find(
      (p) =>
        p.id !== presetId &&
        p.page === existingPreset.page &&
        p.name.toLowerCase() === updates.name!.trim().toLowerCase()
    )
    if (duplicateName) {
      throw new Error(`A preset named "${updates.name}" already exists for this page`)
    }
  }

  const updatedPreset: FilterPreset = {
    ...existingPreset,
    ...(updates.name ? { name: updates.name.trim() } : {}),
    ...(updates.filters ? { filters: updates.filters } : {}),
  }

  const updatedPresets = [...existingPresets]
  updatedPresets[presetIndex] = updatedPreset

  const updatedMetadata: UserMetadataWithPresets = {
    ...metadata,
    filter_presets: updatedPresets,
  }

  await updateUserMetadata(user.id, updatedMetadata)

  return updatedPreset
}
