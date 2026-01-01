-- =============================================================================
-- EZCR Tasks MVP Migration
-- Version: 1.0.0
-- Date: 2026-01-01
-- =============================================================================
-- This migration creates:
-- 1. Task workspaces (tenant-scoped)
-- 2. Task boards and columns
-- 3. Task items with priority, status, assignments
-- 4. Task comments, watchers, attachments
-- 5. Task links (polymorphic entity references)
-- 6. Entity registry for link validation
-- 7. Helper functions for access control
-- 8. RLS policies
-- 9. Seeds for default workspace/board/columns
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1) ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM ('urgent', 'high', 'normal', 'low');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('open', 'closed', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.task_workspace_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.task_entity_kind AS ENUM ('order', 'appointment', 'customer', 'ticket', 'lead', 'invoice', 'shipment', 'inventory_item');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2) TABLES
-- =============================================================================

-- Task Workspaces (tenant-scoped containers for boards)
CREATE TABLE IF NOT EXISTS public.task_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_task_workspaces_tenant ON public.task_workspaces(tenant_id);

-- Task Workspace Members (for explicit role assignments if needed)
CREATE TABLE IF NOT EXISTS public.task_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.task_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.task_workspace_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_workspace_members_workspace ON public.task_workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_workspace_members_user ON public.task_workspace_members(user_id);

-- Task Boards (organize tasks within a workspace)
CREATE TABLE IF NOT EXISTS public.task_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.task_workspaces(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_task_boards_workspace ON public.task_boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_boards_position ON public.task_boards(workspace_id, position);

-- Task Board Columns (Kanban columns)
CREATE TABLE IF NOT EXISTS public.task_board_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.task_boards(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  position INT NOT NULL DEFAULT 0,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  wip_limit INT, -- Work in progress limit (optional)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(board_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_task_board_columns_board ON public.task_board_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_task_board_columns_position ON public.task_board_columns(board_id, position);

-- Task Items (the actual tasks)
CREATE TABLE IF NOT EXISTS public.task_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.task_boards(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES public.task_board_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority public.task_priority NOT NULL DEFAULT 'normal',
  status public.task_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  position INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_items_board ON public.task_items(board_id);
CREATE INDEX IF NOT EXISTS idx_task_items_column ON public.task_items(column_id);
CREATE INDEX IF NOT EXISTS idx_task_items_assigned ON public.task_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_items_created_by ON public.task_items(created_by);
CREATE INDEX IF NOT EXISTS idx_task_items_status ON public.task_items(status);
CREATE INDEX IF NOT EXISTS idx_task_items_priority ON public.task_items(priority);
CREATE INDEX IF NOT EXISTS idx_task_items_due_at ON public.task_items(due_at) WHERE due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_items_position ON public.task_items(column_id, position);

-- Task Comments
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.task_items(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author ON public.task_comments(author_id);

-- Task Watchers (users watching a task for notifications)
CREATE TABLE IF NOT EXISTS public.task_watchers (
  task_id UUID NOT NULL REFERENCES public.task_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_watchers_user ON public.task_watchers(user_id);

-- Task Attachments (metadata only; files stored in Storage)
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.task_items(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  content_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON public.task_attachments(task_id);

-- Task Links (polymorphic references to orders, appointments, etc.)
CREATE TABLE IF NOT EXISTS public.task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.task_items(id) ON DELETE CASCADE,
  entity_kind public.task_entity_kind NOT NULL,
  entity_id UUID NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb, -- Contains: label, unresolved flag
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, entity_kind, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_task_links_task ON public.task_links(task_id);
CREATE INDEX IF NOT EXISTS idx_task_links_entity ON public.task_links(entity_kind, entity_id);

-- Task Entity Registry (maps entity_kind to actual table for validation)
CREATE TABLE IF NOT EXISTS public.task_entity_registry (
  entity_kind public.task_entity_kind PRIMARY KEY,
  table_name TEXT,
  tenant_id_column TEXT DEFAULT 'tenant_id',
  label_column TEXT,
  require_exists BOOLEAN NOT NULL DEFAULT FALSE,
  allow_unresolved BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT
);

-- =============================================================================
-- 3) HELPER FUNCTIONS
-- =============================================================================

-- Role ranking function
CREATE OR REPLACE FUNCTION public.task_role_rank(role public.task_workspace_role)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE role
    WHEN 'viewer' THEN 1
    WHEN 'member' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'owner' THEN 4
    ELSE 0
  END;
$$;

-- Check if user is a tenant member with minimum role
-- Uses existing user_profiles table and has_role function
CREATE OR REPLACE FUNCTION public.task_is_tenant_member(
  p_tenant_id UUID,
  p_min_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.tenant_id = p_tenant_id
      AND up.is_active = TRUE
      AND public.has_role(up.id, p_min_role)
  );
$$;

-- Get workspace's tenant_id
CREATE OR REPLACE FUNCTION public.task_get_workspace_tenant(p_workspace_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT tenant_id FROM public.task_workspaces WHERE id = p_workspace_id;
$$;

-- Check if user can access a workspace with minimum role
CREATE OR REPLACE FUNCTION public.task_can_access_workspace(
  p_workspace_id UUID,
  p_min_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.task_is_tenant_member(
    public.task_get_workspace_tenant(p_workspace_id),
    p_min_role
  );
$$;

-- Get task's workspace and tenant
CREATE OR REPLACE FUNCTION public.task_get_task_workspace(p_task_id UUID)
RETURNS TABLE(workspace_id UUID, tenant_id UUID)
LANGUAGE sql
STABLE
AS $$
  SELECT tw.id, tw.tenant_id
  FROM public.task_items ti
  JOIN public.task_boards tb ON tb.id = ti.board_id
  JOIN public.task_workspaces tw ON tw.id = tb.workspace_id
  WHERE ti.id = p_task_id;
$$;

-- Check if user can access a task
CREATE OR REPLACE FUNCTION public.task_can_access_task(
  p_task_id UUID,
  p_min_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_get_task_workspace(p_task_id) t
    WHERE public.task_is_tenant_member(t.tenant_id, p_min_role)
  );
$$;

-- =============================================================================
-- 4) CROSS-TENANT VALIDATION TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.task_links_enforce_tenant_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workspace_id UUID;
  v_tenant_id UUID;
  v_registry RECORD;
  v_entity_tenant_id UUID;
  v_entity_label TEXT;
  v_query TEXT;
BEGIN
  -- Get task's workspace and tenant
  SELECT workspace_id, tenant_id INTO v_workspace_id, v_tenant_id
  FROM public.task_get_task_workspace(NEW.task_id);

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found or has no tenant';
  END IF;

  -- Get entity registry entry
  SELECT * INTO v_registry
  FROM public.task_entity_registry
  WHERE entity_kind = NEW.entity_kind;

  -- If no registry entry, allow if unresolved is permitted globally
  IF v_registry IS NULL THEN
    IF NEW.meta->>'label' IS NOT NULL THEN
      NEW.meta := jsonb_set(NEW.meta, '{unresolved}', 'true'::jsonb);
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Entity kind % not registered and no label provided', NEW.entity_kind;
    END IF;
  END IF;

  -- If table doesn't exist or require_exists is false
  IF v_registry.table_name IS NULL OR NOT v_registry.require_exists THEN
    IF v_registry.allow_unresolved AND NEW.meta->>'label' IS NOT NULL THEN
      NEW.meta := jsonb_set(NEW.meta, '{unresolved}', 'true'::jsonb);
      RETURN NEW;
    ELSIF NOT v_registry.require_exists THEN
      NEW.meta := jsonb_set(NEW.meta, '{unresolved}', 'true'::jsonb);
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Entity kind % requires a label when table is not configured', NEW.entity_kind;
    END IF;
  END IF;

  -- Validate entity exists and tenant matches
  v_query := format(
    'SELECT %I, %I FROM public.%I WHERE id = $1',
    v_registry.tenant_id_column,
    COALESCE(v_registry.label_column, 'id'),
    v_registry.table_name
  );

  EXECUTE v_query INTO v_entity_tenant_id, v_entity_label USING NEW.entity_id;

  IF v_entity_tenant_id IS NULL THEN
    IF v_registry.allow_unresolved AND NEW.meta->>'label' IS NOT NULL THEN
      NEW.meta := jsonb_set(NEW.meta, '{unresolved}', 'true'::jsonb);
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Entity % not found in table %', NEW.entity_id, v_registry.table_name;
    END IF;
  END IF;

  IF v_entity_tenant_id != v_tenant_id THEN
    RAISE EXCEPTION 'Entity tenant (%) does not match task tenant (%)', v_entity_tenant_id, v_tenant_id;
  END IF;

  -- Store the label if we found one
  IF v_entity_label IS NOT NULL AND NEW.meta->>'label' IS NULL THEN
    NEW.meta := jsonb_set(NEW.meta, '{label}', to_jsonb(v_entity_label::text));
  END IF;

  -- Clear unresolved flag since we validated
  NEW.meta := NEW.meta - 'unresolved';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_links_tenant_check ON public.task_links;
CREATE TRIGGER trg_task_links_tenant_check
  BEFORE INSERT OR UPDATE ON public.task_links
  FOR EACH ROW
  EXECUTE FUNCTION public.task_links_enforce_tenant_consistency();

-- =============================================================================
-- 5) RLS POLICIES
-- =============================================================================

-- Enable RLS on all task tables
ALTER TABLE public.task_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_entity_registry ENABLE ROW LEVEL SECURITY;

-- Service role bypass for all tables
CREATE POLICY "service_role_all_task_workspaces" ON public.task_workspaces
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_task_workspace_members" ON public.task_workspace_members
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_task_boards" ON public.task_boards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_task_board_columns" ON public.task_board_columns
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_task_items" ON public.task_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_task_comments" ON public.task_comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_task_watchers" ON public.task_watchers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_task_attachments" ON public.task_attachments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_task_links" ON public.task_links
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Entity registry is read-only for authenticated users
CREATE POLICY "authenticated_read_task_entity_registry" ON public.task_entity_registry
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_role_all_task_entity_registry" ON public.task_entity_registry
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Workspaces: tenant members can read; admins can manage
CREATE POLICY "tenant_members_read_workspaces" ON public.task_workspaces
  FOR SELECT TO authenticated
  USING (public.task_is_tenant_member(tenant_id, 'viewer'));

CREATE POLICY "tenant_admins_manage_workspaces" ON public.task_workspaces
  FOR ALL TO authenticated
  USING (public.task_is_tenant_member(tenant_id, 'admin'))
  WITH CHECK (public.task_is_tenant_member(tenant_id, 'admin'));

-- Workspace members: can read own; admins can manage
CREATE POLICY "users_read_own_membership" ON public.task_workspace_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.task_can_access_workspace(workspace_id, 'admin'));

CREATE POLICY "admins_manage_workspace_members" ON public.task_workspace_members
  FOR ALL TO authenticated
  USING (public.task_can_access_workspace(workspace_id, 'admin'))
  WITH CHECK (public.task_can_access_workspace(workspace_id, 'admin'));

-- Boards: members can read; admins can manage
CREATE POLICY "members_read_boards" ON public.task_boards
  FOR SELECT TO authenticated
  USING (public.task_can_access_workspace(workspace_id, 'viewer'));

CREATE POLICY "admins_manage_boards" ON public.task_boards
  FOR ALL TO authenticated
  USING (public.task_can_access_workspace(workspace_id, 'admin'))
  WITH CHECK (public.task_can_access_workspace(workspace_id, 'admin'));

-- Columns: members can read; admins can manage
CREATE POLICY "members_read_columns" ON public.task_board_columns
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.task_boards tb
      WHERE tb.id = task_board_columns.board_id
        AND public.task_can_access_workspace(tb.workspace_id, 'viewer')
    )
  );

CREATE POLICY "admins_manage_columns" ON public.task_board_columns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.task_boards tb
      WHERE tb.id = task_board_columns.board_id
        AND public.task_can_access_workspace(tb.workspace_id, 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_boards tb
      WHERE tb.id = task_board_columns.board_id
        AND public.task_can_access_workspace(tb.workspace_id, 'admin')
    )
  );

-- Tasks: viewers can read; members can CRUD
CREATE POLICY "viewers_read_tasks" ON public.task_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.task_boards tb
      WHERE tb.id = task_items.board_id
        AND public.task_can_access_workspace(tb.workspace_id, 'viewer')
    )
  );

CREATE POLICY "members_manage_tasks" ON public.task_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.task_boards tb
      WHERE tb.id = task_items.board_id
        AND public.task_can_access_workspace(tb.workspace_id, 'member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_boards tb
      WHERE tb.id = task_items.board_id
        AND public.task_can_access_workspace(tb.workspace_id, 'member')
    )
  );

-- Comments: viewers can read; members can create; users can update/delete own
CREATE POLICY "viewers_read_comments" ON public.task_comments
  FOR SELECT TO authenticated
  USING (public.task_can_access_task(task_id, 'viewer'));

CREATE POLICY "members_create_comments" ON public.task_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.task_can_access_task(task_id, 'member')
    AND author_id = auth.uid()
  );

CREATE POLICY "authors_update_own_comments" ON public.task_comments
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "authors_delete_own_comments" ON public.task_comments
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Watchers: viewers can read; members can manage
CREATE POLICY "viewers_read_watchers" ON public.task_watchers
  FOR SELECT TO authenticated
  USING (public.task_can_access_task(task_id, 'viewer'));

CREATE POLICY "members_manage_watchers" ON public.task_watchers
  FOR ALL TO authenticated
  USING (public.task_can_access_task(task_id, 'member'))
  WITH CHECK (public.task_can_access_task(task_id, 'member'));

-- Attachments: viewers can read; members can manage
CREATE POLICY "viewers_read_attachments" ON public.task_attachments
  FOR SELECT TO authenticated
  USING (public.task_can_access_task(task_id, 'viewer'));

CREATE POLICY "members_manage_attachments" ON public.task_attachments
  FOR ALL TO authenticated
  USING (public.task_can_access_task(task_id, 'member'))
  WITH CHECK (public.task_can_access_task(task_id, 'member'));

-- Links: viewers can read; members can manage
CREATE POLICY "viewers_read_links" ON public.task_links
  FOR SELECT TO authenticated
  USING (public.task_can_access_task(task_id, 'viewer'));

CREATE POLICY "members_manage_links" ON public.task_links
  FOR ALL TO authenticated
  USING (public.task_can_access_task(task_id, 'member'))
  WITH CHECK (public.task_can_access_task(task_id, 'member'));

-- =============================================================================
-- 6) TRIGGERS FOR updated_at
-- =============================================================================

CREATE TRIGGER update_task_workspaces_updated_at
  BEFORE UPDATE ON public.task_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_workspace_members_updated_at
  BEFORE UPDATE ON public.task_workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_boards_updated_at
  BEFORE UPDATE ON public.task_boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_board_columns_updated_at
  BEFORE UPDATE ON public.task_board_columns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_items_updated_at
  BEFORE UPDATE ON public.task_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 7) SEED DATA
-- =============================================================================

-- Seed entity registry
INSERT INTO public.task_entity_registry (entity_kind, table_name, tenant_id_column, label_column, require_exists, allow_unresolved, notes)
VALUES
  ('order', 'orders', 'tenant_id', 'order_number', TRUE, FALSE, 'Links to orders table'),
  ('appointment', 'nx_scheduler_booking', 'tenant_id', 'attendee_email', TRUE, FALSE, 'Links to scheduler bookings'),
  ('customer', NULL, NULL, NULL, FALSE, TRUE, 'Customer entities not yet implemented; uses label only'),
  ('ticket', NULL, NULL, NULL, FALSE, TRUE, 'Support tickets not yet implemented'),
  ('lead', NULL, NULL, NULL, FALSE, TRUE, 'Lead entities not yet implemented'),
  ('invoice', NULL, NULL, NULL, FALSE, TRUE, 'Invoice entities not yet implemented'),
  ('shipment', NULL, NULL, NULL, FALSE, TRUE, 'Shipment entities not yet implemented'),
  ('inventory_item', 'products', 'tenant_id', 'name', TRUE, FALSE, 'Links to products table')
ON CONFLICT (entity_kind) DO UPDATE SET
  table_name = EXCLUDED.table_name,
  tenant_id_column = EXCLUDED.tenant_id_column,
  label_column = EXCLUDED.label_column,
  require_exists = EXCLUDED.require_exists,
  allow_unresolved = EXCLUDED.allow_unresolved,
  notes = EXCLUDED.notes;

-- Seed default workspace and board for all existing tenants
-- This uses a DO block to iterate over tenants
DO $$
DECLARE
  v_tenant RECORD;
  v_workspace_id UUID;
  v_board_id UUID;
  v_columns JSONB := '[
    {"slug": "inbox", "name": "Inbox", "color": "#6b7280", "position": 0, "is_done": false},
    {"slug": "ready", "name": "Ready", "color": "#3b82f6", "position": 1, "is_done": false},
    {"slug": "doing", "name": "Doing", "color": "#f59e0b", "position": 2, "is_done": false},
    {"slug": "waiting", "name": "Waiting", "color": "#8b5cf6", "position": 3, "is_done": false},
    {"slug": "done", "name": "Done", "color": "#10b981", "position": 4, "is_done": true}
  ]'::jsonb;
  v_col JSONB;
BEGIN
  FOR v_tenant IN SELECT id FROM public.tenants LOOP
    -- Create workspace if not exists
    INSERT INTO public.task_workspaces (tenant_id, slug, name, description)
    VALUES (v_tenant.id, 'ops', 'Operations', 'Default operations workspace')
    ON CONFLICT (tenant_id, slug) DO NOTHING
    RETURNING id INTO v_workspace_id;

    -- Get workspace_id if it already existed
    IF v_workspace_id IS NULL THEN
      SELECT id INTO v_workspace_id
      FROM public.task_workspaces
      WHERE tenant_id = v_tenant.id AND slug = 'ops';
    END IF;

    -- Create board if not exists
    INSERT INTO public.task_boards (workspace_id, slug, name, description, position)
    VALUES (v_workspace_id, 'operations', 'Operations Board', 'Main operations board', 0)
    ON CONFLICT (workspace_id, slug) DO NOTHING
    RETURNING id INTO v_board_id;

    -- Get board_id if it already existed
    IF v_board_id IS NULL THEN
      SELECT id INTO v_board_id
      FROM public.task_boards
      WHERE workspace_id = v_workspace_id AND slug = 'operations';
    END IF;

    -- Create columns
    FOR v_col IN SELECT * FROM jsonb_array_elements(v_columns) LOOP
      INSERT INTO public.task_board_columns (board_id, slug, name, color, position, is_done)
      VALUES (
        v_board_id,
        v_col->>'slug',
        v_col->>'name',
        v_col->>'color',
        (v_col->>'position')::int,
        (v_col->>'is_done')::boolean
      )
      ON CONFLICT (board_id, slug) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

COMMIT;
