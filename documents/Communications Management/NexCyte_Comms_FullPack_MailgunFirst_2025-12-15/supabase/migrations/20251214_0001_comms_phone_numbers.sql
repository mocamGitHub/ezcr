begin;

create table if not exists public.comms_phone_numbers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  provider text not null default 'twilio',
  phone_number text not null, -- E.164
  label text,
  is_active boolean not null default true,
  is_primary boolean not null default false,
  capabilities jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'comms_phone_numbers_provider_check') then
    alter table public.comms_phone_numbers
      add constraint comms_phone_numbers_provider_check
      check (provider in ('twilio'));
  end if;
end $$;

create unique index if not exists comms_phone_numbers_provider_number_uniq
  on public.comms_phone_numbers(provider, phone_number);

create index if not exists comms_phone_numbers_tenant_idx
  on public.comms_phone_numbers(tenant_id);

create index if not exists comms_phone_numbers_active_idx
  on public.comms_phone_numbers(provider, phone_number)
  where archived_at is null and is_active = true;

create or replace function public.comms_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_comms_phone_numbers_touch on public.comms_phone_numbers;
create trigger trg_comms_phone_numbers_touch
before update on public.comms_phone_numbers
for each row execute procedure public.comms_touch_updated_at();

alter table public.comms_phone_numbers enable row level security;

do $$
begin
  if not exists (select 1 from pg_proc where proname = 'comms_current_tenant_id') then
    execute $fn$
      create function public.comms_current_tenant_id()
      returns uuid
      language sql
      stable
      as $$
        select nullif(current_setting('request.jwt.claim.tenant_id', true), '')::uuid;
      $$;
    $fn$;
  end if;
end $$;

drop policy if exists "comms_phone_numbers_select" on public.comms_phone_numbers;
create policy "comms_phone_numbers_select"
on public.comms_phone_numbers
for select
using (tenant_id = public.comms_current_tenant_id());

drop policy if exists "comms_phone_numbers_insert" on public.comms_phone_numbers;
create policy "comms_phone_numbers_insert"
on public.comms_phone_numbers
for insert
with check (tenant_id = public.comms_current_tenant_id());

drop policy if exists "comms_phone_numbers_update" on public.comms_phone_numbers;
create policy "comms_phone_numbers_update"
on public.comms_phone_numbers
for update
using (tenant_id = public.comms_current_tenant_id())
with check (tenant_id = public.comms_current_tenant_id());

commit;
