# Session Handoff - QBO Import & CRM Customer Detail Improvements

**Date**: 2025-12-20
**Time**: Evening Session
**Previous Commit**: `c1d89b0` - feat: Add QBO sync tool for QuickBooks Online integration
**Current Commit**: `874f5c7` - feat: QBO import tool & CRM customer detail improvements
**Current Status**: QBO data imported, CRM customer pages enhanced
**Branch**: main
**Dev Server**: Running at http://localhost:3000

---

## What Was Accomplished This Session

### QBO Import Tool
- Created `tools/qbo-import/` with scripts for importing QBO invoices to orders
- Built `backfill-order-items.ts` to populate order_items for imported orders
- Created placeholder product/variant for QBO imported line items
- **Successfully backfilled 207 orders with 759 order items** (21 skipped as shipping-only)

### CRM Customer Detail Page Improvements
- Made Orders the first/default tab (was Activity)
- Added custom breadcrumb showing customer name instead of email
- Fixed `getCustomerOrders` to properly fetch orders
- Fixed order total display (uses `grand_total` instead of `total_amount`)
- Fixed delivery status display (shows "Delivered" for delivered, "In Transit" for shipped)
- Removed redundant "Orders (n)" heading since count is in tab

### Admin Dashboard UI
- Added distinct colors to sidebar section headings:
  - Main: amber
  - Operations: blue
  - Customers: emerald
  - Admin: purple

### Database Changes
- Added migration `00028_orders_qbo_link.sql`:
  - `qbo_invoice_id` - Links orders to QBO invoices
  - `qbo_sync_status` - Tracks sync state (not_synced, synced, imported, sync_error)
  - `qbo_synced_at` - Timestamp of last sync

### Files Modified This Session (25+ files)
1. `src/components/crm/CustomerDetailView.tsx` - Orders first, custom breadcrumb
2. `src/components/crm/CustomerOrders.tsx` - Fixed total & delivery display
3. `src/components/crm/CustomerProfileCard.tsx` - Toast for Copy Email
4. `src/actions/crm.ts` - Fixed getCustomerOrders query
5. `src/config/admin-nav.ts` - Added section colors
6. `src/components/admin/AdminSidebar.tsx` - Use section colors
7. `src/app/globals.css` - CSS to hide admin breadcrumb on custom pages
8. `supabase/migrations/00028_orders_qbo_link.sql` - QBO link fields
9. `tools/qbo-import/src/index.ts` - Main import script
10. `tools/qbo-import/src/backfill-order-items.ts` - Order items backfill
11. `tools/qbo-import/src/transform.ts` - QBO to orders transformation
12. `tools/qbo-import/src/create-placeholder.ts` - Helper to create placeholder product

---

## Current State

### What's Working
- QBO invoices imported as orders with `qbo_sync_status = 'imported'`
- Order items populated for 207 QBO-imported orders
- CRM customer detail pages show orders with proper formatting
- Sidebar section headings have distinct colors
- Custom breadcrumb shows customer name

### What's NOT Working / Pending
- CSS `:has()` selector for hiding admin breadcrumb may not work in older browsers
- 21 orders skipped during backfill (shipping-only invoices with no product lines)

---

## Next Immediate Actions

### 1. Test Customer Detail Page
```bash
# Open in browser:
http://localhost:3000/admin/crm/adam@perrego.net
```

### 2. Verify Order Items
```bash
# Check order_items were created:
cd tools/qbo-import
DATABASE_URL="..." npx tsx -e "
const pg = require('pg');
const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});
pool.query('SELECT COUNT(*) FROM order_items').then(r => console.log(r.rows));
"
```

### 3. Close SSH Tunnel
The SSH tunnel to production database (port 54322) may still be running.

---

## How to Resume After /clear

Run the `/resume` command or:

```bash
# Check current state
git log --oneline -5
git status
npm run dev  # If server not running

# Read handoff document
cat SESSION_HANDOFF.md
```

---

## Technical Context

### QBO Import Tools
| Script | Description |
|--------|-------------|
| `index.ts` | Main import script (QBO invoices → orders) |
| `backfill-order-items.ts` | Adds order_items to existing imported orders |
| `create-placeholder.ts` | Creates placeholder product/variant |
| `transform.ts` | QBO data transformation utilities |

### Placeholder Product IDs
```
Product: 00000000-0000-0000-0001-000000000001
Variant: 00000000-0000-0000-0001-000000000002
```

### SSH Tunnel for Production DB
```bash
ssh -L 54322:localhost:5432 root@5.161.84.153
# Then use DATABASE_URL="postgresql://postgres:PASSWORD@localhost:54322/postgres"
```

---

## Known Issues / Blockers

1. **Older Browser Support**: CSS `:has()` selector used for hiding admin breadcrumb may not work in browsers before Chrome 105, Firefox 121, Safari 15.4

2. **Shipping-Only Orders**: 21 QBO invoices were skipped because they contained only shipping line items with no products

---

## Git Commit History

| Commit | Description |
|--------|-------------|
| `874f5c7` | feat: QBO import tool & CRM customer detail improvements |
| `c1d89b0` | feat: Add QBO sync tool for QuickBooks Online integration |
| `a3399e4` | feat: Add sortable table headers and optimistic updates |
| `d26d81b` | docs: Update session handoff for contacts & tools seed data |

---

**Session Status**: Complete
**Next Session**: Test CRM customer pages, potentially add product matching for QBO line items
**Handoff Complete**: 2025-12-20

🎉 207 orders backfilled with 759 order items from QBO!
