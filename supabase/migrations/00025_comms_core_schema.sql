-- ============================================================================
-- NexCyte Comms Management - Core Schema
-- Migration: 00025_comms_core_schema.sql
-- ============================================================================

begin;

-- ============================================================================
-- 1. CORE TABLES
-- ============================================================================

-- Contacts table
create table if not exists public.comms_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  email text,
  phone_e164 text,
  display_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  constraint comms_contacts_email_or_phone_check
    check (email is not null or phone_e164 is not null)
);

create unique index if not exists comms_contacts_tenant_email_uniq
  on public.comms_contacts(tenant_id, email)
  where email is not null and archived_at is null;

create unique index if not exists comms_contacts_tenant_phone_uniq
  on public.comms_contacts(tenant_id, phone_e164)
  where phone_e164 is not null and archived_at is null;

create index if not exists comms_contacts_tenant_idx
  on public.comms_contacts(tenant_id);

-- Channel preferences
create table if not exists public.comms_channel_preferences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  contact_id uuid not null references public.comms_contacts(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  consent_status text not null default 'unknown'
    check (consent_status in ('opted_in', 'opted_out', 'unknown')),
  consent_source text,
  consent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(tenant_id, contact_id, channel)
);

create index if not exists comms_channel_prefs_contact_idx
  on public.comms_channel_preferences(contact_id);

-- Templates
create table if not exists public.comms_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  channel text not null check (channel in ('email', 'sms')),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  active_version_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  unique(tenant_id, name)
);

create index if not exists comms_templates_tenant_idx
  on public.comms_templates(tenant_id);

-- Template versions
create table if not exists public.comms_template_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  template_id uuid not null references public.comms_templates(id) on delete cascade,
  version_number int not null,
  channel text not null check (channel in ('email', 'sms')),
  subject text,
  text_body text,
  html_body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  unique(template_id, version_number)
);

create index if not exists comms_template_versions_template_idx
  on public.comms_template_versions(template_id);

-- Add foreign key for active_version_id after template_versions exists
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'comms_templates_active_version_fk'
  ) then
    alter table public.comms_templates
      add constraint comms_templates_active_version_fk
      foreign key (active_version_id)
      references public.comms_template_versions(id)
      on delete set null;
  end if;
end $$;

-- Sequences
create table if not exists public.comms_sequences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  unique(tenant_id, name)
);

create index if not exists comms_sequences_tenant_idx
  on public.comms_sequences(tenant_id);

-- Sequence steps
create table if not exists public.comms_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  sequence_id uuid not null references public.comms_sequences(id) on delete cascade,
  step_number int not null,
  delay_seconds int not null default 0,
  template_version_id uuid references public.comms_template_versions(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  unique(sequence_id, step_number)
);

create index if not exists comms_sequence_steps_sequence_idx
  on public.comms_sequence_steps(sequence_id);

-- Conversations (threading)
create table if not exists public.comms_conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  contact_id uuid not null references public.comms_contacts(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  subject text,
  status text not null default 'open' check (status in ('open', 'closed', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(tenant_id, contact_id, channel, subject)
);

create index if not exists comms_conversations_tenant_idx
  on public.comms_conversations(tenant_id);

create index if not exists comms_conversations_contact_idx
  on public.comms_conversations(contact_id);

-- Messages
create table if not exists public.comms_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  conversation_id uuid references public.comms_conversations(id) on delete set null,
  contact_id uuid not null references public.comms_contacts(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  direction text not null check (direction in ('outbound', 'inbound')),
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'failed', 'bounced', 'complained', 'unsubscribed')),
  provider text not null check (provider in ('mailgun', 'twilio')),
  provider_message_id text,
  template_version_id uuid references public.comms_template_versions(id) on delete set null,
  from_address text,
  to_address text not null,
  subject text,
  text_body text,
  html_body text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_messages_tenant_idx
  on public.comms_messages(tenant_id);

create index if not exists comms_messages_conversation_idx
  on public.comms_messages(conversation_id);

create index if not exists comms_messages_contact_idx
  on public.comms_messages(contact_id);

create index if not exists comms_messages_provider_msg_idx
  on public.comms_messages(provider, provider_message_id)
  where provider_message_id is not null;

-- Message events (delivery tracking)
create table if not exists public.comms_message_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  message_id uuid not null references public.comms_messages(id) on delete cascade,
  event_type text not null,
  provider text not null check (provider in ('mailgun', 'twilio')),
  provider_event_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists comms_message_events_message_idx
  on public.comms_message_events(message_id);

create index if not exists comms_message_events_tenant_idx
  on public.comms_message_events(tenant_id);

-- Message attachments
create table if not exists public.comms_message_attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  message_id uuid not null references public.comms_messages(id) on delete cascade,
  filename text not null,
  content_type text,
  size_bytes int,
  storage_path text,
  url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists comms_message_attachments_message_idx
  on public.comms_message_attachments(message_id);

-- Inbound routes (for routing webhooks to tenants)
create table if not exists public.comms_inbound_routes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  provider text not null check (provider in ('mailgun', 'twilio')),
  channel text not null check (channel in ('email', 'sms')),
  route_secret text not null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(tenant_id, provider, route_secret)
);

create index if not exists comms_inbound_routes_secret_idx
  on public.comms_inbound_routes(provider, route_secret)
  where is_active = true;

-- Tenant settings
create table if not exists public.comms_tenant_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique,
  default_from_email text,
  default_from_name text,
  default_reply_to text,
  rate_limit_email_per_hour int default 100,
  rate_limit_sms_per_hour int default 50,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_tenant_settings_tenant_idx
  on public.comms_tenant_settings(tenant_id);

-- ============================================================================
-- 2. TRIGGERS FOR UPDATED_AT
-- ============================================================================

create or replace function public.comms_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
drop trigger if exists trg_comms_contacts_touch on public.comms_contacts;
create trigger trg_comms_contacts_touch
  before update on public.comms_contacts
  for each row execute procedure public.comms_touch_updated_at();

drop trigger if exists trg_comms_channel_prefs_touch on public.comms_channel_preferences;
create trigger trg_comms_channel_prefs_touch
  before update on public.comms_channel_preferences
  for each row execute procedure public.comms_touch_updated_at();

drop trigger if exists trg_comms_templates_touch on public.comms_templates;
create trigger trg_comms_templates_touch
  before update on public.comms_templates
  for each row execute procedure public.comms_touch_updated_at();

drop trigger if exists trg_comms_sequences_touch on public.comms_sequences;
create trigger trg_comms_sequences_touch
  before update on public.comms_sequences
  for each row execute procedure public.comms_touch_updated_at();

drop trigger if exists trg_comms_conversations_touch on public.comms_conversations;
create trigger trg_comms_conversations_touch
  before update on public.comms_conversations
  for each row execute procedure public.comms_touch_updated_at();

drop trigger if exists trg_comms_messages_touch on public.comms_messages;
create trigger trg_comms_messages_touch
  before update on public.comms_messages
  for each row execute procedure public.comms_touch_updated_at();

drop trigger if exists trg_comms_inbound_routes_touch on public.comms_inbound_routes;
create trigger trg_comms_inbound_routes_touch
  before update on public.comms_inbound_routes
  for each row execute procedure public.comms_touch_updated_at();

drop trigger if exists trg_comms_tenant_settings_touch on public.comms_tenant_settings;
create trigger trg_comms_tenant_settings_touch
  before update on public.comms_tenant_settings
  for each row execute procedure public.comms_touch_updated_at();

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table public.comms_contacts enable row level security;
alter table public.comms_channel_preferences enable row level security;
alter table public.comms_templates enable row level security;
alter table public.comms_template_versions enable row level security;
alter table public.comms_sequences enable row level security;
alter table public.comms_sequence_steps enable row level security;
alter table public.comms_conversations enable row level security;
alter table public.comms_messages enable row level security;
alter table public.comms_message_events enable row level security;
alter table public.comms_message_attachments enable row level security;
alter table public.comms_inbound_routes enable row level security;
alter table public.comms_tenant_settings enable row level security;

-- Create tenant_id resolver function
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'comms_current_tenant_id') then
    execute $fn$
      create function public.comms_current_tenant_id()
      returns uuid
      language sql
      stable
      as $body$
        select nullif(current_setting('request.jwt.claim.tenant_id', true), '')::uuid;
      $body$;
    $fn$;
  end if;
end $$;

-- RLS Policies for all tables
-- comms_contacts
drop policy if exists "comms_contacts_select" on public.comms_contacts;
create policy "comms_contacts_select" on public.comms_contacts
  for select using (tenant_id = public.comms_current_tenant_id());

drop policy if exists "comms_contacts_insert" on public.comms_contacts;
create policy "comms_contacts_insert" on public.comms_contacts
  for insert with check (tenant_id = public.comms_current_tenant_id());

drop policy if exists "comms_contacts_update" on public.comms_contacts;
create policy "comms_contacts_update" on public.comms_contacts
  for update using (tenant_id = public.comms_current_tenant_id())
  with check (tenant_id = public.comms_current_tenant_id());

-- Apply similar policies to all other tables
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'comms_channel_preferences',
      'comms_templates',
      'comms_template_versions',
      'comms_sequences',
      'comms_sequence_steps',
      'comms_conversations',
      'comms_messages',
      'comms_message_events',
      'comms_message_attachments',
      'comms_inbound_routes',
      'comms_tenant_settings'
    ])
  loop
    execute format('drop policy if exists "%s_select" on public.%I', tbl, tbl);
    execute format('create policy "%s_select" on public.%I for select using (tenant_id = public.comms_current_tenant_id())', tbl, tbl);

    execute format('drop policy if exists "%s_insert" on public.%I', tbl, tbl);
    execute format('create policy "%s_insert" on public.%I for insert with check (tenant_id = public.comms_current_tenant_id())', tbl, tbl);

    execute format('drop policy if exists "%s_update" on public.%I', tbl, tbl);
    execute format('create policy "%s_update" on public.%I for update using (tenant_id = public.comms_current_tenant_id()) with check (tenant_id = public.comms_current_tenant_id())', tbl, tbl);
  end loop;
end $$;

commit;
