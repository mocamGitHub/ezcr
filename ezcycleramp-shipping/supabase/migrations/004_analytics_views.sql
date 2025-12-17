-- ============================================
-- DATABASE MIGRATIONS: Analytics Dashboard Views
-- Migration 004: Admin dashboard views and queries
-- Run AFTER 003_scheduled_emails.sql
-- ============================================

-- ============================================
-- VIEW: Orders Overview (Today, Week, Month)
-- ============================================

CREATE OR REPLACE VIEW v_orders_overview AS
WITH time_periods AS (
  SELECT
    -- Today
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as orders_today,
    COALESCE(SUM(grand_total) FILTER (WHERE created_at >= CURRENT_DATE), 0) as revenue_today,

    -- This week (Monday start)
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as orders_this_week,
    COALESCE(SUM(grand_total) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)), 0) as revenue_this_week,

    -- This month
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as orders_this_month,
    COALESCE(SUM(grand_total) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as revenue_this_month,

    -- All time
    COUNT(*) as orders_all_time,
    COALESCE(SUM(grand_total), 0) as revenue_all_time,
    COALESCE(AVG(grand_total), 0) as avg_order_value

  FROM orders
  WHERE status NOT IN ('cancelled', 'refunded')
)
SELECT
  orders_today,
  revenue_today,
  orders_this_week,
  revenue_this_week,
  orders_this_month,
  revenue_this_month,
  orders_all_time,
  revenue_all_time,
  ROUND(avg_order_value, 2) as avg_order_value
FROM time_periods;

-- ============================================
-- VIEW: Orders By Status
-- ============================================

CREATE OR REPLACE VIEW v_orders_by_status AS
SELECT
  status,
  COUNT(*) as order_count,
  COALESCE(SUM(grand_total), 0) as total_revenue,
  COALESCE(AVG(grand_total), 0) as avg_order_value
FROM orders
GROUP BY status
ORDER BY
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'processing' THEN 2
    WHEN 'shipped' THEN 3
    WHEN 'delivered' THEN 4
    WHEN 'cancelled' THEN 5
    WHEN 'refunded' THEN 6
  END;

-- ============================================
-- VIEW: Daily Revenue (Last 90 Days)
-- ============================================

CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as order_count,
  SUM(CASE WHEN product_sku = 'AUN200' THEN 1 ELSE 0 END) as aun200_count,
  SUM(CASE WHEN product_sku = 'AUN250' THEN 1 ELSE 0 END) as aun250_count,
  COALESCE(SUM(subtotal), 0) as product_revenue,
  COALESCE(SUM(shipping_total), 0) as shipping_revenue,
  COALESCE(SUM(grand_total), 0) as total_revenue,
  ROUND(COALESCE(AVG(grand_total), 0), 2) as avg_order_value
FROM orders
WHERE status NOT IN ('cancelled', 'refunded')
  AND created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- VIEW: Weekly Revenue with Growth
-- ============================================

CREATE OR REPLACE VIEW v_weekly_revenue AS
WITH weekly_data AS (
  SELECT
    DATE_TRUNC('week', created_at)::DATE as week_start,
    COUNT(*) as order_count,
    COALESCE(SUM(grand_total), 0) as revenue
  FROM orders
  WHERE status NOT IN ('cancelled', 'refunded')
    AND created_at >= CURRENT_DATE - INTERVAL '52 weeks'
  GROUP BY DATE_TRUNC('week', created_at)
)
SELECT
  week_start,
  order_count,
  revenue,
  LAG(revenue) OVER (ORDER BY week_start) as prior_week_revenue,
  CASE
    WHEN LAG(revenue) OVER (ORDER BY week_start) > 0
    THEN ROUND(((revenue - LAG(revenue) OVER (ORDER BY week_start)) / LAG(revenue) OVER (ORDER BY week_start) * 100)::NUMERIC, 1)
    ELSE NULL
  END as growth_percent
FROM weekly_data
ORDER BY week_start DESC;

-- ============================================
-- VIEW: Monthly Revenue with YoY Comparison
-- ============================================

CREATE OR REPLACE VIEW v_monthly_revenue AS
WITH monthly_data AS (
  SELECT
    DATE_TRUNC('month', created_at)::DATE as month_start,
    TO_CHAR(created_at, 'YYYY-MM') as month_label,
    COUNT(*) as order_count,
    COALESCE(SUM(grand_total), 0) as revenue
  FROM orders
  WHERE status NOT IN ('cancelled', 'refunded')
    AND created_at >= CURRENT_DATE - INTERVAL '24 months'
  GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(created_at, 'YYYY-MM')
)
SELECT
  month_start,
  month_label,
  order_count,
  revenue,
  LAG(revenue) OVER (ORDER BY month_start) as prior_month_revenue,
  LAG(revenue, 12) OVER (ORDER BY month_start) as same_month_last_year,
  CASE
    WHEN LAG(revenue) OVER (ORDER BY month_start) > 0
    THEN ROUND(((revenue - LAG(revenue) OVER (ORDER BY month_start)) / LAG(revenue) OVER (ORDER BY month_start) * 100)::NUMERIC, 1)
    ELSE NULL
  END as mom_growth_percent,
  CASE
    WHEN LAG(revenue, 12) OVER (ORDER BY month_start) > 0
    THEN ROUND(((revenue - LAG(revenue, 12) OVER (ORDER BY month_start)) / LAG(revenue, 12) OVER (ORDER BY month_start) * 100)::NUMERIC, 1)
    ELSE NULL
  END as yoy_growth_percent
FROM monthly_data
ORDER BY month_start DESC;

-- ============================================
-- VIEW: Shipping Performance Metrics
-- ============================================

CREATE OR REPLACE VIEW v_shipping_performance_detailed AS
SELECT
  DATE_TRUNC('week', created_at)::DATE as week_start,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE shipped_at IS NOT NULL) as orders_shipped,
  COUNT(*) FILTER (WHERE delivered_at IS NOT NULL) as orders_delivered,

  -- Average days to ship (order to ship)
  ROUND(
    (AVG(EXTRACT(EPOCH FROM (shipped_at - created_at)) / 86400) FILTER (WHERE shipped_at IS NOT NULL))::NUMERIC,
    1
  ) as avg_days_to_ship,

  -- Average transit time (ship to deliver)
  ROUND(
    (AVG(EXTRACT(EPOCH FROM (delivered_at - shipped_at)) / 86400) FILTER (WHERE delivered_at IS NOT NULL AND shipped_at IS NOT NULL))::NUMERIC,
    1
  ) as avg_transit_days,

  -- Average estimated transit
  ROUND(
    (AVG(estimated_transit_days) FILTER (WHERE estimated_transit_days IS NOT NULL))::NUMERIC,
    1
  ) as avg_estimated_transit,

  -- On-time delivery percentage
  ROUND(
    (COUNT(*) FILTER (WHERE delivered_at IS NOT NULL AND actual_delivery_date <= estimated_delivery_date)::FLOAT /
     NULLIF(COUNT(*) FILTER (WHERE delivered_at IS NOT NULL AND estimated_delivery_date IS NOT NULL), 0) * 100)::NUMERIC,
    1
  ) as on_time_delivery_pct

FROM orders
WHERE delivery_method = 'shipping'
  AND created_at >= CURRENT_DATE - INTERVAL '52 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start DESC;

-- ============================================
-- VIEW: Shipping Quotes Analytics
-- ============================================

CREATE OR REPLACE VIEW v_shipping_quotes_analytics AS
SELECT
  LEFT(destination_zip, 3) as zip_prefix,
  destination_state,
  COUNT(*) as quote_count,
  COUNT(DISTINCT destination_zip) as unique_zips,
  ROUND(AVG(total_rate)::NUMERIC, 2) as avg_rate,
  ROUND(MIN(total_rate)::NUMERIC, 2) as min_rate,
  ROUND(MAX(total_rate)::NUMERIC, 2) as max_rate,
  SUM(CASE WHEN is_residential THEN 1 ELSE 0 END) as residential_quotes,
  ROUND(AVG(transit_days)::NUMERIC, 1) as avg_transit_days,

  -- Conversion rate (quotes that became orders)
  COUNT(DISTINCT o.id) as converted_orders,
  ROUND(
    (COUNT(DISTINCT o.id)::FLOAT / NULLIF(COUNT(*), 0) * 100)::NUMERIC,
    1
  ) as conversion_rate_pct

FROM shipping_quotes sq
LEFT JOIN orders o ON o.shipping_quote_id = sq.quote_id
WHERE sq.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY LEFT(destination_zip, 3), destination_state
ORDER BY quote_count DESC;

-- ============================================
-- VIEW: Lead Conversion Funnel
-- ============================================

CREATE OR REPLACE VIEW v_lead_conversion_funnel AS
WITH weekly_data AS (
  SELECT
    DATE_TRUNC('week', created_at)::DATE as week_start,
    COUNT(*) as leads_created,
    COUNT(*) FILTER (WHERE converted_at IS NOT NULL) as leads_converted
  FROM configurator_leads
  WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks'
  GROUP BY DATE_TRUNC('week', created_at)
),
order_data AS (
  SELECT
    DATE_TRUNC('week', created_at)::DATE as week_start,
    COUNT(*) as orders_placed,
    COUNT(*) FILTER (WHERE lead_id IS NOT NULL) as orders_from_leads
  FROM orders
  WHERE status NOT IN ('cancelled', 'refunded')
    AND created_at >= CURRENT_DATE - INTERVAL '12 weeks'
  GROUP BY DATE_TRUNC('week', created_at)
)
SELECT
  COALESCE(w.week_start, o.week_start) as week_start,
  COALESCE(w.leads_created, 0) as leads_created,
  COALESCE(w.leads_converted, 0) as leads_converted,
  COALESCE(o.orders_placed, 0) as orders_placed,
  COALESCE(o.orders_from_leads, 0) as orders_from_leads,
  ROUND(
    (COALESCE(w.leads_converted, 0)::FLOAT / NULLIF(COALESCE(w.leads_created, 0), 0) * 100)::NUMERIC,
    1
  ) as lead_conversion_rate_pct
FROM weekly_data w
FULL OUTER JOIN order_data o ON w.week_start = o.week_start
ORDER BY week_start DESC;

-- ============================================
-- VIEW: Error Log Summary
-- ============================================

CREATE OR REPLACE VIEW v_error_log_summary AS
SELECT
  error_type,
  COUNT(*) as total_errors,
  COUNT(*) FILTER (WHERE resolved_at IS NULL) as unresolved_errors,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as errors_last_7_days,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '24 hours') as errors_last_24h,
  MAX(created_at) as most_recent_error
FROM shipping_errors
GROUP BY error_type
ORDER BY unresolved_errors DESC, total_errors DESC;

-- ============================================
-- VIEW: Errors by Day
-- ============================================

CREATE OR REPLACE VIEW v_errors_by_day AS
SELECT
  DATE(created_at) as date,
  error_type,
  COUNT(*) as error_count,
  COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved_count,
  COUNT(*) FILTER (WHERE resolved_at IS NULL) as unresolved_count
FROM shipping_errors
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), error_type
ORDER BY date DESC, error_count DESC;

-- ============================================
-- VIEW: Customer Geography
-- ============================================

CREATE OR REPLACE VIEW v_customer_geography AS
SELECT
  shipping_address->>'state' as state,
  COUNT(*) as order_count,
  COALESCE(SUM(grand_total), 0) as total_revenue,
  ROUND(COALESCE(AVG(grand_total), 0)::NUMERIC, 2) as avg_order_value,
  SUM(CASE WHEN delivery_method = 'shipping' THEN 1 ELSE 0 END) as shipping_orders,
  SUM(CASE WHEN delivery_method = 'pickup' THEN 1 ELSE 0 END) as pickup_orders,
  ROUND(
    (SUM(CASE WHEN delivery_method = 'pickup' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) * 100)::NUMERIC,
    1
  ) as pickup_pct
FROM orders
WHERE status NOT IN ('cancelled', 'refunded')
  AND shipping_address->>'state' IS NOT NULL
GROUP BY shipping_address->>'state'
ORDER BY order_count DESC;

-- ============================================
-- VIEW: Product Performance
-- ============================================

CREATE OR REPLACE VIEW v_product_performance AS
SELECT
  product_sku,
  product_name,
  COUNT(*) as order_count,
  COALESCE(SUM(quantity), 0) as units_sold,
  COALESCE(SUM(subtotal), 0) as product_revenue,
  COALESCE(SUM(grand_total), 0) as total_revenue,
  ROUND(COALESCE(AVG(grand_total), 0)::NUMERIC, 2) as avg_order_value,
  SUM(CASE WHEN delivery_method = 'shipping' THEN 1 ELSE 0 END) as shipping_orders,
  SUM(CASE WHEN delivery_method = 'pickup' THEN 1 ELSE 0 END) as pickup_orders,
  ROUND(
    (SUM(CASE WHEN delivery_method = 'pickup' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) * 100)::NUMERIC,
    1
  ) as pickup_pct
FROM orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY product_sku, product_name
ORDER BY order_count DESC;

-- ============================================
-- VIEW: Admin Action Items
-- ============================================

CREATE OR REPLACE VIEW v_admin_action_items AS
SELECT
  'pending_shipment' as item_type,
  'Orders Ready to Ship' as title,
  COUNT(*) as count,
  'Processing orders awaiting shipment' as description
FROM orders
WHERE status = 'processing'
  AND delivery_method = 'shipping'
  AND shipped_at IS NULL

UNION ALL

SELECT
  'pending_pickup' as item_type,
  'Pickups Ready for Customer' as title,
  COUNT(*) as count,
  'Orders with pickup_ready_at set, awaiting pickup' as description
FROM orders
WHERE delivery_method = 'pickup'
  AND pickup_ready_at IS NOT NULL
  AND picked_up_at IS NULL

UNION ALL

SELECT
  'unresolved_errors' as item_type,
  'Unresolved Shipping Errors' as title,
  COUNT(*) as count,
  'Shipping errors needing attention' as description
FROM shipping_errors
WHERE resolved_at IS NULL

UNION ALL

SELECT
  'pending_emails' as item_type,
  'Pending Scheduled Emails' as title,
  COUNT(*) as count,
  'Emails scheduled but not yet sent' as description
FROM scheduled_emails
WHERE status = 'pending'
  AND scheduled_for <= NOW()

UNION ALL

SELECT
  'failed_emails' as item_type,
  'Failed Emails' as title,
  COUNT(*) as count,
  'Emails that failed to send' as description
FROM scheduled_emails
WHERE status = 'failed';

-- ============================================
-- INDEXES FOR ANALYTICS PERFORMANCE
-- ============================================

-- Index for product performance
CREATE INDEX IF NOT EXISTS idx_orders_product_status ON orders(product_sku, status);

-- ============================================
-- MATERIALIZED VIEW: Monthly Summary (Optional)
-- For faster dashboard loading on large datasets
-- ============================================

-- Uncomment if needed for performance:
-- CREATE MATERIALIZED VIEW mv_monthly_summary AS
-- SELECT * FROM v_monthly_revenue;

-- Refresh with: REFRESH MATERIALIZED VIEW mv_monthly_summary;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON VIEW v_orders_overview IS 'Summary metrics: today, this week, this month, all time';
COMMENT ON VIEW v_orders_by_status IS 'Order counts and revenue grouped by status';
COMMENT ON VIEW v_daily_revenue IS 'Daily revenue breakdown for last 90 days';
COMMENT ON VIEW v_weekly_revenue IS 'Weekly revenue with week-over-week growth';
COMMENT ON VIEW v_monthly_revenue IS 'Monthly revenue with MoM and YoY growth';
COMMENT ON VIEW v_shipping_performance_detailed IS 'Shipping metrics: days to ship, transit time, on-time %';
COMMENT ON VIEW v_shipping_quotes_analytics IS 'Quote volume and conversion by ZIP prefix/state';
COMMENT ON VIEW v_lead_conversion_funnel IS 'Weekly funnel: leads created → converted → orders';
COMMENT ON VIEW v_error_log_summary IS 'Shipping errors grouped by type with resolution status';
COMMENT ON VIEW v_customer_geography IS 'Order distribution by state with delivery method breakdown';
COMMENT ON VIEW v_product_performance IS 'Sales metrics by product SKU';
COMMENT ON VIEW v_admin_action_items IS 'Consolidated list of items requiring admin attention';
