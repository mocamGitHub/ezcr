// src/lib/supabase/queries.ts
import { createClient } from './server'

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string | null
  display_order: number
  is_primary: boolean
}

export interface Product {
  id: string
  tenant_id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  base_price: number
  compare_at_price: number | null
  sku: string | null
  inventory_count: number
  is_active: boolean
  is_featured: boolean
  coming_soon: boolean
  coming_soon_date: string | null
  specifications: any | null
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
  // Relation to product_images
  product_images?: ProductImage[]
}

export interface ProductCategory {
  id: string
  tenant_id: string
  name: string
  slug: string
  description: string | null
  display_order: number
  created_at: string
  updated_at: string
}

const TENANT_ID = '00000000-0000-0000-0000-000000000001' // EZCR tenant

/**
 * Get all active products for EZCR tenant
 */
export async function getProducts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (
        id,
        url,
        alt_text,
        display_order,
        is_primary
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data as Product[]
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit = 3) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (
        id,
        url,
        alt_text,
        display_order,
        is_primary
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }

  return data as Product[]
}

/**
 * Get a single product by slug
 */
export async function getProductBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (
        id,
        url,
        alt_text,
        display_order,
        is_primary
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data as Product
}

/**
 * Get products by category
 */
export async function getProductsByCategory(categorySlug: string) {
  const supabase = await createClient()

  // First get the category
  const { data: category, error: categoryError } = await supabase
    .from('product_categories')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('slug', categorySlug)
    .single()

  if (categoryError || !category) {
    console.error('Error fetching category:', categoryError)
    return []
  }

  // Then get products in that category
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('category_id', category.id)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching products by category:', error)
    return []
  }

  return data as Product[]
}

/**
 * Get all product categories
 */
export async function getProductCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data as ProductCategory[]
}

export interface ProductFilters {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  availableOnly?: boolean
}

/**
 * Search and filter products
 */
export async function searchProducts(filters: ProductFilters) {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(`
      *,
      product_images (
        id,
        url,
        alt_text,
        display_order,
        is_primary
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('is_active', true)

  // Category filter
  if (filters.category) {
    const { data: category } = await supabase
      .from('product_categories')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('slug', filters.category)
      .single()

    if (category) {
      query = query.eq('category_id', category.id)
    }
  }

  // Search filter (name or description)
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`)
  }

  // Price range filter
  if (filters.minPrice !== undefined) {
    query = query.gte('base_price', filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('base_price', filters.maxPrice)
  }

  // Available only filter
  if (filters.availableOnly) {
    query = query.gt('inventory_count', 0).eq('coming_soon', false)
  }

  // Order results
  query = query
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error searching products:', error)
    return []
  }

  return data as Product[]
}

// ============================================
// Gallery Types and Queries
// ============================================

export interface GalleryCategory {
  id: string
  tenant_id: string
  name: string
  slug: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GalleryItem {
  id: string
  tenant_id: string
  category_id: string | null
  item_type: 'image' | 'video'
  title: string
  description: string | null
  caption: string | null
  image_url: string | null
  thumbnail_url: string | null
  video_url: string | null
  video_provider: 'youtube' | 'vimeo' | 'direct' | null
  video_embed_id: string | null
  video_duration: number | null
  alt_text: string | null
  tags: string[] | null
  is_featured: boolean
  display_order: number
  is_active: boolean
  meta_title: string | null
  meta_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  // Relations
  gallery_category?: GalleryCategory | null
}

/**
 * Get all gallery categories
 */
export async function getGalleryCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gallery_categories')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching gallery categories:', error)
    return []
  }

  return data as GalleryCategory[]
}

/**
 * Get all gallery items (images and videos)
 */
export async function getGalleryItems(categorySlug?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('gallery_items')
    .select(`
      *,
      gallery_category:category_id (
        id,
        name,
        slug
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('is_active', true)
    .lte('published_at', new Date().toISOString())

  // Filter by category if provided
  if (categorySlug) {
    const { data: category } = await supabase
      .from('gallery_categories')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('slug', categorySlug)
      .single()

    if (category) {
      query = query.eq('category_id', category.id)
    }
  }

  query = query
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching gallery items:', error)
    return []
  }

  return data as GalleryItem[]
}

/**
 * Get featured gallery items
 */
export async function getFeaturedGalleryItems(limit = 6) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gallery_items')
    .select(`
      *,
      gallery_category:category_id (
        id,
        name,
        slug
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('is_active', true)
    .eq('is_featured', true)
    .lte('published_at', new Date().toISOString())
    .order('display_order', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured gallery items:', error)
    return []
  }

  return data as GalleryItem[]
}

/**
 * Get gallery items by type (image or video)
 */
export async function getGalleryItemsByType(itemType: 'image' | 'video') {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gallery_items')
    .select(`
      *,
      gallery_category:category_id (
        id,
        name,
        slug
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('item_type', itemType)
    .eq('is_active', true)
    .lte('published_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching gallery items by type:', error)
    return []
  }

  return data as GalleryItem[]
}
