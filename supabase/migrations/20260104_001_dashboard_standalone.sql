-- Standalone Dashboard Migration
-- Creates nx_dashboards and nx_widgets tables with minimal dependencies

BEGIN;

-- Dashboard definitions
CREATE TABLE IF NOT EXISTS public.nx_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
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
  tenant_id UUID NOT NULL,
  dashboard_id UUID NOT NULL REFERENCES public.nx_dashboards(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  widget_type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  rpc_name TEXT,
  rpc_args JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  position INT NOT NULL DEFAULT 0,
  grid_config JSONB NOT NULL DEFAULT '{"col": 0, "row": 0, "width": 1, "height": 1}'::jsonb,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dashboard_id, key)
);

CREATE INDEX IF NOT EXISTS idx_nx_widgets_dashboard ON public.nx_widgets(dashboard_id);

-- RLS - allow service role full access
ALTER TABLE public.nx_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nx_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_nx_dashboards" ON public.nx_dashboards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_nx_widgets" ON public.nx_widgets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Finance KPIs RPC
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
  v_period_days := p_date_to - p_date_from + 1;
  v_prev_to := p_date_from - 1;
  v_prev_from := v_prev_to - v_period_days + 1;

  -- Revenue from succeeded orders (current period)
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

  -- Expenses from bank transactions (current period)
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

-- Finance Timeseries RPC
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
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_date_from, p_date_to, '1 day'::interval)::date AS d
  ),
  order_data AS (
    SELECT
      o.created_at::date AS bucket,
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
      t.posted_at::date AS bucket,
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
    ds.d AS bucket_date,
    COALESCE(od.rev, 0) AS revenue,
    COALESCE(ed.exp, 0) AS expenses,
    COALESCE(od.rev, 0) - COALESCE(ed.exp, 0) AS profit,
    COALESCE(od.cnt, 0) AS order_count,
    CASE WHEN COALESCE(od.cnt, 0) > 0
      THEN ROUND(COALESCE(od.rev, 0) / od.cnt, 2)
      ELSE 0
    END AS avg_order_value
  FROM date_series ds
  LEFT JOIN order_data od ON od.bucket = ds.d
  LEFT JOIN expense_data ed ON ed.bucket = ds.d
  ORDER BY ds.d;
END;
$$;

-- Orders by status RPC
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

-- Seed dashboards for EZCR tenant
DO $$
DECLARE
  v_tenant_id UUID := '3d7f9ea0-e234-4f7d-b07e-7e3f3e1b0987';
  v_dashboard_id UUID;
BEGIN
  -- Executive Dashboard
  INSERT INTO public.nx_dashboards (tenant_id, key, name, description, is_default, icon, position)
  VALUES (v_tenant_id, 'executive', 'Executive', 'High-level business overview', TRUE, 'BarChart3', 0)
  ON CONFLICT (tenant_id, key) DO NOTHING
  RETURNING id INTO v_dashboard_id;

  IF v_dashboard_id IS NOT NULL THEN
    INSERT INTO public.nx_widgets (tenant_id, dashboard_id, key, widget_type, title, rpc_name, position, grid_config)
    VALUES
      (v_tenant_id, v_dashboard_id, 'finance_kpis', 'kpi', 'Financial Summary', 'nx_finance_kpis', 0, '{"col": 0, "row": 0, "width": 4, "height": 1}'),
      (v_tenant_id, v_dashboard_id, 'revenue_trend', 'trend', 'Revenue Trend', 'nx_finance_timeseries', 1, '{"col": 0, "row": 1, "width": 3, "height": 2}'),
      (v_tenant_id, v_dashboard_id, 'orders_status', 'donut', 'Orders by Status', 'nx_orders_by_status', 2, '{"col": 3, "row": 1, "width": 1, "height": 2}');
  END IF;

  -- Finance Dashboard
  INSERT INTO public.nx_dashboards (tenant_id, key, name, description, is_default, icon, position)
  VALUES (v_tenant_id, 'finance', 'Finance', 'Financial metrics and trends', FALSE, 'DollarSign', 1)
  ON CONFLICT (tenant_id, key) DO NOTHING
  RETURNING id INTO v_dashboard_id;

  IF v_dashboard_id IS NOT NULL THEN
    INSERT INTO public.nx_widgets (tenant_id, dashboard_id, key, widget_type, title, rpc_name, position, grid_config)
    VALUES
      (v_tenant_id, v_dashboard_id, 'finance_kpis', 'kpi', 'Financial KPIs', 'nx_finance_kpis', 0, '{"col": 0, "row": 0, "width": 4, "height": 1}'),
      (v_tenant_id, v_dashboard_id, 'finance_trend', 'trend', 'Financial Trends', 'nx_finance_timeseries', 1, '{"col": 0, "row": 1, "width": 4, "height": 2}');
  END IF;

  -- Ops Dashboard
  INSERT INTO public.nx_dashboards (tenant_id, key, name, description, is_default, icon, position)
  VALUES (v_tenant_id, 'ops', 'Operations', 'Day-to-day operations', FALSE, 'Settings', 2)
  ON CONFLICT (tenant_id, key) DO NOTHING
  RETURNING id INTO v_dashboard_id;

  IF v_dashboard_id IS NOT NULL THEN
    INSERT INTO public.nx_widgets (tenant_id, dashboard_id, key, widget_type, title, rpc_name, position, grid_config)
    VALUES
      (v_tenant_id, v_dashboard_id, 'orders_status', 'donut', 'Orders by Status', 'nx_orders_by_status', 0, '{"col": 0, "row": 0, "width": 2, "height": 2}'),
      (v_tenant_id, v_dashboard_id, 'finance_kpis', 'kpi', 'Quick Stats', 'nx_finance_kpis', 1, '{"col": 2, "row": 0, "width": 2, "height": 1}');
  END IF;

  -- Support Dashboard
  INSERT INTO public.nx_dashboards (tenant_id, key, name, description, is_default, icon, position)
  VALUES (v_tenant_id, 'support', 'Support', 'Customer support metrics', FALSE, 'HeadphonesIcon', 3)
  ON CONFLICT (tenant_id, key) DO NOTHING
  RETURNING id INTO v_dashboard_id;

  IF v_dashboard_id IS NOT NULL THEN
    INSERT INTO public.nx_widgets (tenant_id, dashboard_id, key, widget_type, title, subtitle, rpc_name, position, grid_config, display_config)
    VALUES
      (v_tenant_id, v_dashboard_id, 'tickets_placeholder', 'kpi', 'Support Tickets', 'Coming soon', NULL, 0, '{"col": 0, "row": 0, "width": 2, "height": 1}', '{"placeholder": true, "value": 0}');
  END IF;
END $$;

COMMIT;
