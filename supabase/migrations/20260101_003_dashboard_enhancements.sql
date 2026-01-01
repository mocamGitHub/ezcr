-- Dashboard Enhancements Migration
-- 1. Fix payment_status filter ('paid' → 'succeeded')
-- 2. Add period comparison to finance KPIs
-- 3. Create combined timeseries RPC with all metrics

-- =============================================================================
-- 1) UPDATED FINANCE KPIs WITH COMPARISON
-- =============================================================================

CREATE OR REPLACE FUNCTION public.nx_finance_kpis(
  p_tenant_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_revenue NUMERIC := 0;
  v_revenue_prev NUMERIC := 0;
  v_expenses NUMERIC := 0;
  v_expenses_prev NUMERIC := 0;
  v_order_count INT := 0;
  v_order_count_prev INT := 0;
  v_period_days INT;
  v_prev_from DATE;
  v_prev_to DATE;
BEGIN
  -- Calculate period length and previous period dates
  v_period_days := p_date_to - p_date_from + 1;
  v_prev_to := p_date_from - 1;
  v_prev_from := v_prev_to - v_period_days + 1;

  -- Revenue from succeeded orders (current period)
  -- Note: orders table is single-tenant, uses grand_total, payment_status='succeeded'
  SELECT COALESCE(SUM(grand_total), 0), COUNT(*)
  INTO v_revenue, v_order_count
  FROM public.orders
  WHERE payment_status = 'succeeded'
    AND created_at::date >= p_date_from
    AND created_at::date <= p_date_to;

  -- Revenue (previous period)
  SELECT COALESCE(SUM(grand_total), 0), COUNT(*)
  INTO v_revenue_prev, v_order_count_prev
  FROM public.orders
  WHERE payment_status = 'succeeded'
    AND created_at::date >= v_prev_from
    AND created_at::date <= v_prev_to;

  -- Expenses from bank transactions (current period) - negative amounts
  SELECT COALESCE(SUM(ABS(amount)), 0)
  INTO v_expenses
  FROM public.books_bank_transactions
  WHERE tenant_id = p_tenant_id
    AND amount < 0
    AND cleared = true
    AND posted_at >= p_date_from
    AND posted_at <= p_date_to;

  -- Expenses (previous period)
  SELECT COALESCE(SUM(ABS(amount)), 0)
  INTO v_expenses_prev
  FROM public.books_bank_transactions
  WHERE tenant_id = p_tenant_id
    AND amount < 0
    AND cleared = true
    AND posted_at >= v_prev_from
    AND posted_at <= v_prev_to;

  RETURN jsonb_build_object(
    'revenue', v_revenue,
    'revenue_prev', v_revenue_prev,
    'expenses', v_expenses,
    'expenses_prev', v_expenses_prev,
    'profit', v_revenue - v_expenses,
    'profit_prev', v_revenue_prev - v_expenses_prev,
    'avg_order_value', CASE WHEN v_order_count > 0 THEN ROUND(v_revenue / v_order_count, 2) ELSE 0 END,
    'aov_prev', CASE WHEN v_order_count_prev > 0 THEN ROUND(v_revenue_prev / v_order_count_prev, 2) ELSE 0 END,
    'order_count', v_order_count,
    'order_count_prev', v_order_count_prev,
    'period_days', v_period_days
  );
END;
$$;

-- =============================================================================
-- 2) COMBINED FINANCE TIMESERIES (all metrics in one call)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.nx_finance_timeseries(
  p_tenant_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  bucket_date DATE,
  revenue NUMERIC,
  expenses NUMERIC,
  profit NUMERIC,
  order_count BIGINT,
  avg_order_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bucket_size TEXT;
BEGIN
  v_bucket_size := COALESCE(p_filters->>'bucket_size', 'day');

  RETURN QUERY
  WITH date_series AS (
    -- Generate all dates in range to ensure no gaps
    SELECT generate_series(p_date_from, p_date_to, '1 day'::interval)::date AS d
  ),
  bucketed_dates AS (
    SELECT DISTINCT
      CASE v_bucket_size
        WHEN 'week' THEN date_trunc('week', d)::date
        WHEN 'month' THEN date_trunc('month', d)::date
        ELSE d
      END AS bucket
    FROM date_series
  ),
  order_data AS (
    SELECT
      CASE v_bucket_size
        WHEN 'week' THEN date_trunc('week', o.created_at)::date
        WHEN 'month' THEN date_trunc('month', o.created_at)::date
        ELSE o.created_at::date
      END AS bucket,
      COALESCE(SUM(o.grand_total), 0) AS rev,
      COUNT(*)::bigint AS cnt
    FROM public.orders o
    WHERE o.payment_status = 'succeeded'
      AND o.created_at::date >= p_date_from
      AND o.created_at::date <= p_date_to
    GROUP BY 1
  ),
  expense_data AS (
    SELECT
      CASE v_bucket_size
        WHEN 'week' THEN date_trunc('week', t.posted_at)::date
        WHEN 'month' THEN date_trunc('month', t.posted_at)::date
        ELSE t.posted_at::date
      END AS bucket,
      COALESCE(SUM(ABS(t.amount)), 0) AS exp
    FROM public.books_bank_transactions t
    WHERE t.tenant_id = p_tenant_id
      AND t.amount < 0
      AND t.cleared = true
      AND t.posted_at >= p_date_from
      AND t.posted_at <= p_date_to
    GROUP BY 1
  )
  SELECT
    bd.bucket AS bucket_date,
    COALESCE(od.rev, 0) AS revenue,
    COALESCE(ed.exp, 0) AS expenses,
    COALESCE(od.rev, 0) - COALESCE(ed.exp, 0) AS profit,
    COALESCE(od.cnt, 0) AS order_count,
    CASE WHEN COALESCE(od.cnt, 0) > 0
      THEN ROUND(COALESCE(od.rev, 0) / od.cnt, 2)
      ELSE 0
    END AS avg_order_value
  FROM bucketed_dates bd
  LEFT JOIN order_data od ON od.bucket = bd.bucket
  LEFT JOIN expense_data ed ON ed.bucket = bd.bucket
  ORDER BY bd.bucket;
END;
$$;

-- =============================================================================
-- 3) FIX EXISTING RPCs - payment_status 'paid' → 'succeeded'
-- =============================================================================

-- Revenue timeseries (legacy, kept for compatibility)
CREATE OR REPLACE FUNCTION public.nx_finance_revenue_timeseries(
  p_tenant_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(bucket_date DATE, amount NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bucket_size TEXT;
BEGIN
  v_bucket_size := COALESCE(p_filters->>'bucket_size', 'day');

  RETURN QUERY
  SELECT
    CASE v_bucket_size
      WHEN 'week' THEN date_trunc('week', o.created_at)::date
      WHEN 'month' THEN date_trunc('month', o.created_at)::date
      ELSE o.created_at::date
    END AS bucket_date,
    COALESCE(SUM(o.grand_total), 0) AS amount
  FROM public.orders o
  WHERE o.payment_status = 'succeeded'
    AND o.created_at::date >= p_date_from
    AND o.created_at::date <= p_date_to
  GROUP BY 1
  ORDER BY 1;
END;
$$;

-- Finance transactions drilldown
CREATE OR REPLACE FUNCTION public.nx_finance_transactions(
  p_tenant_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  txn_date DATE,
  payee TEXT,
  memo TEXT,
  category TEXT,
  amount NUMERIC,
  source TEXT,
  ref_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit INT;
  v_offset INT;
BEGIN
  v_limit := COALESCE((p_filters->>'limit')::int, 100);
  v_offset := COALESCE((p_filters->>'offset')::int, 0);

  RETURN QUERY
  (
    -- Orders as income (payment_status = 'succeeded')
    SELECT
      o.created_at::date AS txn_date,
      COALESCE(o.customer_name, o.customer_email) AS payee,
      'Order ' || o.order_number AS memo,
      'Revenue' AS category,
      o.grand_total AS amount,
      'orders' AS source,
      o.id AS ref_id
    FROM public.orders o
    WHERE o.payment_status = 'succeeded'
      AND o.created_at::date >= p_date_from
      AND o.created_at::date <= p_date_to

    UNION ALL

    -- Bank transactions
    SELECT
      t.posted_at AS txn_date,
      COALESCE(t.merchant, 'Unknown') AS payee,
      t.description AS memo,
      CASE WHEN t.amount < 0 THEN 'Expense' ELSE 'Income' END AS category,
      t.amount AS amount,
      'books' AS source,
      t.id AS ref_id
    FROM public.books_bank_transactions t
    WHERE t.tenant_id = p_tenant_id
      AND t.cleared = true
      AND t.posted_at >= p_date_from
      AND t.posted_at <= p_date_to
  )
  ORDER BY txn_date DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

-- Orders by status (fix payment filter for revenue calculation)
CREATE OR REPLACE FUNCTION public.nx_orders_by_status(
  p_tenant_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(status TEXT, count BIGINT, total_amount NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.status,
    COUNT(*)::bigint,
    COALESCE(SUM(o.grand_total), 0)
  FROM public.orders o
  WHERE o.created_at::date >= p_date_from
    AND o.created_at::date <= p_date_to
  GROUP BY o.status
  ORDER BY COUNT(*) DESC;
END;
$$;

-- Orders aging
CREATE OR REPLACE FUNCTION public.nx_orders_aging(
  p_tenant_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  order_id UUID,
  order_number TEXT,
  age_days INT,
  status TEXT,
  total_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit INT;
BEGIN
  v_limit := COALESCE((p_filters->>'limit')::int, 20);

  RETURN QUERY
  SELECT
    o.id AS order_id,
    o.order_number,
    EXTRACT(DAY FROM (NOW() - o.created_at))::int AS age_days,
    o.status,
    o.grand_total
  FROM public.orders o
  WHERE o.status NOT IN ('completed', 'cancelled', 'delivered')
    AND o.created_at::date >= p_date_from
    AND o.created_at::date <= p_date_to
  ORDER BY o.created_at ASC
  LIMIT v_limit;
END;
$$;

SELECT 'Dashboard enhancements migration completed' as result;
