-- ZeroTouch safe seed: does not require tenant-specific Cal.com eventTypeIds.
-- Creates nx_user_profile rows for any auth.users missing.
-- Creates default scheduler notification templates for each tenant found, if a tenants table exists.

-- 1) Ensure profiles exist
insert into public.nx_user_profile (user_id, account_kind)
select u.id, 'prospect'::public.nx_account_kind
from auth.users u
left join public.nx_user_profile p on p.user_id = u.id
where p.user_id is null;

-- 2) Attempt to discover tenant ids from common table names
do $$
declare
  v_tbl text := null;
  v_has boolean := false;
begin
  -- Prefer a canonical tenants table if present
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='tenants') then
    v_tbl := 'public.tenants';
  elsif exists (select 1 from information_schema.tables where table_schema='public' and table_name='nx_tenant') then
    v_tbl := 'public.nx_tenant';
  elsif exists (select 1 from information_schema.tables where table_schema='public' and table_name='nx_tenants') then
    v_tbl := 'public.nx_tenants';
  else
    v_tbl := null;
  end if;

  if v_tbl is null then
    raise notice 'No tenants table found; skipping tenant template seeding.';
    return;
  end if;

  -- Create default templates for scheduler notifications per tenant (email + sms)
  execute format($q$
    insert into public.nx_notification_template
      (tenant_id, event_key, channel, subject_template, body_text_template, body_html_template, is_enabled)
    select t.id, 'booking_created', 'email', 'Appointment scheduled',
           'Your appointment is scheduled for {{start_at}}.', null, true
    from %s t
    on conflict (tenant_id, event_key, channel) do nothing;
  $q$, v_tbl);

  execute format($q$
    insert into public.nx_notification_template
      (tenant_id, event_key, channel, subject_template, body_text_template, body_html_template, is_enabled)
    select t.id, 'booking_cancelled', 'email', 'Appointment cancelled',
           'Your appointment has been cancelled.', null, true
    from %s t
    on conflict (tenant_id, event_key, channel) do nothing;
  $q$, v_tbl);

  execute format($q$
    insert into public.nx_notification_template
      (tenant_id, event_key, channel, subject_template, body_text_template, body_html_template, is_enabled)
    select t.id, 'booking_rescheduled', 'email', 'Appointment rescheduled',
           'Your appointment has been rescheduled to {{start_at}}.', null, true
    from %s t
    on conflict (tenant_id, event_key, channel) do nothing;
  $q$, v_tbl);

  execute format($q$
    insert into public.nx_notification_template
      (tenant_id, event_key, channel, subject_template, body_text_template, body_html_template, is_enabled)
    select t.id, 'booking_created', 'sms', null,
           'Scheduled: {{start_at}}', null, true
    from %s t
    on conflict (tenant_id, event_key, channel) do nothing;
  $q$, v_tbl);

  execute format($q$
    insert into public.nx_notification_template
      (tenant_id, event_key, channel, subject_template, body_text_template, body_html_template, is_enabled)
    select t.id, 'booking_cancelled', 'sms', null,
           'Cancelled.', null, true
    from %s t
    on conflict (tenant_id, event_key, channel) do nothing;
  $q$, v_tbl);

  execute format($q$
    insert into public.nx_notification_template
      (tenant_id, event_key, channel, subject_template, body_text_template, body_html_template, is_enabled)
    select t.id, 'booking_rescheduled', 'sms', null,
           'Rescheduled: {{start_at}}', null, true
    from %s t
    on conflict (tenant_id, event_key, channel) do nothing;
  $q$, v_tbl);

  raise notice 'Seeded default scheduler notification templates using %', v_tbl;
end$$;
