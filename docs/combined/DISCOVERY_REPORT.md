# EZCR Schema Discovery Report

Generated: 2026-01-01

## 1. Tenant Model

### Tenant Resolution
- **Method**: Environment variable (`EZCR_TENANT_ID`)
- **Type**: Single-tenant per deployment (not URL-based multi-tenancy)

### Membership Table: `user_profiles`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | User ID (references auth.users) |
| tenant_id | uuid | Tenant the user belongs to |
| email | varchar(255) | User email |
| first_name | varchar(100) | First name |
| last_name | varchar(100) | Last name |
| role | varchar(50) | User role |
| is_active | boolean | Active status |
| metadata | jsonb | Additional user data |

### Role Hierarchy
```
customer < viewer < customer_service < admin < owner
```

### Role Check Function
```sql
has_role(user_id UUID, required_role TEXT) RETURNS BOOLEAN
```
- Checks `is_active = true`
- Returns true if user's role level >= required role level

---

## 2. Orders Schema

### Table: `orders`
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| tenant_id | uuid | Tenant isolation |
| order_number | varchar(50) | Display label (e.g., EZCR-20260101-00001) |
| total_amount | decimal(10,2) | **Revenue source** |
| payment_status | varchar(50) | Filter for paid orders |
| status | varchar(50) | Order status |
| created_at | timestamptz | Order date |

### Revenue Calculation
```sql
SELECT SUM(total_amount)
FROM orders
WHERE tenant_id = $tenant_id
  AND payment_status = 'paid'
  AND created_at BETWEEN $date_from AND $date_to
```

---

## 3. Scheduler Schema

### Table: `nx_scheduler_booking`
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| tenant_id | uuid | Tenant isolation |
| booking_uid | text | Cal.com booking UID |
| status | enum | scheduled/cancelled/rescheduled |
| start_at | timestamptz | **Appointment start** |
| end_at | timestamptz | Appointment end |
| attendee_email | text | Attendee identifier |
| title | text | Booking title |

### Upcoming Appointments Query
```sql
SELECT *
FROM nx_scheduler_booking
WHERE tenant_id = $tenant_id
  AND status = 'scheduled'
  AND start_at >= NOW()
ORDER BY start_at ASC
```

---

## 4. Books (Finance) Schema

### Table: `books_bank_transactions`
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| tenant_id | uuid | Tenant isolation |
| posted_at | date | Transaction date |
| amount | numeric | **Signed amount** |
| currency | text | Currency code (default USD) |
| merchant | text | Payee/vendor name |
| merchant_norm | text | Normalized merchant name |
| description | text | Transaction memo |
| cleared | boolean | Reconciliation status |

### Sign Convention
- **Positive amount** = Income (money coming in)
- **Negative amount** = Expense (money going out)

### Expense Calculation
```sql
SELECT SUM(ABS(amount))
FROM books_bank_transactions
WHERE tenant_id = $tenant_id
  AND amount < 0
  AND cleared = true
  AND posted_at BETWEEN $date_from AND $date_to
```

### Category Inference (No Category Table)
Categories must be inferred from `merchant_norm` patterns:
- **Shipping**: Contains 'ups', 'fedex', 'usps', 'freight', 'shipping'
- **Supplies**: Contains 'supply', 'hardware', 'material'
- **Services**: Contains 'service', 'consulting', 'professional'
- **Utilities**: Contains 'electric', 'gas', 'water', 'internet', 'phone'
- **Other**: Everything else

### Related Tables
- `books_documents` - Receipt/invoice uploads
- `books_matches` - Receipt-to-transaction matching
- `books_settings` - Per-tenant Books configuration

---

## 5. Existing Helper Functions

### `update_updated_at_column()`
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
**Usage**: Apply to tables with `updated_at` column

### `has_role(user_id, required_role)`
Checks role hierarchy, requires `is_active = true`

### `nexcyte_tenant_id()`
Extracts tenant_id from JWT claims (used by Books RLS)

### `nx_is_tenant_member(tenant_id)`
Checks membership via `nx_tenant_membership` table

### `nx_is_tenant_admin(tenant_id)`
Checks admin/staff role via `nx_tenant_membership` table

---

## 6. RLS Patterns in Use

### Pattern 1: Direct auth.uid() check
```sql
CREATE POLICY "Users can view own" ON table
FOR SELECT USING (auth.uid() = id);
```

### Pattern 2: Tenant membership via user_profiles
```sql
CREATE POLICY "Members can view" ON table
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.tenant_id = table.tenant_id
    AND up.role IN ('admin', 'owner')
    AND up.is_active = true
  )
);
```

### Pattern 3: JWT tenant claim (Books module)
```sql
CREATE POLICY "Tenant access" ON table
FOR SELECT USING (tenant_id = public.nexcyte_tenant_id());
```

### Pattern 4: Service role bypass
```sql
CREATE POLICY "Service role full access" ON table
FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

## 7. Key Assumptions for Implementation

1. **Revenue Source**: Orders with `payment_status = 'paid'` (not Books income)
2. **Expense Source**: `books_bank_transactions` where `amount < 0 AND cleared = true`
3. **Tenant Context**: Server-side via `EZCR_TENANT_ID` env var
4. **Role Checks**: Use existing `has_role()` function
5. **No Explicit Categories**: Derive expense categories from merchant patterns
6. **Updated_at Trigger**: Reuse existing `update_updated_at_column()`
