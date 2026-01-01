-- =============================================================================
-- EZCR Dashboards System Migration
-- Version: 1.0.0
-- Date: 2026-01-01
-- =============================================================================
-- This migration creates:
-- 1. Dashboard registry tables (nx_dashboards, nx_widgets, etc.)
-- 2. Finance RPCs (backed by Books + Orders)
-- 3. Tasks RPCs (backed by Tasks MVP tables)
-- 4. Orders/Scheduling RPCs
-- 5. Seeds for default dashboards and widgets
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1) DASHBOARD REGISTRY TABLES
-- =============================================================================

-- Dashboard definitions
CREATE TABLE IF NOT EXISTS public.nx_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  icon TEXT,
  position INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_nx_dashboards_tenant ON public.nx_dashboards(tenant_id);

-- Widget definitions
CREATE TABLE IF NOT EXISTS public.nx_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  dashboard_id UUID NOT NULL REFERENCES public.nx_dashboards(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  widget_type TEXT NOT NULL, -- kpi, timeseries, table, bar, donut
  title TEXT NOT NULL,
  subtitle TEXT,
  rpc_name TEXT, -- Name of RPC function to call
  rpc_args JSONB NOT NULL DEFAULT '{}'::jsonb, -- Additional args for RPC
  display_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- icon, color, format, etc.
  position INT NOT NULL DEFAULT 0,
  grid_config JSONB NOT NULL DEFAULT '{"col": 0, "row": 0, "width": 1, "height": 1}'::jsonb,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dashboard_id, key)
);

CREATE INDEX IF NOT EXISTS idx_nx_widgets_dashboard ON public.nx_widgets(dashboard_id);

-- Dashboard layouts (for responsive breakpoints)
CREATE TABLE IF NOT EXISTS public.nx_dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES public.nx_dashboards(id) ON DELETE CASCADE,
  breakpoint TEXT NOT NULL, -- sm, md, lg, xl
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dashboard_id, breakpoint)
);

-- Saved views (user-saved filter configurations)
CREATE TABLE IF NOT EXISTS public.nx_saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  dashboard_id UUID NOT NULL REFERENCES public.nx_dashboards(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nx_saved_views_dashboard ON public.nx_saved_views(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_nx_saved_views_owner ON public.nx_saved_views(owner_id);

-- =============================================================================
-- 2) RLS POLICIES FOR DASHBOARD TABLES
-- =============================================================================

ALTER TABLE public.nx_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nx_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nx_dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nx_saved_views ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY "service_role_all_nx_dashboards" ON public.nx_dashboards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_nx_widgets" ON public.nx_widgets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_nx_dashboard_layouts" ON public.nx_dashboard_layouts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_nx_saved_views" ON public.nx_saved_views
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tenant members can read dashboards/widgets
CREATE POLICY "tenant_members_read_dashboards" ON public.nx_dashboards
  FOR SELECT TO authenticated
  USING (public.task_is_tenant_member(tenant_id, 'viewer'));

CREATE POLICY "tenant_admins_manage_dashboards" ON public.nx_dashboards
  FOR ALL TO authenticated
  USING (public.task_is_tenant_member(tenant_id, 'admin'))
  WITH CHECK (public.task_is_tenant_member(tenant_id, 'admin'));

CREATE POLICY "tenant_members_read_widgets" ON public.nx_widgets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.nx_dashboards d
      WHERE d.id = nx_widgets.dashboard_id
        AND public.task_is_tenant_member(d.tenant_id, 'viewer')
    )
  );

CREATE POLICY "tenant_admins_manage_widgets" ON public.nx_widgets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.nx_dashboards d
      WHERE d.id = nx_widgets.dashboard_id
        AND public.task_is_tenant_member(d.tenant_id, 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nx_dashboards d
      WHERE d.id = nx_widgets.dashboard_id
        AND public.task_is_tenant_member(d.tenant_id, 'admin')
    )
  );

CREATE POLICY "tenant_members_read_layouts" ON public.nx_dashboard_layouts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.nx_dashboards d
      WHERE d.id = nx_dashboard_layouts.dashboard_id
        AND public.task_is_tenant_member(d.tenant_id, 'viewer')
    )
  );

-- Saved views: owner can CRUD own; shared views readable by tenant
CREATE POLICY "users_read_own_or_shared_views" ON public.nx_saved_views
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR (is_shared AND public.task_is_tenant_member(tenant_id, 'viewer'))
  );

CREATE POLICY "users_manage_own_views" ON public.nx_saved_views
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "admins_manage_shared_views" ON public.nx_saved_views
  FOR ALL TO authenticated
  USING (is_shared AND public.task_is_tenant_member(tenant_id, 'admin'))
  WITH CHECK (is_shared AND public.task_is_tenant_member(tenant_id, 'admin'));

-- =============================================================================
-- 3) FINANCE RPCs
-- =============================================================================

-- Finance KPIs (main finance summary)
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
  v_revenue_mtd NUMERIC := 0;
  v_revenue_ytd NUMERIC := 0;
  v_expenses_mtd NUMERIC := 0;
  v_expenses_ytd NUMERIC := 0;
  v_order_count INT := 0;
  v_mtd_start DATE;
  v_ytd_start DATE;
BEGIN
  -- Calculate MTD and YTD boundaries
  v_mtd_start := date_trunc('month', p_date_to)::date;
  v_ytd_start := date_trunc('year', p_date_to)::date;

  -- Revenue from paid orders (MTD)
  -- Note: orders table is single-tenant (no tenant_id column), uses grand_total
  SELECT COALESCE(SUM(grand_total), 0), COUNT(*)
  INTO v_revenue_mtd, v_order_count
  FROM public.orders
  WHERE payment_status = 'paid'
    AND created_at::date >= v_mtd_start
    AND created_at::date <= p_date_to;

  -- Revenue YTD
  SELECT COALESCE(SUM(grand_total), 0)
  INTO v_revenue_ytd
  FROM public.orders
  WHERE payment_status = 'paid'
    AND created_at::date >= v_ytd_start
    AND created_at::date <= p_date_to;

  -- Expenses from bank transactions (MTD) - negative amounts
  SELECT COALESCE(SUM(ABS(amount)), 0)
  INTO v_expenses_mtd
  FROM public.books_bank_transactions
  WHERE tenant_id = p_tenant_id
    AND amount < 0
    AND cleared = true
    AND posted_at >= v_mtd_start
    AND posted_at <= p_date_to;

  -- Expenses YTD
  SELECT COALESCE(SUM(ABS(amount)), 0)
  INTO v_expenses_ytd
  FROM public.books_bank_transactions
  WHERE tenant_id = p_tenant_id
    AND amount < 0
    AND cleared = true
    AND posted_at >= v_ytd_start
    AND posted_at <= p_date_to;

  RETURN jsonb_build_object(
    'revenue_mtd', v_revenue_mtd,
    'revenue_ytd', v_revenue_ytd,
    'expenses_mtd', v_expenses_mtd,
    'expenses_ytd', v_expenses_ytd,
    'profit_mtd', v_revenue_mtd - v_expenses_mtd,
    'profit_ytd', v_revenue_ytd - v_expenses_ytd,
    'avg_order_value', CASE WHEN v_order_count > 0 THEN ROUND(v_revenue_mtd / v_order_count, 2) ELSE 0 END,
    'order_count', v_order_count,
    'refunds_total', NULL,
    'assumptions', ARRAY[
      'Revenue from orders WHERE payment_status=''paid''',
      'Expenses from books_bank_transactions WHERE amount < 0 AND cleared=true',
      'Profit = Revenue - Expenses',
      'AOV calculated from MTD orders only'
    ]
  );
END;
$$;

-- Revenue timeseries
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

  -- Note: orders table is single-tenant (no tenant_id column), uses grand_total
  RETURN QUERY
  SELECT
    CASE v_bucket_size
      WHEN 'week' THEN date_trunc('week', o.created_at)::date
      WHEN 'month' THEN date_trunc('month', o.created_at)::date
      ELSE o.created_at::date
    END AS bucket_date,
    COALESCE(SUM(o.grand_total), 0) AS amount
  FROM public.orders o
  WHERE o.payment_status = 'paid'
    AND o.created_at::date >= p_date_from
    AND o.created_at::date <= p_date_to
  GROUP BY 1
  ORDER BY 1;
END;
$$;

-- Expense by category (merchant-based grouping)
CREATE OR REPLACE FUNCTION public.nx_finance_expense_by_category(
  p_tenant_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(category TEXT, amount NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN LOWER(COALESCE(t.merchant_norm, t.merchant, '')) ~ '(ups|fedex|usps|freight|shipping|dhl)' THEN 'Shipping'
      WHEN LOWER(COALESCE(t.merchant_norm, t.merchant, '')) ~ '(supply|hardware|material|depot)' THEN 'Supplies'
      WHEN LOWER(COALESCE(t.merchant_norm, t.merchant, '')) ~ '(service|consulting|professional|legal|accounting)' THEN 'Services'
      WHEN LOWER(COALESCE(t.merchant_norm, t.merchant, '')) ~ '(electric|gas|water|internet|phone|utility)' THEN 'Utilities'
      WHEN LOWER(COALESCE(t.merchant_norm, t.merchant, '')) ~ '(payroll|salary|wage)' THEN 'Payroll'
      WHEN LOWER(COALESCE(t.merchant_norm, t.merchant, '')) ~ '(rent|lease|property)' THEN 'Rent'
      WHEN LOWER(COALESCE(t.merchant_norm, t.merchant, '')) ~ '(insurance)' THEN 'Insurance'
      WHEN LOWER(COALESCE(t.merchant_norm, t.merchant, '')) ~ '(marketing|advertising|ads|promo)' THEN 'Marketing'
      ELSE 'Other'
    END AS category,
    COALESCE(SUM(ABS(t.amount)), 0) AS amount
  FROM public.books_bank_transactions t
  WHERE t.tenant_id = p_tenant_id
    AND t.amount < 0
    AND t.cleared = true
    AND t.posted_at >= p_date_from
    AND t.posted_at <= p_date_to
  GROUP BY 1
  ORDER BY 2 DESC;
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

  -- Note: orders table is single-tenant (no tenant_id column), uses grand_total
  RETURN QUERY
  (
    -- Orders as income
    SELECT
      o.created_at::date AS txn_date,
      COALESCE(o.customer_name, o.customer_email) AS payee,
      'Order ' || o.order_number AS memo,
      'Revenue' AS category,
      o.grand_total AS amount,
      'orders' AS source,
      o.id AS ref_id
    FROM public.orders o
    WHERE o.payment_status = 'paid'
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

-- =============================================================================
-- 4) TASKS RPCs
-- =============================================================================

-- Tasks KPIs
CREATE OR REPLACE FUNCTION public.nx_tasks_kpis(
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
  v_open_count INT := 0;
  v_overdue_count INT := 0;
  v_my_work_count INT := 0;
  v_completed_count INT := 0;
  v_avg_age_days NUMERIC := 0;
  v_user_id UUID;
BEGIN
  v_user_id := (p_filters->>'user_id')::uuid;

  -- Get workspace IDs for this tenant
  WITH workspace_ids AS (
    SELECT id FROM public.task_workspaces WHERE tenant_id = p_tenant_id
  ),
  board_ids AS (
    SELECT tb.id FROM public.task_boards tb
    JOIN workspace_ids w ON tb.workspace_id = w.id
  )
  SELECT
    COUNT(*) FILTER (WHERE ti.status = 'open'),
    COUNT(*) FILTER (WHERE ti.status = 'open' AND ti.due_at < NOW()),
    COUNT(*) FILTER (WHERE ti.status = 'open' AND ti.assigned_to = v_user_id),
    COUNT(*) FILTER (WHERE ti.status = 'closed' AND ti.completed_at::date >= p_date_from),
    COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - ti.created_at)) / 86400) FILTER (WHERE ti.status = 'open'), 0)
  INTO v_open_count, v_overdue_count, v_my_work_count, v_completed_count, v_avg_age_days
  FROM public.task_items ti
  JOIN board_ids b ON ti.board_id = b.id;

  RETURN jsonb_build_object(
    'open_count', v_open_count,
    'overdue_count', v_overdue_count,
    'my_work_count', v_my_work_count,
    'completed_count', v_completed_count,
    'avg_age_days', ROUND(v_avg_age_days, 1)
  );
END;
$$;

-- Tasks by column
CREATE OR REPLACE FUNCTION public.nx_tasks_by_column(
  p_tenant_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(column_name TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH workspace_ids AS (
    SELECT id FROM public.task_workspaces WHERE tenant_id = p_tenant_id
  ),
  board_ids AS (
    SELECT tb.id FROM public.task_boards tb
    JOIN workspace_ids w ON tb.workspace_id = w.id
  )
  SELECT
    tbc.name AS column_name,
    COUNT(ti.id)::bigint AS count
  FROM public.task_board_columns tbc
  JOIN board_ids b ON tbc.board_id = b.id
  LEFT JOIN public.task_items ti ON ti.column_id = tbc.id AND ti.status = 'open'
  GROUP BY tbc.name, tbc.position
  ORDER BY tbc.position;
END;
$$;

-- Tasks aging list
CREATE OR REPLACE FUNCTION public.nx_tasks_aging_list(
  p_tenant_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  task_id UUID,
  title TEXT,
  age_days INT,
  priority TEXT,
  due_at TIMESTAMPTZ,
  assigned_to UUID,
  assigned_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit INT;
BEGIN
  v_limit := COALESCE((p_filters->>'limit')::int, 20);

  RETURN QUERY
  WITH workspace_ids AS (
    SELECT id FROM public.task_workspaces WHERE tenant_id = p_tenant_id
  ),
  board_ids AS (
    SELECT tb.id FROM public.task_boards tb
    JOIN workspace_ids w ON tb.workspace_id = w.id
  )
  SELECT
    ti.id AS task_id,
    ti.title,
    EXTRACT(DAY FROM (NOW() - ti.created_at))::int AS age_days,
    ti.priority::text,
    ti.due_at,
    ti.assigned_to,
    COALESCE(up.first_name || ' ' || up.last_name, up.email) AS assigned_name
  FROM public.task_items ti
  JOIN board_ids b ON ti.board_id = b.id
  LEFT JOIN public.user_profiles up ON up.id = ti.assigned_to
  WHERE ti.status = 'open'
  ORDER BY ti.created_at ASC
  LIMIT v_limit;
END;
$$;

-- =============================================================================
-- 5) ORDERS/SCHEDULING RPCs
-- =============================================================================

-- Orders by status
-- Note: orders table is single-tenant (no tenant_id column), uses grand_total
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

  -- Note: orders table is single-tenant, p_tenant_id ignored
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

-- Upcoming appointments
CREATE OR REPLACE FUNCTION public.nx_upcoming_appointments(
  p_tenant_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  booking_id UUID,
  title TEXT,
  start_at TIMESTAMPTZ,
  attendee_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit INT;
BEGIN
  v_limit := COALESCE((p_filters->>'limit')::int, 10);

  RETURN QUERY
  SELECT
    b.id AS booking_id,
    b.title,
    b.start_at,
    b.attendee_email
  FROM public.nx_scheduler_booking b
  WHERE b.tenant_id = p_tenant_id
    AND b.status = 'scheduled'
    AND b.start_at >= NOW()
    AND b.start_at::date <= p_date_to
  ORDER BY b.start_at ASC
  LIMIT v_limit;
END;
$$;

-- =============================================================================
-- 6) TRIGGERS FOR updated_at
-- =============================================================================

CREATE TRIGGER update_nx_dashboards_updated_at
  BEFORE UPDATE ON public.nx_dashboards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nx_widgets_updated_at
  BEFORE UPDATE ON public.nx_widgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nx_dashboard_layouts_updated_at
  BEFORE UPDATE ON public.nx_dashboard_layouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nx_saved_views_updated_at
  BEFORE UPDATE ON public.nx_saved_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 7) SEED DATA - DASHBOARDS AND WIDGETS
-- =============================================================================

DO $$
DECLARE
  v_tenant RECORD;
  v_dashboard_id UUID;
BEGIN
  FOR v_tenant IN SELECT id FROM public.tenants LOOP

    -- Executive Dashboard
    INSERT INTO public.nx_dashboards (tenant_id, key, name, description, is_default, icon, position)
    VALUES (v_tenant.id, 'executive', 'Executive', 'High-level business overview', TRUE, 'BarChart3', 0)
    ON CONFLICT (tenant_id, key) DO NOTHING
    RETURNING id INTO v_dashboard_id;

    IF v_dashboard_id IS NOT NULL THEN
      INSERT INTO public.nx_widgets (tenant_id, dashboard_id, key, widget_type, title, rpc_name, position, grid_config)
      VALUES
        (v_tenant.id, v_dashboard_id, 'finance_kpis', 'kpi', 'Financial Summary', 'nx_finance_kpis', 0, '{"col": 0, "row": 0, "width": 4, "height": 1}'),
        (v_tenant.id, v_dashboard_id, 'revenue_chart', 'timeseries', 'Revenue Trend', 'nx_finance_revenue_timeseries', 1, '{"col": 0, "row": 1, "width": 2, "height": 2}'),
        (v_tenant.id, v_dashboard_id, 'tasks_summary', 'kpi', 'Tasks', 'nx_tasks_kpis', 2, '{"col": 2, "row": 1, "width": 1, "height": 1}'),
        (v_tenant.id, v_dashboard_id, 'orders_status', 'donut', 'Orders by Status', 'nx_orders_by_status', 3, '{"col": 3, "row": 1, "width": 1, "height": 2}');
    END IF;

    -- Ops Dashboard
    INSERT INTO public.nx_dashboards (tenant_id, key, name, description, is_default, icon, position)
    VALUES (v_tenant.id, 'ops', 'Operations', 'Day-to-day operations', FALSE, 'Settings', 1)
    ON CONFLICT (tenant_id, key) DO NOTHING
    RETURNING id INTO v_dashboard_id;

    IF v_dashboard_id IS NOT NULL THEN
      INSERT INTO public.nx_widgets (tenant_id, dashboard_id, key, widget_type, title, rpc_name, position, grid_config)
      VALUES
        (v_tenant.id, v_dashboard_id, 'orders_status', 'donut', 'Orders by Status', 'nx_orders_by_status', 0, '{"col": 0, "row": 0, "width": 1, "height": 2}'),
        (v_tenant.id, v_dashboard_id, 'orders_aging', 'table', 'Aging Orders', 'nx_orders_aging', 1, '{"col": 1, "row": 0, "width": 2, "height": 2}'),
        (v_tenant.id, v_dashboard_id, 'tasks_by_column', 'bar', 'Tasks by Column', 'nx_tasks_by_column', 2, '{"col": 3, "row": 0, "width": 1, "height": 2}'),
        (v_tenant.id, v_dashboard_id, 'tasks_aging', 'table', 'Aging Tasks', 'nx_tasks_aging_list', 3, '{"col": 0, "row": 2, "width": 4, "height": 2}');
    END IF;

    -- Finance Dashboard
    INSERT INTO public.nx_dashboards (tenant_id, key, name, description, is_default, icon, position)
    VALUES (v_tenant.id, 'finance', 'Finance', 'Financial metrics and transactions', FALSE, 'DollarSign', 2)
    ON CONFLICT (tenant_id, key) DO NOTHING
    RETURNING id INTO v_dashboard_id;

    IF v_dashboard_id IS NOT NULL THEN
      INSERT INTO public.nx_widgets (tenant_id, dashboard_id, key, widget_type, title, rpc_name, position, grid_config)
      VALUES
        (v_tenant.id, v_dashboard_id, 'finance_kpis', 'kpi', 'Financial KPIs', 'nx_finance_kpis', 0, '{"col": 0, "row": 0, "width": 4, "height": 1}'),
        (v_tenant.id, v_dashboard_id, 'revenue_chart', 'timeseries', 'Revenue Trend', 'nx_finance_revenue_timeseries', 1, '{"col": 0, "row": 1, "width": 2, "height": 2}'),
        (v_tenant.id, v_dashboard_id, 'expense_by_category', 'bar', 'Expenses by Category', 'nx_finance_expense_by_category', 2, '{"col": 2, "row": 1, "width": 2, "height": 2}'),
        (v_tenant.id, v_dashboard_id, 'transactions', 'table', 'Recent Transactions', 'nx_finance_transactions', 3, '{"col": 0, "row": 3, "width": 4, "height": 3}');
    END IF;

    -- Support Dashboard (placeholder)
    INSERT INTO public.nx_dashboards (tenant_id, key, name, description, is_default, icon, position)
    VALUES (v_tenant.id, 'support', 'Support', 'Customer support metrics', FALSE, 'HeadphonesIcon', 3)
    ON CONFLICT (tenant_id, key) DO NOTHING
    RETURNING id INTO v_dashboard_id;

    IF v_dashboard_id IS NOT NULL THEN
      INSERT INTO public.nx_widgets (tenant_id, dashboard_id, key, widget_type, title, subtitle, rpc_name, position, grid_config, display_config)
      VALUES
        (v_tenant.id, v_dashboard_id, 'tickets_placeholder', 'kpi', 'Support Tickets', 'Coming soon', NULL, 0, '{"col": 0, "row": 0, "width": 2, "height": 1}', '{"placeholder": true, "value": 0}'),
        (v_tenant.id, v_dashboard_id, 'comms_placeholder', 'kpi', 'Communications', 'Coming soon', NULL, 1, '{"col": 2, "row": 0, "width": 2, "height": 1}', '{"placeholder": true, "value": 0}');
    END IF;

  END LOOP;
END $$;

COMMIT;
