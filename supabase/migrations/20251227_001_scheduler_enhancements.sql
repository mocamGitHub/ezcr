-- NexCyte Scheduler Enhancement Pack - Database Migration
-- Features: External Calendar, Shortcuts API, Audit Log, User Prefs
-- Generated: 2025-12-27

-- 1) External calendar subscriptions (Webcal/ICS)
CREATE TABLE IF NOT EXISTS public.nx_external_calendar_subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  webcal_url TEXT NOT NULL,
  sync_frequency_minutes INT DEFAULT 60,
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.nx_external_calendar_subscription IS 'Webcal/ICS subscription URLs for external calendar sync';

-- 2) External calendar events (parsed from ICS)
CREATE TABLE IF NOT EXISTS public.nx_external_calendar_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.nx_external_calendar_subscription(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  external_uid TEXT NOT NULL,
  title TEXT,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  raw_ical TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (subscription_id, external_uid)
);

COMMENT ON TABLE public.nx_external_calendar_event IS 'Events parsed from external ICS/webcal feeds';

-- 3) iOS Shortcuts API tokens
CREATE TABLE IF NOT EXISTS public.nx_shortcuts_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.nx_shortcuts_token IS 'API tokens for iOS Shortcuts integration';
COMMENT ON COLUMN public.nx_shortcuts_token.token_hash IS 'SHA256 hash of the token - never store plaintext';
COMMENT ON COLUMN public.nx_shortcuts_token.scopes IS 'Allowed scopes: today, block-time, create-link, reschedule';

-- 4) Audit log for all actions
CREATE TABLE IF NOT EXISTS public.nx_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  actor_type TEXT NOT NULL DEFAULT 'user',
  actor_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.nx_audit_log IS 'Audit trail for scheduler actions';
COMMENT ON COLUMN public.nx_audit_log.actor_type IS 'user, shortcut, system, webhook';

-- 5) User calendar preferences
CREATE TABLE IF NOT EXISTS public.nx_user_calendar_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_view TEXT DEFAULT 'week',
  week_starts_on INT DEFAULT 0,
  time_format TEXT DEFAULT '12h',
  default_timezone TEXT DEFAULT 'America/New_York',
  show_weekends BOOLEAN DEFAULT true,
  scroll_position JSONB DEFAULT '{}',
  dismissed_notices TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.nx_user_calendar_prefs IS 'Per-user calendar display preferences';

-- 6) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nx_ext_cal_sub_tenant
  ON public.nx_external_calendar_subscription(tenant_id);

CREATE INDEX IF NOT EXISTS idx_nx_ext_cal_sub_user
  ON public.nx_external_calendar_subscription(user_id);

CREATE INDEX IF NOT EXISTS idx_nx_ext_cal_sub_active
  ON public.nx_external_calendar_subscription(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_nx_ext_cal_event_tenant
  ON public.nx_external_calendar_event(tenant_id, start_at DESC);

CREATE INDEX IF NOT EXISTS idx_nx_ext_cal_event_sub
  ON public.nx_external_calendar_event(subscription_id);

CREATE INDEX IF NOT EXISTS idx_nx_ext_cal_event_time
  ON public.nx_external_calendar_event(start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_nx_shortcuts_token_user
  ON public.nx_shortcuts_token(user_id);

CREATE INDEX IF NOT EXISTS idx_nx_shortcuts_token_hash
  ON public.nx_shortcuts_token(token_hash)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_nx_audit_log_tenant
  ON public.nx_audit_log(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nx_audit_log_user
  ON public.nx_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nx_audit_log_action
  ON public.nx_audit_log(action, created_at DESC);

-- 7) Enable RLS
ALTER TABLE public.nx_external_calendar_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nx_external_calendar_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nx_shortcuts_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nx_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nx_user_calendar_prefs ENABLE ROW LEVEL SECURITY;

-- 8) RLS Policies: External calendar subscription

-- Users can see their own subscriptions
DROP POLICY IF EXISTS "sub_select_own" ON public.nx_external_calendar_subscription;
CREATE POLICY "sub_select_own" ON public.nx_external_calendar_subscription
FOR SELECT USING (
  user_id = public.nx_uid()
  OR public.nx_is_tenant_admin(tenant_id)
);

-- Users can insert their own subscriptions
DROP POLICY IF EXISTS "sub_insert_own" ON public.nx_external_calendar_subscription;
CREATE POLICY "sub_insert_own" ON public.nx_external_calendar_subscription
FOR INSERT WITH CHECK (user_id = public.nx_uid());

-- Users can update their own subscriptions
DROP POLICY IF EXISTS "sub_update_own" ON public.nx_external_calendar_subscription;
CREATE POLICY "sub_update_own" ON public.nx_external_calendar_subscription
FOR UPDATE USING (user_id = public.nx_uid())
WITH CHECK (user_id = public.nx_uid());

-- Users can delete their own subscriptions
DROP POLICY IF EXISTS "sub_delete_own" ON public.nx_external_calendar_subscription;
CREATE POLICY "sub_delete_own" ON public.nx_external_calendar_subscription
FOR DELETE USING (user_id = public.nx_uid());

-- 9) RLS Policies: External calendar events

-- Users can see events from their subscriptions
DROP POLICY IF EXISTS "ext_event_select" ON public.nx_external_calendar_event;
CREATE POLICY "ext_event_select" ON public.nx_external_calendar_event
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.nx_external_calendar_subscription s
    WHERE s.id = subscription_id
    AND (s.user_id = public.nx_uid() OR public.nx_is_tenant_admin(s.tenant_id))
  )
);

-- Server-side insert only (via service role)
DROP POLICY IF EXISTS "ext_event_no_client_insert" ON public.nx_external_calendar_event;
CREATE POLICY "ext_event_no_client_insert" ON public.nx_external_calendar_event
FOR INSERT WITH CHECK (false);

-- 10) RLS Policies: Shortcuts tokens

-- Users can see their own tokens
DROP POLICY IF EXISTS "token_select_own" ON public.nx_shortcuts_token;
CREATE POLICY "token_select_own" ON public.nx_shortcuts_token
FOR SELECT USING (user_id = public.nx_uid());

-- Users can create their own tokens
DROP POLICY IF EXISTS "token_insert_own" ON public.nx_shortcuts_token;
CREATE POLICY "token_insert_own" ON public.nx_shortcuts_token
FOR INSERT WITH CHECK (user_id = public.nx_uid());

-- Users can update (revoke) their own tokens
DROP POLICY IF EXISTS "token_update_own" ON public.nx_shortcuts_token;
CREATE POLICY "token_update_own" ON public.nx_shortcuts_token
FOR UPDATE USING (user_id = public.nx_uid())
WITH CHECK (user_id = public.nx_uid());

-- Users can delete their own tokens
DROP POLICY IF EXISTS "token_delete_own" ON public.nx_shortcuts_token;
CREATE POLICY "token_delete_own" ON public.nx_shortcuts_token
FOR DELETE USING (user_id = public.nx_uid());

-- 11) RLS Policies: Audit log

-- Only tenant admins can read audit logs
DROP POLICY IF EXISTS "audit_select_admin" ON public.nx_audit_log;
CREATE POLICY "audit_select_admin" ON public.nx_audit_log
FOR SELECT USING (public.nx_is_tenant_admin(tenant_id));

-- Server-side insert only (via service role)
DROP POLICY IF EXISTS "audit_no_client_insert" ON public.nx_audit_log;
CREATE POLICY "audit_no_client_insert" ON public.nx_audit_log
FOR INSERT WITH CHECK (false);

-- 12) RLS Policies: Calendar preferences

-- Users can read their own prefs
DROP POLICY IF EXISTS "prefs_select_own" ON public.nx_user_calendar_prefs;
CREATE POLICY "prefs_select_own" ON public.nx_user_calendar_prefs
FOR SELECT USING (user_id = public.nx_uid());

-- Users can insert their own prefs
DROP POLICY IF EXISTS "prefs_insert_own" ON public.nx_user_calendar_prefs;
CREATE POLICY "prefs_insert_own" ON public.nx_user_calendar_prefs
FOR INSERT WITH CHECK (user_id = public.nx_uid());

-- Users can update their own prefs
DROP POLICY IF EXISTS "prefs_update_own" ON public.nx_user_calendar_prefs;
CREATE POLICY "prefs_update_own" ON public.nx_user_calendar_prefs
FOR UPDATE USING (user_id = public.nx_uid())
WITH CHECK (user_id = public.nx_uid());

-- 13) Trigger for updated_at
CREATE OR REPLACE FUNCTION public.nx_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS nx_ext_cal_sub_updated ON public.nx_external_calendar_subscription;
CREATE TRIGGER nx_ext_cal_sub_updated
  BEFORE UPDATE ON public.nx_external_calendar_subscription
  FOR EACH ROW EXECUTE FUNCTION public.nx_set_updated_at();

DROP TRIGGER IF EXISTS nx_ext_cal_event_updated ON public.nx_external_calendar_event;
CREATE TRIGGER nx_ext_cal_event_updated
  BEFORE UPDATE ON public.nx_external_calendar_event
  FOR EACH ROW EXECUTE FUNCTION public.nx_set_updated_at();

DROP TRIGGER IF EXISTS nx_user_prefs_updated ON public.nx_user_calendar_prefs;
CREATE TRIGGER nx_user_prefs_updated
  BEFORE UPDATE ON public.nx_user_calendar_prefs
  FOR EACH ROW EXECUTE FUNCTION public.nx_set_updated_at();

-- END migration
