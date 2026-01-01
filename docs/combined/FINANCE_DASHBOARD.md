# Finance Dashboard - Books Integration

## Overview

The Finance Dashboard integrates with the Books module to provide real-time financial metrics and analysis. This document covers the data mapping, sign conventions, and calculation methodology.

## Data Sources

### Revenue

**Primary Source**: `orders` table

```sql
SELECT SUM(total_amount)
FROM orders
WHERE tenant_id = p_tenant_id
  AND payment_status = 'paid'
  AND created_at BETWEEN p_date_from AND p_date_to
```

**Why Orders?**
- Represents actual sales transactions
- `payment_status = 'paid'` ensures only completed sales
- Direct mapping to business revenue

### Expenses

**Primary Source**: `books_bank_transactions` table

```sql
SELECT SUM(ABS(amount))
FROM books_bank_transactions
WHERE tenant_id = p_tenant_id
  AND amount < 0
  AND cleared = true
  AND posted_at BETWEEN p_date_from AND p_date_to
```

**Sign Convention**:
- **Positive amount**: Income/deposit
- **Negative amount**: Expense/withdrawal

**Why `cleared = true`?**
- Only counts reconciled transactions
- Avoids double-counting pending items
- Matches bank statement accuracy

## Key Metrics

### Revenue (MTD/YTD)

Sum of paid orders within the period.

```sql
revenue_mtd = SUM(orders.total_amount)
  WHERE payment_status = 'paid'
  AND created_at >= first_of_month
```

### Expenses (MTD/YTD)

Sum of negative bank transactions (absolute value).

```sql
expenses_mtd = SUM(ABS(books_bank_transactions.amount))
  WHERE amount < 0
  AND cleared = true
  AND posted_at >= first_of_month
```

### Profit (MTD/YTD)

```sql
profit_mtd = revenue_mtd - expenses_mtd
```

### Average Order Value (AOV)

```sql
avg_order_value = revenue_mtd / order_count
```

## Expense Categories

Since Books module doesn't have an explicit category table, expenses are categorized by pattern matching on `merchant_norm`:

| Category | Pattern Match |
|----------|---------------|
| Shipping | `%usps%`, `%ups%`, `%fedex%`, `%tforce%` |
| Supplies | `%amazon%`, `%home depot%`, `%supply%` |
| Services | `%service%`, `%consulting%`, `%software%` |
| Utilities | `%electric%`, `%gas%`, `%water%`, `%internet%` |
| Other | Everything else |

```sql
CASE
  WHEN merchant_norm ILIKE '%usps%' OR merchant_norm ILIKE '%ups%'
       OR merchant_norm ILIKE '%fedex%' THEN 'Shipping'
  WHEN merchant_norm ILIKE '%amazon%' OR merchant_norm ILIKE '%supply%'
       THEN 'Supplies'
  -- etc.
  ELSE 'Other'
END AS category
```

## Revenue Timeseries

Daily revenue buckets for trend visualization:

```sql
SELECT
  DATE_TRUNC('day', created_at) AS bucket_date,
  SUM(total_amount) AS amount
FROM orders
WHERE payment_status = 'paid'
  AND created_at BETWEEN p_date_from AND p_date_to
GROUP BY bucket_date
ORDER BY bucket_date
```

## Transaction Drilldown

Combined view of orders and bank transactions:

| Source | Fields Mapped |
|--------|---------------|
| Orders | order_number → payee, total_amount → amount |
| Bank Txns | merchant → payee, description → memo, amount |

## Assumptions & Limitations

### Documented Assumptions

1. **Revenue = Paid Orders**: We count order total_amount where payment_status='paid'
2. **Expenses = Cleared Negative Transactions**: Bank transactions with amount < 0 and cleared = true
3. **No Refunds Tracking**: Refunds are not explicitly tracked (would require orders.status filtering)
4. **Category Inference**: Expense categories derived from merchant name patterns
5. **Single Currency**: All amounts assumed to be USD

### Known Limitations

1. **No Accrual Accounting**: Cash-basis only (when transaction posts, not when incurred)
2. **Transfer Detection**: No explicit transfer flagging between accounts
3. **Tax Handling**: No separate tax tracking
4. **Multi-Currency**: Not supported

## RPC Reference

### nx_finance_kpis

Returns comprehensive financial KPIs:

```json
{
  "revenue_mtd": 12500.00,
  "revenue_ytd": 145000.00,
  "expenses_mtd": 8200.00,
  "expenses_ytd": 92000.00,
  "profit_mtd": 4300.00,
  "profit_ytd": 53000.00,
  "avg_order_value": 485.50,
  "order_count": 26,
  "refunds_total": null,
  "assumptions": [
    "Revenue from orders WHERE payment_status='paid'",
    "Expenses from books_bank_transactions WHERE amount < 0 AND cleared=true"
  ]
}
```

### nx_finance_revenue_timeseries

Returns daily revenue data:

```sql
RETURNS TABLE(bucket_date DATE, amount NUMERIC)
```

### nx_finance_expense_by_category

Returns expenses grouped by inferred category:

```sql
RETURNS TABLE(category TEXT, amount NUMERIC)
```

### nx_finance_transactions

Returns combined transaction list with pagination:

```sql
RETURNS TABLE(
  txn_date DATE,
  payee TEXT,
  memo TEXT,
  category TEXT,
  amount NUMERIC,
  source TEXT,
  ref_id UUID
)
```

## Extending Finance Data

### Adding New Metrics

1. Create new RPC following the standard signature
2. Add widget to finance dashboard
3. Update this documentation

### Custom Categories

To add custom expense categories, modify the CASE statement in `nx_finance_expense_by_category`:

```sql
WHEN merchant_norm ILIKE '%your_pattern%' THEN 'Your Category'
```

### Connecting Additional Data Sources

The RPC pattern supports `p_filters` JSONB for future extensions:

```sql
-- Example: Filter by specific bank account
p_filters := '{"account_id": "uuid"}'::jsonb
```

## Verification Queries

### Validate Revenue Calculation

```sql
SELECT
  SUM(total_amount) as calculated_revenue,
  COUNT(*) as order_count
FROM orders
WHERE tenant_id = 'your-tenant-id'
  AND payment_status = 'paid'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
```

### Validate Expense Calculation

```sql
SELECT
  SUM(ABS(amount)) as calculated_expenses,
  COUNT(*) as transaction_count
FROM books_bank_transactions
WHERE tenant_id = 'your-tenant-id'
  AND amount < 0
  AND cleared = true
  AND posted_at >= DATE_TRUNC('month', CURRENT_DATE);
```

### Compare KPI Output

```sql
SELECT nx_finance_kpis(
  'your-tenant-id'::uuid,
  DATE_TRUNC('month', CURRENT_DATE)::date,
  CURRENT_DATE::date,
  '{}'::jsonb
);
```
