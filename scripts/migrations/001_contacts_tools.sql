-- ============================================
-- Admin Contacts & Tools Management
-- Run this migration in Supabase SQL Editor
-- ============================================

-- ============================================
-- TENANT CONTACTS TABLE (Business Contacts)
-- Vendors, suppliers, partners, service providers
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Contact Type
    contact_type TEXT NOT NULL CHECK (contact_type IN (
        'vendor', 'service_provider', 'integration', 'freight', 'partner', 'financial', 'other'
    )),

    -- Company Information
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,

    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',

    -- Business Details
    account_number TEXT,
    tax_id TEXT,
    payment_terms TEXT,

    -- Contract Information
    contract_start_date DATE,
    contract_end_date DATE,

    -- Status & Metadata
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    tags TEXT[] DEFAULT '{}',
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- Indexes for tenant_contacts
CREATE INDEX IF NOT EXISTS idx_tenant_contacts_tenant ON tenant_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_contacts_type ON tenant_contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_tenant_contacts_status ON tenant_contacts(status);
CREATE INDEX IF NOT EXISTS idx_tenant_contacts_company ON tenant_contacts(company_name);

-- ============================================
-- TENANT TOOLS TABLE (Software/Subscriptions)
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Tool Information
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'payment', 'email', 'sms', 'analytics', 'crm', 'shipping',
        'accounting', 'marketing', 'development', 'infrastructure',
        'security', 'storage', 'communication', 'other'
    )),

    -- Vendor Link (optional FK to tenant_contacts)
    vendor_contact_id UUID REFERENCES tenant_contacts(id) ON DELETE SET NULL,

    -- URLs & Access
    website_url TEXT,
    login_url TEXT,
    documentation_url TEXT,

    -- Account Details
    account_email TEXT,
    account_username TEXT,
    api_key_name TEXT,
    has_mfa BOOLEAN DEFAULT false,
    mfa_method TEXT,

    -- Billing
    billing_cycle TEXT CHECK (billing_cycle IN (
        'monthly', 'quarterly', 'semi_annual', 'annual', 'one_time', 'usage_based', 'free'
    )),
    cost_amount DECIMAL(10, 2),
    cost_currency TEXT DEFAULT 'USD',

    -- Renewal
    renewal_date DATE,
    auto_renew BOOLEAN DEFAULT true,
    cancellation_notice_days INTEGER DEFAULT 30,

    -- Integration Status
    integration_status TEXT DEFAULT 'not_integrated' CHECK (integration_status IN (
        'not_integrated', 'in_progress', 'integrated', 'deprecated'
    )),

    -- Status & Metadata
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial', 'cancelled')),
    tags TEXT[] DEFAULT '{}',
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- Indexes for tenant_tools
CREATE INDEX IF NOT EXISTS idx_tenant_tools_tenant ON tenant_tools(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_tools_category ON tenant_tools(category);
CREATE INDEX IF NOT EXISTS idx_tenant_tools_status ON tenant_tools(status);
CREATE INDEX IF NOT EXISTS idx_tenant_tools_renewal ON tenant_tools(renewal_date);
CREATE INDEX IF NOT EXISTS idx_tenant_tools_vendor ON tenant_tools(vendor_contact_id);

-- ============================================
-- VIEWS
-- ============================================

-- Tool Cost Summary View
CREATE OR REPLACE VIEW tenant_tools_cost_summary AS
SELECT
    tenant_id,
    COUNT(*) as total_tools,
    COUNT(*) FILTER (WHERE status = 'active') as active_tools,

    -- Monthly costs (convert everything to monthly)
    SUM(
        CASE billing_cycle
            WHEN 'monthly' THEN cost_amount
            WHEN 'quarterly' THEN cost_amount / 3
            WHEN 'semi_annual' THEN cost_amount / 6
            WHEN 'annual' THEN cost_amount / 12
            ELSE 0
        END
    ) FILTER (WHERE status = 'active' AND billing_cycle != 'free' AND billing_cycle != 'one_time' AND billing_cycle != 'usage_based') as total_monthly_cost,

    -- Annual costs
    SUM(
        CASE billing_cycle
            WHEN 'monthly' THEN cost_amount * 12
            WHEN 'quarterly' THEN cost_amount * 4
            WHEN 'semi_annual' THEN cost_amount * 2
            WHEN 'annual' THEN cost_amount
            ELSE 0
        END
    ) FILTER (WHERE status = 'active' AND billing_cycle != 'free' AND billing_cycle != 'one_time' AND billing_cycle != 'usage_based') as total_annual_cost,

    -- Breakdown by category
    COUNT(*) FILTER (WHERE category = 'payment') as payment_tools,
    COUNT(*) FILTER (WHERE category = 'email') as email_tools,
    COUNT(*) FILTER (WHERE category = 'shipping') as shipping_tools,
    COUNT(*) FILTER (WHERE category = 'analytics') as analytics_tools,
    COUNT(*) FILTER (WHERE category = 'development') as development_tools
FROM tenant_tools
WHERE archived_at IS NULL
GROUP BY tenant_id;

-- Upcoming Renewals View
CREATE OR REPLACE VIEW tenant_tools_upcoming_renewals AS
SELECT
    id,
    tenant_id,
    name,
    category,
    renewal_date,
    cost_amount,
    billing_cycle,
    auto_renew,
    cancellation_notice_days,
    (renewal_date - CURRENT_DATE) as days_until_renewal,
    CASE
        WHEN (renewal_date - CURRENT_DATE) <= 7 THEN 'critical'
        WHEN (renewal_date - CURRENT_DATE) <= 14 THEN 'warning'
        WHEN (renewal_date - CURRENT_DATE) <= 30 THEN 'upcoming'
        ELSE 'ok'
    END as urgency
FROM tenant_tools
WHERE
    archived_at IS NULL
    AND status = 'active'
    AND renewal_date IS NOT NULL
    AND renewal_date >= CURRENT_DATE
ORDER BY renewal_date ASC;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE tenant_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_tools ENABLE ROW LEVEL SECURITY;

-- Policies for tenant_contacts
CREATE POLICY "tenant_contacts_tenant_isolation" ON tenant_contacts
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Policies for tenant_tools
CREATE POLICY "tenant_tools_tenant_isolation" ON tenant_tools
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_tenant_contacts_updated_at ON tenant_contacts;
CREATE TRIGGER update_tenant_contacts_updated_at
    BEFORE UPDATE ON tenant_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_tools_updated_at ON tenant_tools;
CREATE TRIGGER update_tenant_tools_updated_at
    BEFORE UPDATE ON tenant_tools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT SERVICE ROLE ACCESS (for server actions)
-- ============================================
-- The service role bypasses RLS, so no additional grants needed
-- for admin operations using SUPABASE_SERVICE_KEY
