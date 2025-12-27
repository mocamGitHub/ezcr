-- NexCyte Cal.com Scheduler (API-driven) - Supabase Migration
-- Designed for "soft isolation" multi-tenancy (one instance), with strict RLS by tenant.
--
-- NOTE: This migration assumes you already have:
--   - auth.users (standard Supabase)
--   - a tenant table and membership system OR JWT tenant claims.
-- You MUST adapt the helper functions below to your repo’s exact auth/tenant model.

-- 1) Extensions (optional)
create extension if not exists pgcrypto;

-- 2) Enums
do $$ begin
  create type public.nx_account_kind as enum ('prospect', 'customer', 'staff');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.nx_booking_status as enum ('scheduled', 'cancelled', 'rescheduled');
exception
  when duplicate_object then null;
end $$;

-- 3) User profile (minimal)
-- If you already have a profile table, merge these columns instead of creating a new one.
create table if not exists public.nx_user_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_kind public.nx_account_kind not null default 'prospect',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4) Tenant settings for scheduler (maps tenant -> Cal.com org slug)
create table if not exists public.nx_scheduler_settings (
  tenant_id uuid primary key,
  organization_slug text not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) Event type mapping (controls which NexCyte roles can book which Cal.com event type IDs)
create table if not exists public.nx_scheduler_event_type_map (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  purpose text not null, -- e.g., 'intro_call', 'demo', 'support'
  cal_event_type_id integer not null,
  allow_kinds public.nx_account_kind[] not null default '{prospect,customer}'::public.nx_account_kind[],
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, purpose),
  unique (tenant_id, cal_event_type_id)
);

-- 6) Local booking mirror
create table if not exists public.nx_scheduler_booking (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  booking_uid text not null unique, -- Cal.com booking uid
  cal_booking_id bigint,
  cal_event_type_id integer not null,
  status public.nx_booking_status not null default 'scheduled',
  start_at timestamptz not null,
  end_at timestamptz,
  host_email text,
  attendee_user_id uuid references auth.users(id) on delete set null,
  attendee_email text not null,
  title text,
  location jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_nx_sched_booking_tenant on public.nx_scheduler_booking (tenant_id, start_at desc);
create index if not exists idx_nx_sched_booking_attendee on public.nx_scheduler_booking (attendee_user_id, start_at desc);

-- 7) Tenant membership helpers (ADAPT)
-- Replace this section with your real membership logic.
-- The default implementation expects a table:
--   public.nx_tenant_membership(tenant_id uuid, user_id uuid, role text)
-- If you don't have it, Claude Code should wire this to your existing tables/claims.

create table if not exists public.nx_tenant_membership (
  tenant_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member', -- 'member'|'admin'|'staff'
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

-- Helper: current user id
create or replace function public.nx_uid()
returns uuid language sql stable as $$
  select auth.uid()
$$;

-- Helper: is member of tenant
create or replace function public.nx_is_tenant_member(p_tenant_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.nx_tenant_membership m
    where m.tenant_id = p_tenant_id
      and m.user_id = public.nx_uid()
  )
$$;

-- Helper: is tenant admin/staff
create or replace function public.nx_is_tenant_admin(p_tenant_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.nx_tenant_membership m
    where m.tenant_id = p_tenant_id
      and m.user_id = public.nx_uid()
      and m.role in ('admin','staff')
  )
$$;

-- 8) RLS
alter table public.nx_user_profile enable row level security;
alter table public.nx_scheduler_settings enable row level security;
alter table public.nx_scheduler_event_type_map enable row level security;
alter table public.nx_scheduler_booking enable row level security;
alter table public.nx_tenant_membership enable row level security;

-- Profiles: user can read/update their own row
drop policy if exists "profile_select_own" on public.nx_user_profile;
create policy "profile_select_own" on public.nx_user_profile
for select using (user_id = public.nx_uid());

drop policy if exists "profile_update_own" on public.nx_user_profile;
create policy "profile_update_own" on public.nx_user_profile
for update using (user_id = public.nx_uid()) with check (user_id = public.nx_uid());

-- Membership: user can read own memberships; admins can read all for tenant
drop policy if exists "membership_select" on public.nx_tenant_membership;
create policy "membership_select" on public.nx_tenant_membership
for select using (
  user_id = public.nx_uid()
  or public.nx_is_tenant_admin(tenant_id)
);

-- Scheduler settings: member can read; admin/staff can write
drop policy if exists "sched_settings_select" on public.nx_scheduler_settings;
create policy "sched_settings_select" on public.nx_scheduler_settings
for select using (public.nx_is_tenant_member(tenant_id));

drop policy if exists "sched_settings_write" on public.nx_scheduler_settings;
create policy "sched_settings_write" on public.nx_scheduler_settings
for all using (public.nx_is_tenant_admin(tenant_id))
with check (public.nx_is_tenant_admin(tenant_id));

-- Event type map: member can read enabled mappings; admin/staff can write
drop policy if exists "event_map_select" on public.nx_scheduler_event_type_map;
create policy "event_map_select" on public.nx_scheduler_event_type_map
for select using (public.nx_is_tenant_member(tenant_id));

drop policy if exists "event_map_write" on public.nx_scheduler_event_type_map;
create policy "event_map_write" on public.nx_scheduler_event_type_map
for all using (public.nx_is_tenant_admin(tenant_id))
with check (public.nx_is_tenant_admin(tenant_id));

-- Booking mirror:
-- - attendee can read their own bookings (by attendee_user_id)
-- - tenant admins/staff can read all bookings for tenant
-- - inserts/updates should be done server-side with service role in Next.js API routes
drop policy if exists "booking_select_attendee_or_admin" on public.nx_scheduler_booking;
create policy "booking_select_attendee_or_admin" on public.nx_scheduler_booking
for select using (
  (attendee_user_id = public.nx_uid())
  or public.nx_is_tenant_admin(tenant_id)
);

-- Optional: prevent direct client inserts
drop policy if exists "booking_no_client_insert" on public.nx_scheduler_booking;
create policy "booking_no_client_insert" on public.nx_scheduler_booking
for insert with check (false);

drop policy if exists "booking_no_client_update" on public.nx_scheduler_booking;
create policy "booking_no_client_update" on public.nx_scheduler_booking
for update using (false);

-- END migration
