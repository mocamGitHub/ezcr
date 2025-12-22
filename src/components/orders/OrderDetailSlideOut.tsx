'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, MapPin, Calendar, Truck, Car, Bike } from 'lucide-react'
import { format } from 'date-fns'

// Order and OrderItem interfaces
export interface OrderItem {
  id: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
}

// Configuration data from product_configurations
export interface ConfigurationData {
  contact?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }
  measurements?: {
    bedLengthClosed?: number
    bedLengthOpen?: number
    loadHeight?: number
  }
  motorcycle?: {
    weight?: number
    wheelbase?: number
    length?: number
  }
  vehicleInfo?: {
    make?: string | null
    model?: string | null
    year?: number | null
  }
  motorcycleInfo?: {
    make?: string | null
    model?: string | null
    year?: number | null
  }
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string | null
  status: string
  payment_status: string
  total_amount: number
  created_at: string
  updated_at?: string
  shipping_address: any
  billing_address?: any
  order_items?: OrderItem[]
  configuration?: ConfigurationData | null
  // QBO link fields
  qbo_invoice_id?: string | null
  qbo_sync_status?: string | null
  qbo_synced_at?: string | null
  // Product info (for QBO imports without order_items)
  product_name?: string | null
  product_sku?: string | null
  product_price?: number | null
  quantity?: number | null
  // Totals - handle multiple naming conventions
  grand_total?: number | null
  subtotal?: number | null
  shipping_total?: number | null
  shipping_amount?: number | null
  shipping_cost?: number | null
  tax_total?: number | null
  tax_amount?: number | null
  discount_total?: number | null
  discount_amount?: number | null
  // Delivery info
  delivery_method?: string | null
  shipping_method?: string | null
  tracking_number?: string | null
  carrier?: string | null
  bol_number?: string | null
  estimated_transit_days?: number | null
  destination_terminal?: {
    code?: string
    name?: string
    address?: string
    city?: string
    state?: string
    zip?: string
  } | null
  // Shipping timeline
  shipped_at?: string | null
  delivered_at?: string | null
  expected_delivery_date?: string | null
  actual_delivery_date?: string | null
  appointment_date?: string | null
  // Pickup details
  pickup_ready_at?: string | null
  pickup_notified_at?: string | null
  picked_up_at?: string | null
  // Notes - handle multiple field names
  notes?: string | null
  customer_notes?: string | null
  internal_notes?: string | null
  // Promo
  promo_code?: string | null
  promo_discount?: number | null
  // Additional product/shipping fields
  truck_bed_length?: string | null
  tonneau_cover?: boolean | null
  options?: any
  shipping_quote_id?: string | null
  payment_method?: string | null
}

interface OrderDetailSlideOutProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onStatusChange?: (orderId: string, newStatus: string) => void
  isUpdating?: boolean
  orderStatuses?: { value: string; label: string }[]
  showStatusSelector?: boolean
}

const DEFAULT_ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'canceled', label: 'Canceled' },
]

function formatPrice(amount: number | null | undefined): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0)
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'processing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'shipped':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'delivered':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'canceled':
    case 'refunded':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'paid':
    case 'succeeded':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'failed':
    case 'refunded':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

function formatAddress(address: any): string[] | null {
  if (!address) return null

  // Handle both naming conventions:
  // Original: line1, line2, city, state, postalCode
  // Shipping: street_address, apartment, city, state, zip_code
  const line1 = address.line1 || address.street_address
  const line2 = address.line2 || address.apartment
  const zip = address.postalCode || address.postal_code || address.zip_code || address.zip

  const parts = [
    address.name,
    line1,
    line2,
    [address.city, address.state, zip].filter(Boolean).join(', '),
    address.country && address.country !== 'US' && address.country !== 'USA' ? address.country : null
  ].filter(Boolean)
  return parts.length > 0 ? parts : null
}

export function OrderDetailSlideOut({
  open,
  onOpenChange,
  order,
  onStatusChange,
  isUpdating = false,
  orderStatuses = DEFAULT_ORDER_STATUSES,
  showStatusSelector = true,
}: OrderDetailSlideOutProps) {
  if (!order) return null

  // Calculate subtotal from order_items if available, otherwise use stored value
  const calculatedSubtotal = order.order_items && order.order_items.length > 0
    ? order.order_items.reduce((sum, item) => sum + (item.total_price || 0), 0)
    : order.product_name && order.product_price
      ? (order.quantity || 1) * order.product_price
      : null

  // Get shipping/tax/discount amounts (handle all naming conventions)
  // Use calculated subtotal if available, otherwise fall back to stored subtotal
  const subtotal = calculatedSubtotal ?? order.subtotal ?? null
  const shippingAmount = order.shipping_total ?? order.shipping_amount ?? order.shipping_cost ?? null
  const taxAmount = order.tax_total ?? order.tax_amount ?? null
  const discountAmount = order.discount_total ?? order.discount_amount ?? order.promo_discount ?? null
  const grandTotal = order.grand_total ?? order.total_amount

  // Combine notes from different fields
  const allNotes = [order.notes, order.customer_notes, order.internal_notes].filter(Boolean)

  // Check if this is a pickup order
  const isPickupOrder = order.delivery_method === 'pickup'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Order {order.order_number}
            {order.qbo_sync_status === 'imported' && (
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                QBO Import
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* QBO Import Info */}
          {order.qbo_sync_status === 'imported' && order.qbo_invoice_id && (
            <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <div className="text-sm text-emerald-700 dark:text-emerald-400">
                Imported from QuickBooks Invoice #{order.qbo_invoice_id}
                {order.qbo_synced_at && (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-500">
                    on {format(new Date(order.qbo_synced_at), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Status Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Order Status</div>
              {showStatusSelector && onStatusChange ? (
                <Select
                  value={order.status}
                  onValueChange={(value) => onStatusChange(order.id, value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-[140px] h-9">
                    <Badge className={`${getStatusColor(order.status)} pointer-events-none capitalize`}>
                      {order.status}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <Badge className={getStatusColor(status.value)}>
                          {status.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={`${getStatusColor(order.status)} capitalize`}>{order.status}</Badge>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Payment Status</div>
              <div className="flex items-center gap-2">
                <Badge className={`${getPaymentStatusColor(order.payment_status)} text-sm`}>
                  {order.payment_status}
                </Badge>
                {order.payment_method && (
                  <span className="text-xs text-muted-foreground capitalize">({order.payment_method})</span>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Created: {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
            {order.updated_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Updated: {format(new Date(order.updated_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
          </div>

          {/* Shipping/Pickup Timeline */}
          {(!isPickupOrder && (order.status === 'shipped' || order.status === 'delivered' ||
            order.shipped_at || order.delivered_at || order.expected_delivery_date || order.appointment_date ||
            order.tracking_number || order.bol_number)) && (
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipping Timeline
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {/* Status-based dates when explicit dates are missing */}
                {order.shipped_at ? (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Shipped:</span> {format(new Date(order.shipped_at), 'MMM d, yyyy')}
                  </div>
                ) : order.status === 'shipped' || order.status === 'delivered' ? (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Shipped:</span> <span className="italic">Date not recorded</span>
                  </div>
                ) : null}
                {(order.delivered_at || order.actual_delivery_date) ? (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Delivered:</span> {format(new Date(order.delivered_at || order.actual_delivery_date!), 'MMM d, yyyy')}
                  </div>
                ) : order.status === 'delivered' ? (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Delivered:</span> <span className="italic">Date not recorded</span>
                  </div>
                ) : null}
                {order.expected_delivery_date && order.status !== 'delivered' && !order.delivered_at && !order.actual_delivery_date && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Expected:</span> {format(new Date(order.expected_delivery_date), 'MMM d, yyyy')}
                  </div>
                )}
                {order.appointment_date && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Appointment:</span> {format(new Date(order.appointment_date), 'MMM d, yyyy')}
                  </div>
                )}
                {order.estimated_transit_days && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Transit Time:</span> {order.estimated_transit_days} days
                  </div>
                )}
                {/* Tracking info */}
                {order.tracking_number && (
                  <div className="text-muted-foreground col-span-2">
                    <span className="font-medium">Tracking #:</span> {order.tracking_number}
                    {order.carrier && <span className="ml-1">({order.carrier})</span>}
                  </div>
                )}
                {order.bol_number && (
                  <div className="text-muted-foreground col-span-2">
                    <span className="font-medium">BOL #:</span> {order.bol_number}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pickup Timeline */}
          {isPickupOrder && (order.pickup_ready_at || order.picked_up_at) && (
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Pickup Status
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {order.pickup_ready_at && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Ready for Pickup:</span> {format(new Date(order.pickup_ready_at), 'MMM d, yyyy')}
                  </div>
                )}
                {order.picked_up_at && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Picked Up:</span> {format(new Date(order.picked_up_at), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="border rounded-lg p-4 space-y-2">
            <p className="font-medium text-lg">{order.customer_name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${order.customer_email}`} className="text-primary underline hover:no-underline">
                {order.customer_email}
              </a>
            </div>
            {(order.customer_phone || order.shipping_address?.phone) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href={`tel:${order.customer_phone || order.shipping_address?.phone}`} className="text-primary underline hover:no-underline">
                  {order.customer_phone || order.shipping_address?.phone}
                </a>
              </div>
            )}
          </div>

          {/* Vehicle & Motorcycle Measurements */}
          {order.configuration && (order.configuration.vehicleInfo || order.configuration.motorcycleInfo || order.configuration.measurements) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Info */}
              {order.configuration.vehicleInfo && (order.configuration.vehicleInfo.make || order.configuration.vehicleInfo.model) && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Vehicle</h3>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {[
                        order.configuration.vehicleInfo.year,
                        order.configuration.vehicleInfo.make,
                        order.configuration.vehicleInfo.model
                      ].filter(Boolean).join(' ')}
                    </p>
                    {order.configuration.measurements && (
                      <div className="text-muted-foreground space-y-0.5">
                        {order.configuration.measurements.bedLengthClosed && (
                          <p>Bed Length (Closed): {order.configuration.measurements.bedLengthClosed}"</p>
                        )}
                        {order.configuration.measurements.bedLengthOpen && (
                          <p>Bed Length (Open): {order.configuration.measurements.bedLengthOpen}"</p>
                        )}
                        {order.configuration.measurements.loadHeight && (
                          <p>Load Height: {order.configuration.measurements.loadHeight}"</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Motorcycle Info */}
              {order.configuration.motorcycleInfo && (order.configuration.motorcycleInfo.make || order.configuration.motorcycleInfo.model) && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bike className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Motorcycle</h3>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {[
                        order.configuration.motorcycleInfo.year,
                        order.configuration.motorcycleInfo.make,
                        order.configuration.motorcycleInfo.model
                      ].filter(Boolean).join(' ')}
                    </p>
                    {order.configuration.motorcycle && (
                      <div className="text-muted-foreground space-y-0.5">
                        {order.configuration.motorcycle.wheelbase > 0 && (
                          <p>Wheelbase: {order.configuration.motorcycle.wheelbase}"</p>
                        )}
                        {order.configuration.motorcycle.length > 0 && (
                          <p>Total Length: {order.configuration.motorcycle.length}"</p>
                        )}
                        {order.configuration.motorcycle.weight > 0 && (
                          <p>Weight: {order.configuration.motorcycle.weight} lbs</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shipping Address */}
            {order.shipping_address && formatAddress(order.shipping_address) && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Shipping Address</h3>
                </div>
                <div className="text-sm space-y-1">
                  {formatAddress(order.shipping_address)?.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  {(order.delivery_method || order.shipping_method) && (
                    <p>Method: {order.delivery_method || order.shipping_method}</p>
                  )}
                  {order.shipping_address?.is_residential !== undefined && (
                    <p>{order.shipping_address.is_residential ? 'Residential' : 'Commercial'} Address</p>
                  )}
                </div>
              </div>
            )}

            {/* Billing Address */}
            {order.billing_address && formatAddress(order.billing_address) && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Billing Address</h3>
                </div>
                <div className="text-sm space-y-1">
                  {formatAddress(order.billing_address)?.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TForce Freight / Destination Terminal */}
          {order.destination_terminal && (
            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-700 dark:text-blue-300">TForce Freight Terminal</h3>
              </div>
              <div className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                {order.destination_terminal.name && (
                  <p className="font-medium">{order.destination_terminal.name}</p>
                )}
                {order.destination_terminal.code && (
                  <p className="text-xs">Terminal Code: {order.destination_terminal.code}</p>
                )}
                {order.destination_terminal.address && (
                  <p>{order.destination_terminal.address}</p>
                )}
                {(order.destination_terminal.city || order.destination_terminal.state || order.destination_terminal.zip) && (
                  <p>
                    {[
                      order.destination_terminal.city,
                      order.destination_terminal.state,
                      order.destination_terminal.zip
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Order Items</h3>
            <div className="divide-y">
              {order.order_items && order.order_items.length > 0 ? (
                order.order_items.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <p className="font-medium">{item.product_name}</p>
                        {item.product_sku && (
                          <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatPrice(item.unit_price)}
                        </p>
                      </div>
                      <p className="font-medium">{formatPrice(item.total_price)}</p>
                    </div>
                  </div>
                ))
              ) : order.product_name ? (
                <div className="py-3 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className="font-medium">{order.product_name}</p>
                      {order.product_sku && (
                        <p className="text-xs text-muted-foreground">SKU: {order.product_sku}</p>
                      )}
                      {order.truck_bed_length && (
                        <p className="text-xs text-muted-foreground">Truck Bed: {order.truck_bed_length}</p>
                      )}
                      {order.tonneau_cover !== null && order.tonneau_cover !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Tonneau Cover: {order.tonneau_cover ? 'Yes' : 'No'}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {order.quantity || 1} x {formatPrice(order.product_price)}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatPrice((order.quantity || 1) * (order.product_price || 0))}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-3">No items found</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            {subtotal !== undefined && subtotal !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            )}
            {shippingAmount !== null && shippingAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatPrice(shippingAmount)}</span>
              </div>
            )}
            {taxAmount !== null && taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPrice(taxAmount)}</span>
              </div>
            )}
            {discountAmount !== null && discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  Discount
                  {order.promo_code && <span className="ml-1 text-xs">({order.promo_code})</span>}
                </span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {/* Notes - show all note types */}
          {allNotes.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">Notes</h3>
              {order.customer_notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Customer Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{order.customer_notes}</p>
                </div>
              )}
              {order.internal_notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Internal Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{order.internal_notes}</p>
                </div>
              )}
              {order.notes && !order.customer_notes && !order.internal_notes && (
                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
