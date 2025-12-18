// ============================================
// Admin Contacts & Tools Type Definitions
// ============================================

// ============================================
// CONTACT TYPES
// ============================================

export type ContactType =
  | 'vendor'
  | 'service_provider'
  | 'integration'
  | 'freight'
  | 'partner'
  | 'financial'
  | 'other'

export type ContactStatus = 'active' | 'inactive' | 'pending'

export interface Contact {
  id: string
  tenant_id: string

  // Contact Type
  contact_type: ContactType

  // Company Information
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null

  // Address
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string

  // Business Details
  account_number: string | null
  tax_id: string | null
  payment_terms: string | null

  // Contract Information
  contract_start_date: string | null
  contract_end_date: string | null

  // Status & Metadata
  status: ContactStatus
  tags: string[]
  notes: string | null

  // Timestamps
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface ContactFilters {
  search?: string
  type?: ContactType | 'all'
  status?: ContactStatus | 'all'
}

export interface ContactFormData {
  contact_type: ContactType
  company_name: string
  contact_name?: string
  email?: string
  phone?: string
  website?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  account_number?: string
  tax_id?: string
  payment_terms?: string
  contract_start_date?: string
  contract_end_date?: string
  status: ContactStatus
  tags?: string[]
  notes?: string
}

// ============================================
// TOOL TYPES
// ============================================

export type ToolCategory =
  | 'payment'
  | 'email'
  | 'sms'
  | 'analytics'
  | 'crm'
  | 'shipping'
  | 'accounting'
  | 'marketing'
  | 'development'
  | 'infrastructure'
  | 'security'
  | 'storage'
  | 'communication'
  | 'other'

export type ToolStatus = 'active' | 'inactive' | 'trial' | 'cancelled'

export type BillingCycle =
  | 'monthly'
  | 'quarterly'
  | 'semi_annual'
  | 'annual'
  | 'one_time'
  | 'usage_based'
  | 'free'

export type IntegrationStatus =
  | 'not_integrated'
  | 'in_progress'
  | 'integrated'
  | 'deprecated'

export interface Tool {
  id: string
  tenant_id: string

  // Tool Information
  name: string
  description: string | null
  category: ToolCategory

  // Vendor Link
  vendor_contact_id: string | null
  vendor_contact?: Contact | null // Joined data

  // URLs & Access
  website_url: string | null
  login_url: string | null
  documentation_url: string | null

  // Account Details
  account_email: string | null
  account_username: string | null
  api_key_name: string | null
  has_mfa: boolean
  mfa_method: string | null

  // Billing
  billing_cycle: BillingCycle | null
  cost_amount: number | null
  cost_currency: string

  // Renewal
  renewal_date: string | null
  auto_renew: boolean
  cancellation_notice_days: number

  // Integration Status
  integration_status: IntegrationStatus

  // Status & Metadata
  status: ToolStatus
  tags: string[]
  notes: string | null

  // Timestamps
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface ToolFilters {
  search?: string
  category?: ToolCategory | 'all'
  status?: ToolStatus | 'all'
  integration_status?: IntegrationStatus | 'all'
}

export interface ToolFormData {
  name: string
  description?: string
  category: ToolCategory
  vendor_contact_id?: string
  website_url?: string
  login_url?: string
  documentation_url?: string
  account_email?: string
  account_username?: string
  api_key_name?: string
  has_mfa?: boolean
  mfa_method?: string
  billing_cycle?: BillingCycle
  cost_amount?: number
  cost_currency?: string
  renewal_date?: string
  auto_renew?: boolean
  cancellation_notice_days?: number
  integration_status?: IntegrationStatus
  status: ToolStatus
  tags?: string[]
  notes?: string
}

// ============================================
// COST SUMMARY TYPES
// ============================================

export interface ToolCostSummary {
  tenant_id: string
  total_tools: number
  active_tools: number
  total_monthly_cost: number | null
  total_annual_cost: number | null
  payment_tools: number
  email_tools: number
  shipping_tools: number
  analytics_tools: number
  development_tools: number
}

export interface UpcomingRenewal {
  id: string
  tenant_id: string
  name: string
  category: ToolCategory
  renewal_date: string
  cost_amount: number | null
  billing_cycle: BillingCycle | null
  auto_renew: boolean
  cancellation_notice_days: number
  days_until_renewal: number
  urgency: 'critical' | 'warning' | 'upcoming' | 'ok'
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate monthly cost from any billing cycle
 */
export function calculateMonthlyCost(
  amount: number | null,
  billingCycle: BillingCycle | null
): number {
  if (!amount || !billingCycle) return 0

  switch (billingCycle) {
    case 'monthly':
      return amount
    case 'quarterly':
      return amount / 3
    case 'semi_annual':
      return amount / 6
    case 'annual':
      return amount / 12
    case 'one_time':
    case 'usage_based':
    case 'free':
      return 0
    default:
      return 0
  }
}

/**
 * Calculate annual cost from any billing cycle
 */
export function calculateAnnualCost(
  amount: number | null,
  billingCycle: BillingCycle | null
): number {
  if (!amount || !billingCycle) return 0

  switch (billingCycle) {
    case 'monthly':
      return amount * 12
    case 'quarterly':
      return amount * 4
    case 'semi_annual':
      return amount * 2
    case 'annual':
      return amount
    case 'one_time':
    case 'usage_based':
    case 'free':
      return 0
    default:
      return 0
  }
}

/**
 * Get days until renewal
 */
export function getDaysUntilRenewal(renewalDate: string | null): number | null {
  if (!renewalDate) return null

  const renewal = new Date(renewalDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  renewal.setHours(0, 0, 0, 0)

  const diffTime = renewal.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Get renewal urgency level
 */
export function getRenewalUrgency(
  daysUntilRenewal: number | null
): 'critical' | 'warning' | 'upcoming' | 'ok' | null {
  if (daysUntilRenewal === null) return null
  if (daysUntilRenewal <= 7) return 'critical'
  if (daysUntilRenewal <= 14) return 'warning'
  if (daysUntilRenewal <= 30) return 'upcoming'
  return 'ok'
}

// ============================================
// DISPLAY HELPERS
// ============================================

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  vendor: 'Vendor',
  service_provider: 'Service Provider',
  integration: 'Integration Partner',
  freight: 'Freight/Shipping',
  partner: 'Business Partner',
  financial: 'Financial',
  other: 'Other',
}

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  payment: 'Payment Processing',
  email: 'Email',
  sms: 'SMS/Messaging',
  analytics: 'Analytics',
  crm: 'CRM',
  shipping: 'Shipping',
  accounting: 'Accounting',
  marketing: 'Marketing',
  development: 'Development',
  infrastructure: 'Infrastructure',
  security: 'Security',
  storage: 'Storage',
  communication: 'Communication',
  other: 'Other',
}

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
  one_time: 'One-Time',
  usage_based: 'Usage-Based',
  free: 'Free',
}

export const STATUS_LABELS: Record<ToolStatus | ContactStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  trial: 'Trial',
  cancelled: 'Cancelled',
}

export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  not_integrated: 'Not Integrated',
  in_progress: 'In Progress',
  integrated: 'Integrated',
  deprecated: 'Deprecated',
}
