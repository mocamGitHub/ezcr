-- Scheduler Notifications Outbox (NexCyte)
-- Ensures NexCyte is the single source of notifications (Mailgun/Twilio) for scheduler events.

create extension if not exists pgcrypto;

do $$ begin
  create type public.nx_notification_channel as enum ('email','sms','in_app');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.nx_notification_status as enum ('pending','sending','sent','failed','dead');
exception when duplicate_object then null;
end $$;

-- Durable outbox
create table if not exists public.nx_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  channel public.nx_notification_channel not null,
  event_key text not null, -- e.g., 'booking_created'
  to_address text not null, -- email or phone
  subject text,
  body_text text,
  body_html text,
  payload jsonb not null default '{}'::jsonb,
  related_table text,
  related_id text,
  status public.nx_notification_status not null default 'pending',
  attempt_count int not null default 0,
  max_attempts int not null default 6,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_nx_outbox_pending on public.nx_notification_outbox (status, next_attempt_at);
create index if not exists idx_nx_outbox_tenant on public.nx_notification_outbox (tenant_id, created_at desc);

-- Optional templates table (lightweight)
create table if not exists public.nx_notification_template (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  event_key text not null,
  channel public.nx_notification_channel not null,
  subject_template text,
  body_text_template text,
  body_html_template text,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, event_key, channel)
);

-- RLS
alter table public.nx_notification_outbox enable row level security;
alter table public.nx_notification_template enable row level security;

-- Expect helper functions from prior migration:
--   public.nx_is_tenant_member(tenant_id)
--   public.nx_is_tenant_admin(tenant_id)
-- If those don't exist, Claude Code must wire to your existing tenant auth model.

drop policy if exists "outbox_select_admin" on public.nx_notification_outbox;
create policy "outbox_select_admin" on public.nx_notification_outbox
for select using (public.nx_is_tenant_admin(tenant_id));

drop policy if exists "outbox_no_client_writes" on public.nx_notification_outbox;
create policy "outbox_no_client_writes" on public.nx_notification_outbox
for insert with check (false);

drop policy if exists "outbox_no_client_updates" on public.nx_notification_outbox;
create policy "outbox_no_client_updates" on public.nx_notification_outbox
for update using (false);

drop policy if exists "tmpl_select_member" on public.nx_notification_template;
create policy "tmpl_select_member" on public.nx_notification_template
for select using (public.nx_is_tenant_member(tenant_id));

drop policy if exists "tmpl_write_admin" on public.nx_notification_template;
create policy "tmpl_write_admin" on public.nx_notification_template
for all using (public.nx_is_tenant_admin(tenant_id))
with check (public.nx_is_tenant_admin(tenant_id));

-- Trigger helpers: enqueue notifications on scheduler booking changes
-- Assumes `public.nx_scheduler_booking` exists.
-- We enqueue EMAIL by default; SMS/in-app can be added by config later.

create or replace function public.nx_enqueue_scheduler_notification(
  p_tenant_id uuid,
  p_event_key text,
  p_to_email text,
  p_subject text,
  p_payload jsonb,
  p_related_table text,
  p_related_id text
) returns void
language plpgsql
as $$
begin
  insert into public.nx_notification_outbox (
    tenant_id, channel, event_key, to_address,
    subject, body_text, body_html,
    payload, related_table, related_id
  ) values (
    p_tenant_id, 'email', p_event_key, p_to_email,
    p_subject, null, null,
    coalesce(p_payload, '{}'::jsonb), p_related_table, p_related_id
  );
end;
$$;

create or replace function public.nx_trg_scheduler_booking_outbox()
returns trigger
language plpgsql
as $$
declare
  v_subject text;
  v_payload jsonb;
begin
  if (tg_op = 'INSERT') then
    v_subject := 'Appointment scheduled';
    v_payload := jsonb_build_object(
      'booking_uid', new.booking_uid,
      'event_type_id', new.cal_event_type_id,
      'start_at', new.start_at,
      'tenant_id', new.tenant_id,
      'status', new.status
    );
    perform public.nx_enqueue_scheduler_notification(
      new.tenant_id,
      'booking_created',
      new.attendee_email,
      v_subject,
      v_payload,
      'nx_scheduler_booking',
      new.booking_uid
    );
    return new;
  end if;

  if (tg_op = 'UPDATE') then
    -- cancelled
    if (old.status is distinct from new.status and new.status = 'cancelled') then
      v_subject := 'Appointment cancelled';
      v_payload := jsonb_build_object(
        'booking_uid', new.booking_uid,
        'start_at', new.start_at,
        'tenant_id', new.tenant_id,
        'status', new.status
      );
      perform public.nx_enqueue_scheduler_notification(
        new.tenant_id,
        'booking_cancelled',
        new.attendee_email,
        v_subject,
        v_payload,
        'nx_scheduler_booking',
        new.booking_uid
      );
    end if;

    -- rescheduled
    if (old.status is distinct from new.status and new.status = 'rescheduled') then
      v_subject := 'Appointment rescheduled';
      v_payload := jsonb_build_object(
        'booking_uid', new.booking_uid,
        'start_at', new.start_at,
        'tenant_id', new.tenant_id,
        'status', new.status
      );
      perform public.nx_enqueue_scheduler_notification(
        new.tenant_id,
        'booking_rescheduled',
        new.attendee_email,
        v_subject,
        v_payload,
        'nx_scheduler_booking',
        new.booking_uid
      );
    end if;

    return new;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_nx_sched_booking_outbox on public.nx_scheduler_booking;
create trigger trg_nx_sched_booking_outbox
after insert or update on public.nx_scheduler_booking
for each row execute function public.nx_trg_scheduler_booking_outbox();
