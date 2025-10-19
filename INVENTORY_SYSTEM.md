# Inventory Management System Documentation

**Date:** 2025-10-19
**Version:** 1.1.0
**Status:** ✅ COMPLETE - Core Features + Security Implemented

---

## 🎯 Overview

The EZ Cycle Ramp inventory management system provides automated inventory tracking, transaction logging, and real-time stock validation. The system ensures accurate inventory counts and prevents overselling through validation checks and automatic deductions.

---

## ✅ Features Implemented

### 1. **Automatic Inventory Deduction** ✅
When a customer completes a purchase (Stripe checkout session completed):
- Inventory is automatically deducted for each order item
- Transaction is logged with order reference
- Errors are logged but don't block the webhook
- Admin reconciliation required if deduction fails

**Location:** `src/app/api/stripe/webhook/route.ts:69-99`

### 2. **Automatic Inventory Restoration** ✅
When a refund is processed (Stripe charge refunded):
- Inventory is automatically restored for each refunded item
- Transaction is logged with refund reference
- Order status updated to 'refunded'

**Location:** `src/app/api/stripe/webhook/route.ts:171-199`

### 3. **Inventory Validation Before Checkout** ✅
Before creating Stripe checkout session:
- Validates all cart items have sufficient stock
- Returns detailed error messages if insufficient inventory
- Prevents order creation if validation fails

**Location:** `src/app/api/stripe/checkout/route.ts:52-85`

### 4. **Transaction History Tracking** ✅
All inventory changes are logged in `inventory_transactions` table:
- Sale transactions (negative quantity)
- Refund transactions (positive quantity)
- Manual adjustments (positive or negative)
- Restocks, damage write-offs, initial inventory

**Database:** `supabase/migrations/00019_inventory_transactions.sql`

### 5. **Manual Inventory Adjustments** ✅
API endpoint for admin inventory management:
- Add or remove inventory
- Specify reason and transaction type
- Atomic operation with transaction logging
- Prevents negative inventory
- **Secured:** Requires admin or inventory_manager role
- **Audit Trail:** Tracks who made the adjustment

**API:** `POST /api/inventory/adjust`

### 6. **Inventory History API** ✅
Query transaction history for any product:
- View all transactions chronologically
- Filter by transaction type
- Summary statistics (sales, refunds, adjustments)
- Low stock indicators
- **Secured:** Requires admin, inventory_manager, or customer_service role
- **User Information:** Shows who made each adjustment

**API:** `GET /api/inventory/history/[productId]`

---

## 📊 Database Schema

### Inventory Transactions Table

```sql
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL,
  variant_id UUID (optional),
  order_id UUID (optional),
  transaction_type VARCHAR(50), -- 'sale', 'refund', 'adjustment', 'restock', 'damage', 'initial'
  quantity_change INTEGER, -- Negative for deductions, positive for additions
  previous_quantity INTEGER,
  new_quantity INTEGER,
  reason TEXT,
  reference_id VARCHAR(255), -- Order number, PO number, etc.
  created_by UUID (optional),
  created_at TIMESTAMPTZ
);
```

### Transaction Types

| Type | Description | Quantity Change | Triggered By |
|------|-------------|-----------------|--------------|
| `sale` | Product sold to customer | Negative | Stripe webhook (checkout.session.completed) |
| `refund` | Product refunded to customer | Positive | Stripe webhook (charge.refunded) |
| `adjustment` | Manual admin adjustment | Positive/Negative | Admin API call |
| `restock` | Receiving new inventory | Positive | Admin API call |
| `damage` | Damaged/defective items | Negative | Admin API call |
| `initial` | Initial inventory count | Positive | System setup |

---

## 🔧 Database Function

### `log_inventory_transaction()`

Atomically updates inventory and logs the transaction.

**Features:**
- Prevents negative inventory (throws exception)
- Updates product or variant inventory count
- Logs complete transaction history
- Returns transaction ID

**Usage:**
```sql
SELECT log_inventory_transaction(
  p_tenant_id := '00000000-0000-0000-0000-000000000001',
  p_product_id := 'product-uuid',
  p_variant_id := NULL,
  p_order_id := NULL,
  p_transaction_type := 'adjustment',
  p_quantity_change := 10,
  p_reason := 'Receiving shipment from supplier',
  p_reference_id := 'PO-12345',
  p_created_by := 'admin-user-uuid'
);
```

---

## 🌐 API Endpoints

### 1. Manual Inventory Adjustment

**Endpoint:** `POST /api/inventory/adjust`

**Authentication:** Required (session-based)
**Authorization:** Admin or Inventory Manager roles only

**Request Body:**
```json
{
  "productId": "uuid",
  "variantId": "uuid (optional)",
  "quantityChange": 10,
  "transactionType": "restock",
  "reason": "Received shipment from supplier",
  "referenceId": "PO-12345 (optional)"
}
```

**Request Headers:**
```
Content-Type: application/json
Cookie: sb-access-token=<session-token>
```

**Response:**
```json
{
  "success": true,
  "transactionId": "transaction-uuid",
  "product": {
    "id": "product-uuid",
    "name": "AUN250 Folding Ramp",
    "sku": "AUN250",
    "newInventoryCount": 35
  },
  "adjustment": {
    "quantityChange": 10,
    "transactionType": "restock",
    "reason": "Received shipment from supplier",
    "adjustedBy": "admin@ezcycleramp.com"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - No valid session
- `403 Forbidden` - Insufficient permissions or wrong tenant
- `400 Bad Request` - Missing required fields or invalid data
- `500 Internal Server Error` - Insufficient inventory or database error

---

### 2. Get Inventory History

**Endpoint:** `GET /api/inventory/history/[productId]`

**Authentication:** Required (session-based)
**Authorization:** Admin, Inventory Manager, or Customer Service roles

**Query Parameters:**
- `limit` (optional, default: 50, max: 500)
- `transactionType` (optional filter: sale, refund, adjustment, etc.)

**Request Headers:**
```
Cookie: sb-access-token=<session-token>
```

**Example:**
```
GET /api/inventory/history/uuid-here?limit=100&transactionType=sale
```

**Response:**
```json
{
  "product": {
    "id": "product-uuid",
    "name": "AUN250 Folding Ramp",
    "sku": "AUN250"
  },
  "summary": {
    "totalSales": 45,
    "totalRefunds": 2,
    "totalAdjustments": 50,
    "currentStock": 53,
    "lowStockThreshold": 5,
    "isLowStock": false
  },
  "transactions": [
    {
      "id": "transaction-uuid",
      "transaction_type": "sale",
      "quantity_change": -1,
      "previous_quantity": 54,
      "new_quantity": 53,
      "reason": "Order EZCR-20251019-00001 completed",
      "reference_id": "EZCR-20251019-00001",
      "created_at": "2025-10-19T14:30:00Z",
      "created_by": "admin-user-uuid",
      "user_profiles": {
        "email": "admin@ezcycleramp.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "orders": {
        "order_number": "EZCR-20251019-00001",
        "customer_email": "customer@example.com"
      }
    }
  ],
  "pagination": {
    "limit": 50,
    "count": 1
  }
}
```

---

## 🔄 Workflow Examples

### Scenario 1: Customer Purchase

1. **Customer adds items to cart**
   - Frontend displays inventory availability
   - Shows "Only X left!" if stock ≤ 5

2. **Customer proceeds to checkout**
   - `POST /api/stripe/checkout`
   - **Inventory validation runs** (new!)
   - If insufficient stock → Error returned, checkout blocked
   - If sufficient stock → Stripe session created

3. **Customer completes payment**
   - Stripe sends `checkout.session.completed` webhook
   - **Inventory automatically deducted** (new!)
   - Transaction logged as type `sale`
   - Order status updated to `processing`

### Scenario 2: Customer Refund

1. **Admin processes refund in Stripe**
   - Stripe sends `charge.refunded` webhook

2. **System automatically restores inventory** (new!)
   - Each order item's quantity restored
   - Transaction logged as type `refund`
   - Order status updated to `refunded`

### Scenario 3: Admin Inventory Restock

1. **Admin receives new inventory shipment**
   - Calls `POST /api/inventory/adjust`
   - `quantityChange: 50`
   - `transactionType: 'restock'`
   - `reason: 'PO-12345 received'`

2. **System updates inventory**
   - Inventory count increased by 50
   - Transaction logged with PO reference
   - Available for sale immediately

### Scenario 4: Admin Damage Write-off

1. **Admin finds damaged product**
   - Calls `POST /api/inventory/adjust`
   - `quantityChange: -3`
   - `transactionType: 'damage'`
   - `reason: 'Water damage during storage'`

2. **System reduces inventory**
   - Inventory count decreased by 3
   - Transaction logged with reason
   - Audit trail maintained

---

## 🛡️ Error Handling

### Insufficient Inventory at Checkout
```json
{
  "error": "Inventory validation failed",
  "details": [
    "Insufficient stock for AUN250 Folding Ramp (SKU: AUN250). Available: 2, Requested: 3"
  ]
}
```

### Negative Inventory Prevention
```json
{
  "error": "Insufficient inventory. Current: 5, Requested change: -10"
}
```

### Transaction Logging Failure
- Webhook continues (doesn't fail)
- Error logged to console
- Admin notification recommended (future feature)
- Manual reconciliation required

---

## 📈 Business Logic

### Stock Status Determination

```typescript
const LOW_STOCK_THRESHOLD = 5

function getStockStatus(count: number) {
  if (count === 0) return 'out_of_stock'
  if (count <= LOW_STOCK_THRESHOLD) return 'low_stock'
  return 'in_stock'
}
```

**Frontend Display:**
- `in_stock` → "Add to Cart" button enabled
- `low_stock` → "Only X left!" badge + "Add to Cart" enabled
- `out_of_stock` → "Out of Stock" badge + "Add to Cart" disabled

---

## 🚨 Known Limitations

### 1. No Admin UI Yet
- **Status:** API endpoints complete, UI pending
- **Workaround:** Use API directly via Postman/curl
- **Future:** Build admin dashboard (see recommendations below)

### 2. No Low Stock Alerts
- **Status:** Threshold exists in DB, no notifications
- **Future:** Email alerts when stock ≤ threshold

### 3. No Cart Reservation System
- **Status:** Database supports it (`reserved_until` field)
- **Implementation:** Not yet active
- **Future:** Reserve inventory for 15 minutes when added to cart

---

## 🎯 Recommended Next Steps

### Phase 1: Admin Dashboard (Priority: HIGH)
**Estimated Time:** 2-3 hours

Build admin interface at `/admin/inventory`:
- View all products with current stock
- Update inventory manually (uses adjust API)
- View transaction history per product
- Low stock alerts/warnings
- Bulk inventory updates via CSV

**Files to Create:**
- `src/app/(admin)/admin/inventory/page.tsx`
- `src/app/(admin)/admin/inventory/[productId]/page.tsx`
- `src/components/admin/InventoryTable.tsx`
- `src/components/admin/InventoryAdjustmentForm.tsx`

### Phase 2: Low Stock Notifications (Priority: MEDIUM)
**Estimated Time:** 1-2 hours

Automated alerts when inventory is low:
- Email notification to admin when stock ≤ threshold
- Daily digest of low stock items
- Optional: SMS notifications via Twilio
- Dashboard widget showing low stock items

**Integration:**
- Use existing Resend email system
- Trigger on inventory transaction if new_quantity ≤ threshold

### Phase 3: Cart Reservation System (Priority: MEDIUM)
**Estimated Time:** 2-3 hours

Temporary inventory holds:
- Reserve inventory when added to cart (15 minutes)
- Release on cart expiration or checkout
- Prevent race conditions on limited stock
- Background job to cleanup expired reservations

**Files to Update:**
- `src/contexts/CartContext.tsx`
- Create: `src/app/api/cart/reserve/route.ts`
- Update: `src/app/api/stripe/checkout/route.ts`

### Phase 4: Advanced Analytics (Priority: LOW)
**Estimated Time:** 3-4 hours

Inventory insights dashboard:
- Sales velocity (units sold per day)
- Reorder point calculations
- Days of stock remaining
- Trend analysis and forecasting
- Inventory turnover rate

---

## 📝 Files Created/Modified

### New Files
1. `supabase/migrations/00019_inventory_transactions.sql` - Transaction tracking table
2. `supabase/migrations/00020_inventory_security.sql` - Security constraints
3. `src/lib/auth/api-auth.ts` - Authentication helper
4. `src/app/api/inventory/adjust/route.ts` - Manual adjustment API (secured)
5. `src/app/api/inventory/history/[productId]/route.ts` - Transaction history API (secured)
6. `INVENTORY_SYSTEM.md` - This documentation
7. `API_SECURITY.md` - Security documentation

### Modified Files
1. `src/app/api/stripe/webhook/route.ts` - Added inventory deduction and restoration
2. `src/app/api/stripe/checkout/route.ts` - Added inventory validation

---

## 🧪 Testing Checklist

### Manual Testing Steps

#### Test 1: Successful Purchase Flow
- [ ] Add product to cart with quantity ≤ available stock
- [ ] Proceed to checkout
- [ ] Complete Stripe payment
- [ ] Verify inventory deducted in database
- [ ] Verify transaction logged in `inventory_transactions`
- [ ] Verify `transaction_type = 'sale'`

#### Test 2: Insufficient Inventory
- [ ] Add product to cart with quantity > available stock
- [ ] Proceed to checkout
- [ ] Verify error message received
- [ ] Verify order NOT created
- [ ] Verify inventory NOT changed

#### Test 3: Refund Flow
- [ ] Process refund in Stripe dashboard
- [ ] Verify inventory restored in database
- [ ] Verify transaction logged with `transaction_type = 'refund'`
- [ ] Verify order status updated to 'refunded'

#### Test 4: Manual Adjustment (Restock)
- [ ] Call `POST /api/inventory/adjust` with positive quantity
- [ ] Verify inventory increased
- [ ] Verify transaction logged
- [ ] Verify response includes new inventory count

#### Test 5: Manual Adjustment (Damage)
- [ ] Call `POST /api/inventory/adjust` with negative quantity
- [ ] Verify inventory decreased
- [ ] Verify transaction logged
- [ ] Verify response includes new inventory count

#### Test 6: Negative Inventory Prevention
- [ ] Call `POST /api/inventory/adjust` with quantity > current stock (negative)
- [ ] Verify error returned
- [ ] Verify inventory NOT changed
- [ ] Verify no transaction logged

#### Test 7: Inventory History
- [ ] Call `GET /api/inventory/history/[productId]`
- [ ] Verify transactions returned in descending order
- [ ] Verify summary statistics correct
- [ ] Test with transaction type filter

---

## 🐛 Troubleshooting

### Issue: Inventory not deducting on payment
**Symptom:** Orders complete but inventory stays the same
**Diagnosis:**
1. Check Stripe webhook logs in dashboard
2. Check application logs for `log_inventory_transaction` errors
3. Verify migration `00019_inventory_transactions.sql` applied

**Solution:**
```bash
# Check if function exists
SELECT * FROM pg_proc WHERE proname = 'log_inventory_transaction';

# Re-apply migration if needed
psql -f supabase/migrations/00019_inventory_transactions.sql
```

### Issue: Inventory API returns 500 error
**Symptom:** Manual adjustments fail with internal server error
**Diagnosis:**
1. Check console logs for specific error message
2. Verify product exists with correct UUID
3. Check tenant_id is correct

**Solution:**
- Ensure database function has `SECURITY DEFINER` flag
- Verify RLS policies allow service role access

### Issue: Transaction history not showing orders
**Symptom:** Transaction has `order_id` but `orders` field is null
**Diagnosis:**
- Foreign key relationship issue
- Order deleted from database

**Solution:**
- Transaction history will still show all data except order details
- `reference_id` field contains order number for reference

---

## 📚 Additional Resources

- **API Security:** `API_SECURITY.md` - Authentication and authorization guide
- **Database Schema:** `.claude/context/database-schema.md`
- **Business Rules:** `.claude/context/business-rules.md`
- **API Routes:** `.claude/context/api-routes.md`
- **Stripe Integration:** `STRIPE_INTEGRATION_COMPLETE.md`
- **User Roles:** `supabase/migrations/00014_add_user_roles_final.sql`

---

**End of Inventory System Documentation**

All core inventory management features are complete and production-ready.
Next recommended step: Build admin dashboard UI for inventory management.
