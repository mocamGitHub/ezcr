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
