import { z } from 'zod'

// =====================================================
// SHARED VALIDATION SCHEMAS FOR API ROUTES
// =====================================================

// --- Address Schema ---
export const addressSchema = z.object({
  street1: z.string().min(1, 'Street address is required').max(200),
  street2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(50),
  zip: z.string().min(5, 'ZIP code is required').max(20),
  country: z.string().default('US'),
})

// --- Cart Item Schema ---
export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1).max(200),
  productSku: z.string().optional(),
  productImage: z.string().url().optional().nullable(),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  configuration: z.record(z.string(), z.unknown()).optional(),
})

// --- Checkout Schema ---
export const checkoutSchema = z.object({
  cartItems: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
  customerEmail: z.string().email(),
  customerName: z.string().min(1, 'Name is required').max(200),
  customerPhone: z.string().min(10).max(20).optional(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  shippingQuoteId: z.string().uuid().optional().nullable(),
  destinationTerminal: z.string().max(100).optional().nullable(),
  estimatedTransitDays: z.number().int().positive().optional().nullable(),
  configurationId: z.string().uuid().optional().nullable(),
})

// --- Schedule Booking Schema ---
export const scheduleBookingSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required').max(100),
  start: z.string().datetime(),
  timeZone: z.string().min(1).max(100).default('America/Chicago'),
  notes: z.string().max(1000).optional(),
})

// --- Schedule Cancel Schema ---
export const scheduleCancelSchema = z.object({
  bookingUid: z.string().min(1, 'Booking ID is required'),
  reason: z.string().max(500).optional(),
})

// --- Schedule Reschedule Schema ---
export const scheduleRescheduleSchema = z.object({
  bookingUid: z.string().min(1, 'Booking ID is required'),
  newStart: z.string().datetime(),
  reason: z.string().max(500).optional(),
})

// --- FOMO Banner Schema ---
export const fomoBannerCreateSchema = z.object({
  enabled: z.boolean().default(true),
  type: z.string().min(1).max(50),
  message: z.string().min(1, 'Message is required').max(500),
  endDate: z.string().optional().nullable(),
  stockCount: z.number().int().min(0).optional().nullable(),
  stockThreshold: z.number().int().min(0).optional().nullable(),
  recentPurchases: z.number().int().min(0).optional().nullable(),
  visitorCount: z.number().int().min(0).optional().nullable(),
  backgroundColor: z.string().max(20).optional().nullable(),
  textColor: z.string().max(20).optional().nullable(),
  accentColor: z.string().max(20).optional().nullable(),
  position: z.enum(['top', 'bottom']).default('top'),
  dismissible: z.boolean().default(true),
  showIcon: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  priority: z.number().int().min(0).default(1),
})

export const fomoBannerUpdateSchema = fomoBannerCreateSchema.partial().extend({
  id: z.string().uuid(),
})

// --- Inventory Adjust Schema ---
export const inventoryAdjustSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  quantityChange: z.number().int().refine(val => val !== 0, { message: 'Quantity change cannot be zero' }),
  transactionType: z.enum(['adjustment', 'sale', 'return', 'restock', 'damage', 'transfer', 'initial']),
  reason: z.string().min(1, 'Reason is required').max(500),
  referenceId: z.string().uuid().optional().nullable(),
})

// --- Inventory Suppress Alert Schema ---
export const inventorySuppressAlertSchema = z.object({
  productId: z.string().uuid(),
  alertType: z.enum(['low_stock', 'out_of_stock']),
  suppress: z.boolean(),
})

// --- Calendar Subscription Schema ---
export const calendarSubscriptionCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  webcalUrl: z.string().url(),
  syncFrequencyMinutes: z.number().int().min(5).max(10080).default(60), // 5 min to 1 week
})

export const calendarSubscriptionUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  syncFrequencyMinutes: z.number().int().min(5).max(10080).optional(),
})

// --- Calendar Import Schema ---
export const calendarImportSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  icsContent: z.string().min(1, 'ICS content is required'),
})

// --- Comms Send Schema ---
export const commsSendSchema = z.object({
  tenantId: z.string().uuid(),
  contactId: z.string().uuid(),
  channel: z.enum(['email', 'sms']),
  templateVersionId: z.string().uuid(),
  variables: z.record(z.string(), z.string()).default({}),
  conversationId: z.string().uuid().optional(),
  idempotencyKey: z.string().max(100).optional(),
})

// --- Quote Email Schema ---
export const quoteEmailSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(20).optional(),
  vehicle: z.object({
    year: z.string().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
  }).optional(),
  measurements: z.object({
    wheelbase: z.number().optional(),
    trackWidth: z.number().optional(),
    groundClearance: z.number().optional(),
  }).optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
  quoteTotal: z.number().optional(),
})

// --- AI Chat Schema ---
export const aiChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(10000),
  })).min(1, 'At least one message is required'),
  configurationContext: z.record(z.string(), z.unknown()).optional(),
})

// --- AI Chat RAG Schema ---
export const aiChatRagSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(10000),
  })).min(1),
  sessionId: z.string().uuid().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
})

// --- Configuration Save Schema ---
export const configurationSaveSchema = z.object({
  configuration: z.record(z.string(), z.unknown()),
  total: z.number().min(0),
  userId: z.string().uuid().optional(),
})

// --- Shortcuts Schemas ---
export const shortcutsBlockTimeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  description: z.string().max(1000).optional(),
})

export const shortcutsCreateBookingLinkSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required').max(100),
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email(),
  notes: z.string().max(1000).optional(),
})

export const shortcutsRescheduleSchema = z.object({
  bookingUid: z.string().min(1, 'Booking ID is required'),
  newStartTime: z.string().datetime(),
  reason: z.string().max(500).optional(),
})

// --- Post Purchase Email Schema ---
export const postPurchaseEmailSchema = z.object({
  type: z.enum(['order_confirmation', 'shipping_update', 'delivery_confirmation', 'review_request']),
  orderId: z.string().uuid(),
  orderNumber: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  carrier: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
})

// =====================================================
// HELPER FUNCTION FOR VALIDATION
// =====================================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; details: z.ZodIssue[] } }

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    error: {
      message: 'Invalid request data',
      details: result.error.issues,
    },
  }
}
