'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTenantId as getEnvironmentTenantId } from '@/lib/tenant'

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function getTenantId(): Promise<string> {
  return await getEnvironmentTenantId()
}

async function requireStaffMember() {
  const supabase = await createClient()
  const tenantId = await getTenantId()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const serviceClient = createServiceClient()
  const { data: profile, error } = await serviceClient
    .from('user_profiles')
    .select('id, role')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !profile || !['owner', 'admin', 'customer_service'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }

  return { userId: user.id, profile }
}

// =====================================================
// TYPES
// =====================================================

export interface Testimonial {
  id: string
  user_id: string
  customer_name: string
  customer_email: string
  customer_avatar_url: string | null
  rating: number
  review_text: string
  product_id: string | null
  status: 'pending' | 'approved' | 'rejected'
  is_featured: boolean
  is_verified_customer: boolean
  admin_response: string | null
  admin_response_by: string | null
  admin_response_at: string | null
  approved_by: string | null
  approved_at: string | null
  rejected_by: string | null
  rejected_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface GetTestimonialsPaginatedParams {
  page?: number
  pageSize?: number
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  search?: string
  status?: 'all' | 'pending' | 'approved' | 'rejected'
  featured?: 'all' | 'featured' | 'not_featured'
  rating?: 'all' | '1' | '2' | '3' | '4' | '5'
  startDate?: string
  endDate?: string
}

export interface GetTestimonialsPaginatedResult {
  data: Testimonial[]
  totalCount: number
  page: number
  pageSize: number
}

// =====================================================
// GET TESTIMONIALS PAGINATED (for AdminDataTable)
// =====================================================

export async function getTestimonialsPaginated(
  params: GetTestimonialsPaginatedParams = {}
): Promise<GetTestimonialsPaginatedResult> {
  await requireStaffMember()

  const {
    page = 1,
    pageSize = 10,
    sortColumn = 'created_at',
    sortDirection = 'desc',
    search = '',
    status = 'all',
    featured = 'all',
    rating = 'all',
    startDate,
    endDate,
  } = params

  const supabase = createServiceClient()

  // Build base query
  let query = supabase
    .from('testimonials')
    .select('*', { count: 'exact' })

  // Apply status filter
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  // Apply featured filter
  if (featured === 'featured') {
    query = query.eq('is_featured', true)
  } else if (featured === 'not_featured') {
    query = query.eq('is_featured', false)
  }

  // Apply rating filter
  if (rating !== 'all') {
    query = query.eq('rating', parseInt(rating, 10))
  }

  // Apply date range filter
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  // Apply search filter
  if (search.trim()) {
    query = query.or(
      `customer_name.ilike.%${search.trim()}%,customer_email.ilike.%${search.trim()}%,review_text.ilike.%${search.trim()}%`
    )
  }

  // Apply sorting
  const validSortColumns = ['customer_name', 'rating', 'status', 'created_at', 'is_featured']
  const column = validSortColumns.includes(sortColumn) ? sortColumn : 'created_at'
  query = query.order(column, { ascending: sortDirection === 'asc', nullsFirst: false })

  // Apply pagination
  const offset = (page - 1) * pageSize
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching paginated testimonials:', error)
    throw new Error('Failed to fetch testimonials')
  }

  return {
    data: (data || []) as Testimonial[],
    totalCount: count || 0,
    page,
    pageSize,
  }
}

// =====================================================
// APPROVE TESTIMONIAL
// =====================================================

export async function approveTestimonial(id: string): Promise<Testimonial> {
  const { profile } = await requireStaffMember()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('testimonials')
    .update({
      status: 'approved',
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
      rejected_by: null,
      rejected_at: null,
      rejection_reason: null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error approving testimonial:', error)
    throw new Error('Failed to approve testimonial')
  }

  return data
}

// =====================================================
// REJECT TESTIMONIAL
// =====================================================

export async function rejectTestimonial(
  id: string,
  rejectionReason: string
): Promise<Testimonial> {
  const { profile } = await requireStaffMember()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('testimonials')
    .update({
      status: 'rejected',
      rejected_by: profile.id,
      rejected_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error rejecting testimonial:', error)
    throw new Error('Failed to reject testimonial')
  }

  return data
}

// =====================================================
// ADD/UPDATE ADMIN RESPONSE
// =====================================================

export async function respondToTestimonial(
  id: string,
  adminResponse: string
): Promise<Testimonial> {
  const { profile } = await requireStaffMember()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('testimonials')
    .update({
      admin_response: adminResponse,
      admin_response_by: profile.id,
      admin_response_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error responding to testimonial:', error)
    throw new Error('Failed to add response')
  }

  return data
}

// =====================================================
// TOGGLE FEATURED
// =====================================================

export async function toggleFeaturedTestimonial(
  id: string,
  isFeatured: boolean
): Promise<Testimonial> {
  await requireStaffMember()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('testimonials')
    .update({ is_featured: isFeatured })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error toggling featured:', error)
    throw new Error('Failed to update featured status')
  }

  return data
}

// =====================================================
// DELETE TESTIMONIAL
// =====================================================

export async function deleteTestimonial(id: string): Promise<void> {
  await requireStaffMember()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting testimonial:', error)
    throw new Error('Failed to delete testimonial')
  }
}

// =====================================================
// GET CUSTOMER ORDERS (for detail view)
// =====================================================

export interface CustomerOrder {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
}

export async function getCustomerOrders(email: string): Promise<CustomerOrder[]> {
  await requireStaffMember()
  const tenantId = await getTenantId()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, created_at')
    .eq('tenant_id', tenantId)
    .eq('customer_email', email)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching customer orders:', error)
    return []
  }

  return data || []
}

// =====================================================
// GET TESTIMONIALS FOR EXPORT (with filters)
// =====================================================

export interface GetTestimonialsForExportParams {
  search?: string
  status?: 'all' | 'pending' | 'approved' | 'rejected'
  featured?: 'all' | 'featured' | 'not_featured'
  rating?: 'all' | '1' | '2' | '3' | '4' | '5'
  startDate?: string
  endDate?: string
}

export async function getTestimonialsForExport(
  params: GetTestimonialsForExportParams = {}
): Promise<Testimonial[]> {
  await requireStaffMember()
  const supabase = createServiceClient()

  const {
    search = '',
    status = 'all',
    featured = 'all',
    rating = 'all',
    startDate,
    endDate,
  } = params

  let query = supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false })

  // Apply status filter
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  // Apply featured filter
  if (featured === 'featured') {
    query = query.eq('is_featured', true)
  } else if (featured === 'not_featured') {
    query = query.eq('is_featured', false)
  }

  // Apply rating filter
  if (rating !== 'all') {
    query = query.eq('rating', parseInt(rating, 10))
  }

  // Apply date range filter
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  // Apply search filter
  if (search.trim()) {
    query = query.or(
      `customer_name.ilike.%${search.trim()}%,customer_email.ilike.%${search.trim()}%,review_text.ilike.%${search.trim()}%`
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching testimonials for export:', error)
    throw new Error('Failed to fetch testimonials for export')
  }

  return (data || []) as Testimonial[]
}
