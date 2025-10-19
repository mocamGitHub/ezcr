# API Security Documentation

**Date:** 2025-10-19
**Version:** 1.0.0
**Status:** ✅ IMPLEMENTED

---

## 🔒 Overview

All inventory management APIs are now secured with authentication and role-based access control (RBAC). This prevents unauthorized access and ensures proper audit trails for all inventory changes.

---

## 🎯 Security Features Implemented

### 1. **Authentication Required** ✅
All inventory API endpoints require a valid user session:
- Session-based authentication via Supabase Auth
- Cookie-based session management
- Automatic session validation

### 2. **Role-Based Access Control (RBAC)** ✅
Different endpoints require different permission levels:
- **Inventory Adjustment:** Admin or Inventory Manager only
- **Inventory History:** Admin, Inventory Manager, or Customer Service

### 3. **Multi-Tenant Isolation** ✅
Users can only access data from their own tenant:
- Automatic tenant verification on all requests
- Prevents cross-tenant data access
- Database-level RLS policies enforce isolation

### 4. **Audit Trail** ✅
All manual inventory changes track who made them:
- `created_by` field stores user ID
- Transaction history includes user email and name
- Complete audit trail for compliance

---

## 👥 User Roles

### Role Definitions

| Role | Permissions | Use Case |
|------|-------------|----------|
| `admin` | Full access to all inventory operations | System administrators |
| `inventory_manager` | Can adjust inventory and view history | Warehouse managers, operations staff |
| `customer_service` | Can view inventory history (read-only) | Support staff helping customers |
| `customer` | No inventory access | Regular customers |

### Role Groups

```typescript
ROLE_GROUPS = {
  ADMIN_ROLES: ['admin'],
  INVENTORY_ROLES: ['admin', 'inventory_manager'],
  STAFF_ROLES: ['admin', 'inventory_manager', 'customer_service'],
  ALL_ROLES: ['admin', 'inventory_manager', 'customer_service', 'customer']
}
```

---

## 🔑 Authentication Helper

### Location
`src/lib/auth/api-auth.ts`

### Functions

#### `authenticateRequest(request: NextRequest)`
Validates user session and retrieves user profile.

**Returns:**
```typescript
{
  authenticated: boolean
  user: {
    id: string
    email: string
    role: string
    tenantId: string
  } | null
  error: string | null
}
```

#### `requireAuth(request: NextRequest)`
Requires valid authentication, returns user or error response.

**Usage:**
```typescript
const authResult = await requireAuth(request)
if ('error' in authResult) {
  return NextResponse.json(authResult.error, { status: authResult.status })
}
const { user } = authResult
```

#### `requireRole(request: NextRequest, allowedRoles: string[])`
Requires specific role(s), returns user or error response.

**Usage:**
```typescript
const authResult = await requireRole(request, ROLE_GROUPS.INVENTORY_ROLES)
if ('error' in authResult) {
  return NextResponse.json(authResult.error, { status: authResult.status })
}
const { user } = authResult
```

---

## 🛡️ Secured API Endpoints

### 1. Inventory Adjustment API

**Endpoint:** `POST /api/inventory/adjust`

**Authentication:** Required
**Authorization:** Admin or Inventory Manager roles only

**Security Checks:**
1. ✅ Valid session required
2. ✅ User must have `admin` or `inventory_manager` role
3. ✅ User must belong to the same tenant as the product
4. ✅ User ID tracked in transaction (`created_by`)

**Error Responses:**
- `401 Unauthorized` - No valid session
- `403 Forbidden` - Insufficient permissions or wrong tenant
- `400 Bad Request` - Invalid input data
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X POST https://ezcycleramp.com/api/inventory/adjust \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "productId": "uuid-here",
    "quantityChange": 10,
    "transactionType": "restock",
    "reason": "Received PO-12345"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "transactionId": "uuid",
  "product": {
    "id": "uuid",
    "name": "AUN250 Folding Ramp",
    "sku": "AUN250",
    "newInventoryCount": 60
  },
  "adjustment": {
    "quantityChange": 10,
    "transactionType": "restock",
    "reason": "Received PO-12345",
    "adjustedBy": "admin@ezcycleramp.com"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Authentication required"
}
```

**Error Response (403):**
```json
{
  "error": "Insufficient permissions",
  "requiredRoles": ["admin", "inventory_manager"],
  "userRole": "customer_service"
}
```

---

### 2. Inventory History API

**Endpoint:** `GET /api/inventory/history/[productId]`

**Authentication:** Required
**Authorization:** Admin, Inventory Manager, or Customer Service roles

**Security Checks:**
1. ✅ Valid session required
2. ✅ User must have `admin`, `inventory_manager`, or `customer_service` role
3. ✅ User must belong to the same tenant as the product

**Query Parameters:**
- `limit` (optional, default: 50, max: 500)
- `transactionType` (optional: sale, refund, adjustment, etc.)

**Error Responses:**
- `401 Unauthorized` - No valid session
- `403 Forbidden` - Insufficient permissions or wrong tenant
- `404 Not Found` - Product not found
- `500 Internal Server Error` - Server error

**Example Request:**
```bash
curl -X GET "https://ezcycleramp.com/api/inventory/history/uuid?limit=100" \
  -H "Cookie: sb-access-token=..."
```

**Success Response:**
```json
{
  "product": {
    "id": "uuid",
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
      "id": "uuid",
      "transaction_type": "restock",
      "quantity_change": 10,
      "previous_quantity": 50,
      "new_quantity": 60,
      "reason": "Received PO-12345",
      "reference_id": "PO-12345",
      "created_at": "2025-10-19T14:30:00Z",
      "created_by": "admin-user-uuid",
      "user_profiles": {
        "email": "admin@ezcycleramp.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "orders": null
    }
  ],
  "pagination": {
    "limit": 100,
    "count": 1
  }
}
```

---

## 🗄️ Database Changes

### New Migration: `00020_inventory_security.sql`

**Changes:**
1. Added foreign key constraint on `inventory_transactions.created_by`
2. Links to `user_profiles(id)` for audit trail
3. Added index for performance when querying by `created_by`
4. Sets `created_by` to NULL if user is deleted (preserves transaction history)

**SQL:**
```sql
ALTER TABLE inventory_transactions
  ADD CONSTRAINT inventory_transactions_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES user_profiles(id)
  ON DELETE SET NULL;

CREATE INDEX idx_inventory_transactions_created_by
  ON inventory_transactions(created_by)
  WHERE created_by IS NOT NULL;
```

---

## 🧪 Testing Authentication

### Test 1: Unauthenticated Request
```bash
curl -X POST https://ezcycleramp.com/api/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{"productId":"uuid","quantityChange":10,"transactionType":"restock","reason":"Test"}'
```

**Expected:** `401 Unauthorized` with message "Authentication required"

---

### Test 2: Insufficient Permissions
Login as customer, then:
```bash
curl -X POST https://ezcycleramp.com/api/inventory/adjust \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"productId":"uuid","quantityChange":10,"transactionType":"restock","reason":"Test"}'
```

**Expected:** `403 Forbidden` with message about insufficient permissions

---

### Test 3: Wrong Tenant
Login as admin of a different tenant, then:
```bash
curl -X POST https://ezcycleramp.com/api/inventory/adjust \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"productId":"uuid-from-different-tenant","quantityChange":10,"transactionType":"restock","reason":"Test"}'
```

**Expected:** `403 Forbidden` with message "Unauthorized: User does not belong to this tenant"

---

### Test 4: Valid Request
Login as admin or inventory_manager:
```bash
curl -X POST https://ezcycleramp.com/api/inventory/adjust \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"productId":"uuid","quantityChange":10,"transactionType":"restock","reason":"Test"}'
```

**Expected:** `200 OK` with success response and transaction details

---

## 🔐 Security Best Practices

### 1. Session Management
- Sessions are stored in HTTP-only cookies
- Automatic session refresh via Supabase Auth
- Session expiration handled automatically

### 2. Multi-Tenant Security
- Always verify user's `tenantId` matches resource's `tenant_id`
- Database RLS policies provide additional layer of protection
- Never trust client-provided tenant information

### 3. Role Assignment
- Roles are stored in `user_profiles.role`
- Default role is `customer`
- Only admins can change user roles
- Roles are verified on every request (not cached)

### 4. Audit Trail
- All manual adjustments track `created_by`
- Transaction history includes user email and name
- Automatic transactions (sales/refunds) have `created_by = null`
- Deleting a user doesn't delete transaction history

### 5. Error Messages
- Don't leak sensitive information in error messages
- Use generic "Authentication required" for 401
- Use generic "Insufficient permissions" for 403
- Log detailed errors server-side only

---

## 🚨 Security Considerations

### Current Limitations

1. **No API Key Authentication**
   - Currently only supports session-based auth
   - Future: Add API key support for integrations

2. **No Rate Limiting**
   - APIs can be called repeatedly
   - Future: Add rate limiting to prevent abuse

3. **No IP Whitelisting**
   - No restriction by IP address
   - Future: Add IP whitelisting for admin operations

4. **No 2FA Requirement**
   - Admin accounts don't require 2FA
   - Future: Require 2FA for admin role

### Recommended Enhancements

1. **Implement Rate Limiting** (~2 hours)
   - Limit requests per user per minute
   - Use Redis or database-based rate limiting
   - Different limits for different roles

2. **Add API Key Support** (~3 hours)
   - Allow integrations without session cookies
   - Scoped API keys with specific permissions
   - API key rotation and expiration

3. **Require 2FA for Admin** (~2 hours)
   - Enforce 2FA for users with admin role
   - Use TOTP (time-based one-time passwords)
   - Backup codes for recovery

4. **Add Security Logging** (~1 hour)
   - Log all authentication failures
   - Log all permission denials
   - Alert on suspicious activity

---

## 📚 Related Documentation

- **Inventory System:** `INVENTORY_SYSTEM.md`
- **Database Schema:** `.claude/context/database-schema.md`
- **User Roles Migration:** `supabase/migrations/00014_add_user_roles_final.sql`
- **Inventory Transactions:** `supabase/migrations/00019_inventory_transactions.sql`
- **Security Migration:** `supabase/migrations/00020_inventory_security.sql`

---

## 🎯 Implementation Checklist

- [x] Create authentication helper (`api-auth.ts`)
- [x] Secure inventory adjustment API
- [x] Secure inventory history API
- [x] Add user tracking to transactions
- [x] Add foreign key constraint for `created_by`
- [x] Update API documentation
- [ ] Test all authentication scenarios
- [ ] Test all authorization scenarios
- [ ] Test multi-tenant isolation
- [ ] Deploy to production
- [ ] Monitor for security issues

---

**End of API Security Documentation**

All inventory APIs are now secured with authentication and role-based access control.
User tracking provides complete audit trail for compliance.
Multi-tenant isolation prevents cross-tenant data access.

**IMPORTANT:** Test thoroughly before production deployment!
