'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Phone, Mail, MapPin, Calendar, Truck, Car, Bike, RefreshCw, Save, CheckCircle, AlertCircle, Clock, Package, Search } from 'lucide-react'
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
  configuration_id?: string | null
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
  estimated_delivery_date?: string | null
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
  // TForce tracking fields
  pro_number?: string | null
  delivery_signature?: string | null
  tracking_events?: TrackingEvent[] | null
  tracking_synced_at?: string | null
}

// TForce tracking event
interface TrackingEvent {
  date: string
  description: string
  displayDescription?: string
  serviceCenter?: string
  code?: string
}

interface OrderDetailSlideOutProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onStatusChange?: (orderId: string, newStatus: string) => void
  onProNumberSave?: (orderId: string, proNumber: string) => Promise<boolean>
  onBolNumberSave?: (orderId: string, bolNumber: string) => Promise<boolean>
  onTrackingSync?: (orderId: string) => Promise<Order | null>
  onSearchByBol?: (orderId: string, bolNumber: string) => Promise<Order | null>
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

function formatAddress(address: any, customerName?: string): string[] | null {
  if (!address) return null

  // Handle both naming conventions:
  // Original: line1, line2, city, state, postalCode
  // Shipping: street_address, apartment, city, state, zip_code
  // QBO import: line1=name, line2=address, city/state/zip often empty
  const line1 = address.line1 || address.street_address
  let line2 = address.line2 || address.apartment
  const zip = address.postalCode || address.postal_code || address.zip_code || address.zip

  // Detect QBO import pattern where line1 is the customer name
  // If line1 matches customer name and there's no explicit name field, skip line1
  const isQboPattern = !address.name &&
    line1 &&
    customerName &&
    line1.toLowerCase().trim() === customerName.toLowerCase().trim()

  // Build city/state/zip string
  let cityStateZip = [address.city, address.state, zip].filter(Boolean).join(', ')

  // Check if line2 contains embedded city/state/zip (QBO pattern like "Whitehouse, TX  75791")
  if (!cityStateZip && line2) {
    const embeddedMatch = line2.match(/^(.+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i)
    if (embeddedMatch) {
      // line2 is actually city, state zip - not a street address
      cityStateZip = `${embeddedMatch[1].trim()}, ${embeddedMatch[2]} ${embeddedMatch[3]}`
      line2 = null
    }
  }

  const parts = [
    address.name,
    isQboPattern ? null : line1,
    line2,
    cityStateZip,
    address.country && address.country !== 'US' && address.country !== 'USA' ? address.country : null
  ].filter(Boolean)
  return parts.length > 0 ? parts : null
}

export function OrderDetailSlideOut({
  open,
  onOpenChange,
  order,
  onStatusChange,
  onProNumberSave,
  onBolNumberSave,
  onTrackingSync,
  onSearchByBol,
  isUpdating = false,
  orderStatuses = DEFAULT_ORDER_STATUSES,
  showStatusSelector = true,
}: OrderDetailSlideOutProps) {
  const [proNumberInput, setProNumberInput] = useState('')
  const [bolNumberInput, setBolNumberInput] = useState('')
  const [isSavingPro, setIsSavingPro] = useState(false)
  const [isSavingBol, setIsSavingBol] = useState(false)
  const [isSyncingTracking, setIsSyncingTracking] = useState(false)
  const [isSearchingBol, setIsSearchingBol] = useState(false)
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const [localOrder, setLocalOrder] = useState<Order | null>(null)
  const previousOrderIdRef = useRef<string | null>(null)

  // Use localOrder if set (after tracking sync), otherwise use prop
  const displayOrder = localOrder || order

  // Reset all tracking state when order changes
  useEffect(() => {
    const currentOrderId = order?.id || null

    if (previousOrderIdRef.current !== currentOrderId) {
      // Order changed - reset all tracking-related state
      setProNumberInput(order?.pro_number || '')
      setBolNumberInput('')
      setTrackingError(null)
      setLocalOrder(null)
      setIsSavingPro(false)
      setIsSavingBol(false)
      setIsSyncingTracking(false)
      setIsSearchingBol(false)

      previousOrderIdRef.current = currentOrderId
    }
  }, [order?.id, order?.pro_number])

  if (!displayOrder) return null

  const handleSaveProNumber = async () => {
    if (!onProNumberSave || !displayOrder) return
    setIsSavingPro(true)
    setTrackingError(null)
    try {
      const success = await onProNumberSave(displayOrder.id, proNumberInput)
      if (!success) {
        setTrackingError('Failed to save PRO number')
      }
    } catch (err: any) {
      setTrackingError(err.message || 'Failed to save PRO number')
    } finally {
      setIsSavingPro(false)
    }
  }

  const handleSaveBolNumber = async () => {
    if (!onBolNumberSave || !displayOrder) return
    setIsSavingBol(true)
    setTrackingError(null)
    try {
      const success = await onBolNumberSave(displayOrder.id, bolNumberInput)
      if (success) {
        // Update local order with the new BOL number
        setLocalOrder({ ...displayOrder, bol_number: bolNumberInput })
      } else {
        setTrackingError('Failed to save BOL number')
      }
    } catch (err: any) {
      setTrackingError(err.message || 'Failed to save BOL number')
    } finally {
      setIsSavingBol(false)
    }
  }

  const handleSyncTracking = async () => {
    if (!onTrackingSync || !displayOrder) return
    setIsSyncingTracking(true)
    setTrackingError(null)
    try {
      const updatedOrder = await onTrackingSync(displayOrder.id)
      if (updatedOrder) {
        setLocalOrder(updatedOrder)
        // Update PRO input if it was found
        if (updatedOrder.pro_number) {
          setProNumberInput(updatedOrder.pro_number)
        }
      }
    } catch (err: any) {
      setTrackingError(err.message || 'Failed to sync tracking')
    } finally {
      setIsSyncingTracking(false)
    }
  }

  const handleSearchByBol = async () => {
    // Use the stored BOL number or the manually entered one
    const bolToSearch = displayOrder?.bol_number || bolNumberInput
    if (!onSearchByBol || !displayOrder || !bolToSearch) return
    setIsSearchingBol(true)
    setTrackingError(null)
    try {
      const updatedOrder = await onSearchByBol(displayOrder.id, bolToSearch)
      if (updatedOrder) {
        setLocalOrder(updatedOrder)
        // Update PRO input if it was found
        if (updatedOrder.pro_number) {
          setProNumberInput(updatedOrder.pro_number)
        }
        // Clear BOL input since it's now saved to the order
        setBolNumberInput('')
      }
    } catch (err: any) {
      setTrackingError(err.message || 'Failed to find shipment by BOL')
    } finally {
      setIsSearchingBol(false)
    }
  }

  // Use displayOrder for the rest of the component
  const order_ = displayOrder

  // Calculate subtotal from order_items if available, otherwise use stored value
  const calculatedSubtotal = order_.order_items && order_.order_items.length > 0
    ? order_.order_items.reduce((sum, item) => sum + (item.total_price || 0), 0)
    : order_.product_name && order_.product_price
      ? (order_.quantity || 1) * order_.product_price
      : null

  // Get shipping/tax/discount amounts (handle all naming conventions)
  // Use calculated subtotal if available, otherwise fall back to stored subtotal
  const subtotal = calculatedSubtotal ?? order_.subtotal ?? null
  const shippingAmount = order_.shipping_total ?? order_.shipping_amount ?? order_.shipping_cost ?? null
  const taxAmount = order_.tax_total ?? order_.tax_amount ?? null
  const discountAmount = order_.discount_total ?? order_.discount_amount ?? order_.promo_discount ?? null
  const grandTotal = order_.grand_total ?? order_.total_amount

  // Combine notes from different fields
  const allNotes = [order_.notes, order_.customer_notes, order_.internal_notes].filter(Boolean)

  // Check if this is a pickup order
  const isPickupOrder = order_.delivery_method === 'pickup'

  // Parse tracking status for display
  const getTrackingStatusBadge = () => {
    if (!order_.tracking_events?.length) return null
    const latestEvent = order_.tracking_events[0]
    const code = latestEvent.code || ''

    switch (code) {
      case '011':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
      case '006':
        return <Badge className="bg-purple-100 text-purple-800">Out for Delivery</Badge>
      case '005':
        return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>
      case '013':
        return <Badge className="bg-red-100 text-red-800">Exception</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{latestEvent.description}</Badge>
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Order {order_.order_number}
            {order_.qbo_sync_status === 'imported' && (
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                QBO Import
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* QBO Import Info */}
          {order_.qbo_sync_status === 'imported' && order_.qbo_invoice_id && (
            <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <div className="text-sm text-emerald-700 dark:text-emerald-400">
                Imported from QuickBooks Invoice #{order_.qbo_invoice_id}
                {order_.qbo_synced_at && (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-500">
                    on {format(new Date(order_.qbo_synced_at), 'MMM d, yyyy')}
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
                  value={order_.status}
                  onValueChange={(value) => onStatusChange(order_.id, value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-[140px] h-9">
                    <Badge className={`${getStatusColor(order_.status)} pointer-events-none capitalize`}>
                      {order_.status}
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
                <Badge className={`${getStatusColor(order_.status)} capitalize`}>{order_.status}</Badge>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Payment Status</div>
              <div className="flex items-center gap-2">
                <Badge className={`${getPaymentStatusColor(order_.payment_status)} text-sm`}>
                  {order_.payment_status}
                </Badge>
                {order_.payment_method && (
                  <span className="text-xs text-muted-foreground capitalize">({order_.payment_method})</span>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Created: {format(new Date(order_.created_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
            {order_.updated_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Updated: {format(new Date(order_.updated_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
          </div>

          {/* Shipping/Pickup Timeline */}
          {(!isPickupOrder && (order_.status === 'shipped' || order_.status === 'delivered' ||
            order_.shipped_at || order_.delivered_at || order_.expected_delivery_date || order_.estimated_delivery_date || order_.appointment_date ||
            order_.tracking_number || order_.bol_number || order_.pro_number)) && (
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipping Timeline
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {/* Status-based dates when explicit dates are missing */}
                {order_.shipped_at ? (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Shipped:</span> {format(new Date(order_.shipped_at), 'MMM d, yyyy')}
                  </div>
                ) : order_.status === 'shipped' || order_.status === 'delivered' ? (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Shipped:</span> <span className="italic">Date not recorded</span>
                  </div>
                ) : null}
                {(order_.delivered_at || order_.actual_delivery_date) ? (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Delivered:</span> {format(new Date(order_.delivered_at || order_.actual_delivery_date!), 'MMM d, yyyy')}
                  </div>
                ) : order_.status === 'delivered' ? (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Delivered:</span> <span className="italic">Date not recorded</span>
                  </div>
                ) : null}
                {(order_.expected_delivery_date || order_.estimated_delivery_date) && order_.status !== 'delivered' && !order_.delivered_at && !order_.actual_delivery_date && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Expected:</span> {format(new Date((order_.expected_delivery_date || order_.estimated_delivery_date)!), 'MMM d, yyyy')}
                  </div>
                )}
                {order_.appointment_date && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Appointment:</span> {format(new Date(order_.appointment_date), 'MMM d, yyyy')}
                  </div>
                )}
                {order_.estimated_transit_days && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Transit Time:</span> {order_.estimated_transit_days} days
                  </div>
                )}
                {/* Tracking info */}
                {order_.tracking_number && (
                  <div className="text-muted-foreground col-span-2">
                    <span className="font-medium">Tracking #:</span> {order_.tracking_number}
                    {order_.carrier && <span className="ml-1">({order_.carrier})</span>}
                  </div>
                )}
                {order_.bol_number && (
                  <div className="text-muted-foreground col-span-2">
                    <span className="font-medium">BOL #:</span> {order_.bol_number}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pickup Timeline */}
          {isPickupOrder && (order_.pickup_ready_at || order_.picked_up_at) && (
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Pickup Status
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {order_.pickup_ready_at && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Ready for Pickup:</span> {format(new Date(order_.pickup_ready_at), 'MMM d, yyyy')}
                  </div>
                )}
                {order_.picked_up_at && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Picked Up:</span> {format(new Date(order_.picked_up_at), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TForce Tracking Section */}
          {(onProNumberSave || onTrackingSync) && (
            <div className="border rounded-lg p-4 space-y-4 bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Package className="h-4 w-4" />
                  TForce Freight Tracking
                </h3>
                {getTrackingStatusBadge()}
              </div>

              {/* Find by BOL - show when BOL exists but no PRO */}
              {onSearchByBol && order_.bol_number && !order_.pro_number && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      BOL #{order_.bol_number} found
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Click to find the PRO number from TForce
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSearchByBol}
                    disabled={isSearchingBol}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {isSearchingBol ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span className="ml-1">Find PRO</span>
                  </Button>
                </div>
              )}

              {/* BOL Number Input - show when no BOL and no PRO exists (for historical orders) */}
              {onSearchByBol && !order_.bol_number && !order_.pro_number && (
                <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enter BOL Number for Historical Order
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter the Bill of Lading number to find tracking info from TForce
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter BOL number"
                      value={bolNumberInput}
                      onChange={(e) => setBolNumberInput(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    {onBolNumberSave && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSaveBolNumber}
                        disabled={isSavingBol || !bolNumberInput.trim()}
                        title="Save BOL number only"
                      >
                        {isSavingBol ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSearchByBol}
                      disabled={isSearchingBol || !bolNumberInput.trim()}
                      className="bg-amber-600 hover:bg-amber-700"
                      title="Find PRO and sync tracking"
                    >
                      {isSearchingBol ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      <span className="ml-1">Find PRO</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* PRO Number Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter PRO number (9 digits)"
                  value={proNumberInput}
                  onChange={(e) => setProNumberInput(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  className="flex-1"
                  maxLength={9}
                />
                {onProNumberSave && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveProNumber}
                    disabled={isSavingPro || proNumberInput.length !== 9 || proNumberInput === order_.pro_number}
                  >
                    {isSavingPro ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span className="ml-1">Save</span>
                  </Button>
                )}
                {onTrackingSync && order_.pro_number && (
                  <Button
                    size="sm"
                    onClick={handleSyncTracking}
                    disabled={isSyncingTracking}
                  >
                    {isSyncingTracking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span className="ml-1">Sync</span>
                  </Button>
                )}
              </div>

              {/* Error Message */}
              {trackingError && (
                <div className="flex items-start gap-2 p-3 text-sm bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-red-700 dark:text-red-300">{trackingError}</span>
                </div>
              )}

              {/* Tracking Info */}
              {order_.pro_number && (
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">PRO #:</span> {order_.pro_number}
                    {order_.tracking_synced_at && (
                      <span className="text-xs">
                        (synced {format(new Date(order_.tracking_synced_at), 'MMM d, h:mm a')})
                      </span>
                    )}
                  </div>
                  {order_.delivery_signature && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span>Signed by: {order_.delivery_signature}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tracking Events */}
              {order_.tracking_events && order_.tracking_events.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Tracking History</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {order_.tracking_events.map((event, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm py-1 border-b last:border-0">
                        <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span>{event.displayDescription || event.description}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {format(new Date(event.date), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          {event.serviceCenter && (
                            <div className="text-xs text-muted-foreground">{event.serviceCenter}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customer Info */}
          <div className="border rounded-lg p-4 space-y-2">
            <p className="font-medium text-lg">{order_.customer_name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${order_.customer_email}`} className="text-primary underline hover:no-underline">
                {order_.customer_email}
              </a>
            </div>
            {(order_.customer_phone || order_.shipping_address?.phone) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href={`tel:${order_.customer_phone || order_.shipping_address?.phone}`} className="text-primary underline hover:no-underline">
                  {order_.customer_phone || order_.shipping_address?.phone}
                </a>
              </div>
            )}
          </div>

          {/* Vehicle & Motorcycle Measurements */}
          {order_.configuration && (order_.configuration.vehicleInfo || order_.configuration.motorcycleInfo || order_.configuration.measurements) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Info */}
              {order_.configuration.vehicleInfo && (order_.configuration.vehicleInfo.make || order_.configuration.vehicleInfo.model) && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Vehicle</h3>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {[
                        order_.configuration.vehicleInfo.year,
                        order_.configuration.vehicleInfo.make,
                        order_.configuration.vehicleInfo.model
                      ].filter(Boolean).join(' ')}
                    </p>
                    {order_.configuration.measurements && (
                      <div className="text-muted-foreground space-y-0.5">
                        {order_.configuration.measurements.bedLengthClosed && (
                          <p>Bed Length (Closed): {order_.configuration.measurements.bedLengthClosed}&quot;</p>
                        )}
                        {order_.configuration.measurements.bedLengthOpen && (
                          <p>Bed Length (Open): {order_.configuration.measurements.bedLengthOpen}&quot;</p>
                        )}
                        {order_.configuration.measurements.loadHeight && (
                          <p>Load Height: {order_.configuration.measurements.loadHeight}&quot;</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Motorcycle Info */}
              {order_.configuration.motorcycleInfo && (order_.configuration.motorcycleInfo.make || order_.configuration.motorcycleInfo.model) && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bike className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Motorcycle</h3>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {[
                        order_.configuration.motorcycleInfo.year,
                        order_.configuration.motorcycleInfo.make,
                        order_.configuration.motorcycleInfo.model
                      ].filter(Boolean).join(' ')}
                    </p>
                    {order_.configuration.motorcycle && (
                      <div className="text-muted-foreground space-y-0.5">
                        {(order_.configuration.motorcycle.wheelbase ?? 0) > 0 && (
                          <p>Wheelbase: {order_.configuration.motorcycle.wheelbase}&quot;</p>
                        )}
                        {(order_.configuration.motorcycle.length ?? 0) > 0 && (
                          <p>Total Length: {order_.configuration.motorcycle.length}&quot;</p>
                        )}
                        {(order_.configuration.motorcycle.weight ?? 0) > 0 && (
                          <p>Weight: {order_.configuration.motorcycle.weight} lbs</p>
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
            {order_.shipping_address && formatAddress(order_.shipping_address, order_.customer_name) && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Shipping Address</h3>
                </div>
                <div className="text-sm space-y-1">
                  {formatAddress(order_.shipping_address, order_.customer_name)?.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  {(order_.delivery_method || order_.shipping_method) && (
                    <p>Method: {order_.delivery_method || order_.shipping_method}</p>
                  )}
                  {order_.shipping_address?.is_residential !== undefined && (
                    <p>{order_.shipping_address.is_residential ? 'Residential' : 'Commercial'} Address</p>
                  )}
                </div>
              </div>
            )}

            {/* Billing Address */}
            {order_.billing_address && formatAddress(order_.billing_address, order_.customer_name) && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Billing Address</h3>
                </div>
                <div className="text-sm space-y-1">
                  {formatAddress(order_.billing_address, order_.customer_name)?.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TForce Freight / Destination Terminal */}
          {order_.destination_terminal ? (
            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-700 dark:text-blue-300">TForce Freight Terminal</h3>
              </div>
              <div className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                {order_.destination_terminal.name && (
                  <p className="font-medium">{order_.destination_terminal.name}</p>
                )}
                {order_.destination_terminal.code && (
                  <p className="text-xs">Terminal Code: {order_.destination_terminal.code}</p>
                )}
                {order_.destination_terminal.address && (
                  <p>{order_.destination_terminal.address}</p>
                )}
                {(order_.destination_terminal.city || order_.destination_terminal.state || order_.destination_terminal.zip) && (
                  <p>
                    {[
                      order_.destination_terminal.city,
                      order_.destination_terminal.state,
                      order_.destination_terminal.zip
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Detect TForce freight pickup from shipping address (QBO import pattern)
            order_.shipping_address?.line2?.toLowerCase().includes('tforce') && (
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300">Freight Terminal Pickup</h3>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Customer will pick up at TForce Freight terminal
                </p>
              </div>
            )
          )}

          {/* Items */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Order Items</h3>
            <div className="divide-y">
              {order_.order_items && order_.order_items.length > 0 ? (
                order_.order_items.map((item) => (
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
              ) : order_.product_name ? (
                <div className="py-3 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className="font-medium">{order_.product_name}</p>
                      {order_.product_sku && (
                        <p className="text-xs text-muted-foreground">SKU: {order_.product_sku}</p>
                      )}
                      {order_.truck_bed_length && (
                        <p className="text-xs text-muted-foreground">Truck Bed: {order_.truck_bed_length}</p>
                      )}
                      {order_.tonneau_cover !== null && order_.tonneau_cover !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Tonneau Cover: {order_.tonneau_cover ? 'Yes' : 'No'}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {order_.quantity || 1} x {formatPrice(order_.product_price)}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatPrice((order_.quantity || 1) * (order_.product_price || 0))}
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
                  {order_.promo_code && <span className="ml-1 text-xs">({order_.promo_code})</span>}
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
              {order_.customer_notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Customer Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{order_.customer_notes}</p>
                </div>
              )}
              {order_.internal_notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Internal Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{order_.internal_notes}</p>
                </div>
              )}
              {order_.notes && !order_.customer_notes && !order_.internal_notes && (
                <p className="text-sm whitespace-pre-wrap">{order_.notes}</p>
              )}
            </div>
          )}

          {/* Recent Updates - derived from available timestamps */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Updates
            </h3>
            <div className="space-y-2 text-sm">
              {/* Latest status */}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Current Status</span>
                    <Badge className={`${getStatusColor(order_.status)} text-xs`}>
                      {order_.status}
                    </Badge>
                  </div>
                  {order_.updated_at && (
                    <p className="text-xs text-muted-foreground">
                      Last modified: {format(new Date(order_.updated_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery/Shipping events */}
              {(order_.delivered_at || order_.actual_delivery_date) && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">Delivered</span>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order_.delivered_at || order_.actual_delivery_date!), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {order_.shipped_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">Shipped</span>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order_.shipped_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {/* Tracking sync */}
              {order_.tracking_synced_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">Tracking Updated</span>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order_.tracking_synced_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {/* QBO sync */}
              {order_.qbo_synced_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">Imported from QuickBooks</span>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order_.qbo_synced_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {/* Order created */}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium">Order Created</span>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(order_.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
