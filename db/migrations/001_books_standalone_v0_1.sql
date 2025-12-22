-- NexCyte Books (Standalone-only) v0.1
-- Multi-tenant optional module for receipt + bank txn matching and reconciliation
-- IMPORTANT: Adjust tenant claim extraction in public.nexcyte_tenant_id() to match your auth/JWT strategy.

begin;

create extension if not exists pgcrypto;

-- =========================================================
-- 1) Helper: updated_at trigger
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- 2) Tenant helper (RLS)
-- =========================================================
create or replace function public.nexcyte_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'tenant_id','')::uuid;
$$;

-- =========================================================
-- 3) Enums
-- =========================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'books_document_type') then
    create type public.books_document_type as enum ('receipt','invoice','bank_statement','other');
  end if;
  if not exists (select 1 from pg_type where typname = 'books_match_status') then
    create type public.books_match_status as enum ('suggested','auto_linked','confirmed','rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'books_sync_status') then
    create type public.books_sync_status as enum ('pending','processing','succeeded','failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'books_bank_source') then
    create type public.books_bank_source as enum ('csv','ofx','manual','statement_extraction');
  end if;
end$$;

-- =========================================================
-- 4) Tables
-- =========================================================

-- Tenant settings + feature flag + thresholds
create table if not exists public.books_settings (
  tenant_id uuid primary key,
  enabled boolean not null default false,

  auto_link_threshold numeric not null default 0.90, -- score >= this attempts auto-link
  amount_tolerance numeric not null default 1.00,    -- absolute currency tolerance (e.g., $1.00)
  date_window_days int not null default 7,           -- +/- days around receipt date
  min_receipt_confidence numeric not null default 0.60,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_books_settings_updated_at
before update on public.books_settings
for each row execute function public.set_updated_at();


-- Uploaded docs (receipt/statement/etc.)
create table if not exists public.books_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,

  document_type public.books_document_type not null default 'receipt',
  sync_status public.books_sync_status not null default 'pending',

  storage_bucket text not null,
  storage_path text not null,
  original_filename text,
  content_type text,
  byte_size bigint,

  -- Raw extraction payload (provider-specific)
  extracted_json jsonb,
  -- Normalized stable shape (MUST KEEP STABLE)
  extracted_fields jsonb,

  -- Indexed columns for matching/filters
  vendor_guess text,
  vendor_norm text,
  total_amount numeric,
  currency text,
  document_date date,
  confidence_overall numeric,

  -- Simple flags array (optional), also present in extracted_fields.notes.flags
  flags text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_books_documents_tenant on public.books_documents(tenant_id);
create index if not exists idx_books_documents_tenant_date on public.books_documents(tenant_id, document_date);
create index if not exists idx_books_documents_tenant_amount on public.books_documents(tenant_id, total_amount);
create index if not exists idx_books_documents_tenant_vendor_norm on public.books_documents(tenant_id, vendor_norm);

create trigger trg_books_documents_updated_at
before update on public.books_documents
for each row execute function public.set_updated_at();


-- Bank transactions (normalized)
create table if not exists public.books_bank_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,

  source public.books_bank_source not null default 'csv',

  posted_at date not null,
  amount numeric not null,
  currency text not null default 'USD',

  merchant text,
  merchant_norm text,
  description text,
  external_id text,

  txn_hash text not null, -- idempotent hash unique per tenant

  cleared boolean not null default false,
  cleared_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_books_bank_transactions_tenant_hash
  on public.books_bank_transactions(tenant_id, txn_hash);

create index if not exists idx_books_bank_transactions_tenant_posted
  on public.books_bank_transactions(tenant_id, posted_at);

create index if not exists idx_books_bank_transactions_tenant_amount
  on public.books_bank_transactions(tenant_id, amount);

create index if not exists idx_books_bank_transactions_tenant_merchant_norm
  on public.books_bank_transactions(tenant_id, merchant_norm);

create trigger trg_books_bank_transactions_updated_at
before update on public.books_bank_transactions
for each row execute function public.set_updated_at();


-- Match suggestions + decisions
create table if not exists public.books_matches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,

  document_id uuid not null references public.books_documents(id) on delete cascade,
  bank_transaction_id uuid not null references public.books_bank_transactions(id) on delete cascade,

  status public.books_match_status not null default 'suggested',
  score numeric not null default 0,
  reasons jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- prevent duplicate doc<->txn rows across all statuses (simplifies updates)
create unique index if not exists uq_books_matches_doc_txn
  on public.books_matches(tenant_id, document_id, bank_transaction_id);

-- Only one "active" (confirmed/auto_linked) per document
create unique index if not exists uq_books_matches_one_active_per_doc
  on public.books_matches(tenant_id, document_id)
  where status in ('confirmed','auto_linked');

-- Only one "active" (confirmed/auto_linked) per transaction
create unique index if not exists uq_books_matches_one_active_per_txn
  on public.books_matches(tenant_id, bank_transaction_id)
  where status in ('confirmed','auto_linked');

create index if not exists idx_books_matches_tenant_doc
  on public.books_matches(tenant_id, document_id);

create index if not exists idx_books_matches_tenant_txn
  on public.books_matches(tenant_id, bank_transaction_id);

create trigger trg_books_matches_updated_at
before update on public.books_matches
for each row execute function public.set_updated_at();


-- Reconciliation sessions
create table if not exists public.books_reconciliations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,

  period_start date not null,
  period_end date not null,
  statement_balance numeric,
  currency text not null default 'USD',

  notes text,
  closed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_books_reconciliations_tenant_period
  on public.books_reconciliations(tenant_id, period_start, period_end);

create trigger trg_books_reconciliations_updated_at
before update on public.books_reconciliations
for each row execute function public.set_updated_at();


-- Connector slot tables (unused now; reserved for later QBO or other connectors)
create table if not exists public.books_external_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,

  provider text not null,          -- e.g. "qbo"
  external_tenant_id text,
  status text not null default 'disconnected',
  config jsonb,                    -- encrypted/managed at app layer

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_books_external_connections_tenant
  on public.books_external_connections(tenant_id);

create trigger trg_books_external_connections_updated_at
before update on public.books_external_connections
for each row execute function public.set_updated_at();


create table if not exists public.books_outbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,

  connection_id uuid references public.books_external_connections(id) on delete set null,

  entity_type text not null,     -- "document" | "transaction" | "match" | ...
  entity_id uuid not null,
  action text not null,          -- "upsert" | "delete" | ...
  payload jsonb not null,

  status text not null default 'pending',
  attempts int not null default 0,
  last_error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_books_outbox_tenant_status
  on public.books_outbox(tenant_id, status);

create trigger trg_books_outbox_updated_at
before update on public.books_outbox
for each row execute function public.set_updated_at();


-- =========================================================
-- 5) Normalization + txn hash
-- =========================================================
create or replace function public.books_norm_text(p_text text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      regexp_replace(lower(trim(coalesce(p_text,''))), '[^a-z0-9\s]+', ' ', 'g'),
      '\s+', ' ', 'g'
    ),
    ''
  );
$$;

create or replace function public.books_txn_hash(
  p_tenant_id uuid,
  p_posted_at date,
  p_amount numeric,
  p_currency text,
  p_merchant_norm text,
  p_external_id text
) returns text
language sql
immutable
as $$
  select encode(
    digest(
      concat_ws(
        '|',
        p_tenant_id::text,
        p_posted_at::text,
        p_amount::text,
        coalesce(p_currency,''),
        coalesce(p_merchant_norm,''),
        coalesce(p_external_id,'')
      ),
      'sha256'
    ),
    'hex'
  );
$$;

-- =========================================================
-- 6) RPCs (atomic operations)
-- =========================================================

-- Inserts/updates a match.
-- If p_try_auto_link is true, attempts to set status=auto_linked only if:
--   - neither doc nor txn has an existing confirmed/auto_linked match (guard)
-- Otherwise inserts/updates as suggested.
create or replace function public.books_apply_match_decision(
  p_tenant_id uuid,
  p_document_id uuid,
  p_bank_transaction_id uuid,
  p_score numeric,
  p_reasons jsonb,
  p_try_auto_link boolean
) returns public.books_match_status
language plpgsql
as $$
declare
  v_status public.books_match_status;
  v_doc_has_active boolean;
  v_txn_has_active boolean;
  v_existing_status public.books_match_status;
begin
  select status into v_existing_status
  from public.books_matches
  where tenant_id = p_tenant_id
    and document_id = p_document_id
    and bank_transaction_id = p_bank_transaction_id;

  if v_existing_status in ('confirmed','auto_linked') then
    return v_existing_status;
  end if;

  select exists(
    select 1 from public.books_matches
    where tenant_id = p_tenant_id
      and document_id = p_document_id
      and status in ('confirmed','auto_linked')
  ) into v_doc_has_active;

  select exists(
    select 1 from public.books_matches
    where tenant_id = p_tenant_id
      and bank_transaction_id = p_bank_transaction_id
      and status in ('confirmed','auto_linked')
  ) into v_txn_has_active;

  if p_try_auto_link and (not v_doc_has_active) and (not v_txn_has_active) then
    v_status := 'auto_linked';
  else
    v_status := 'suggested';
  end if;

  insert into public.books_matches (
    tenant_id, document_id, bank_transaction_id, status, score, reasons
  ) values (
    p_tenant_id, p_document_id, p_bank_transaction_id, v_status, coalesce(p_score,0), p_reasons
  )
  on conflict (tenant_id, document_id, bank_transaction_id) do update
    set score = excluded.score,
        reasons = excluded.reasons,
        status = excluded.status,
        updated_at = now();

  return v_status;
end;
$$;

-- Confirm a chosen match:
--  - sets status=confirmed for p_match_id
--  - rejects other suggestions for same document
--  - optionally marks the txn cleared
create or replace function public.books_confirm_match(
  p_tenant_id uuid,
  p_match_id uuid,
  p_clear_txn boolean default true
) returns void
language plpgsql
as $$
declare
  v_doc_id uuid;
  v_txn_id uuid;
  v_conflict_doc boolean;
  v_conflict_txn boolean;
begin
  select document_id, bank_transaction_id
    into v_doc_id, v_txn_id
  from public.books_matches
  where tenant_id = p_tenant_id
    and id = p_match_id;

  if v_doc_id is null or v_txn_id is null then
    raise exception 'Match not found';
  end if;

  -- guard: doc already has another active match
  select exists(
    select 1 from public.books_matches
    where tenant_id = p_tenant_id
      and document_id = v_doc_id
      and status in ('confirmed','auto_linked')
      and id <> p_match_id
  ) into v_conflict_doc;

  if v_conflict_doc then
    raise exception 'Document already has an active match';
  end if;

  -- guard: txn already has another active match
  select exists(
    select 1 from public.books_matches
    where tenant_id = p_tenant_id
      and bank_transaction_id = v_txn_id
      and status in ('confirmed','auto_linked')
      and id <> p_match_id
  ) into v_conflict_txn;

  if v_conflict_txn then
    raise exception 'Transaction already has an active match';
  end if;

  -- set selected match to confirmed
  update public.books_matches
     set status = 'confirmed',
         updated_at = now()
   where tenant_id = p_tenant_id
     and id = p_match_id;

  -- reject other suggestions for this document
  update public.books_matches
     set status = 'rejected',
         updated_at = now()
   where tenant_id = p_tenant_id
     and document_id = v_doc_id
     and id <> p_match_id
     and status = 'suggested';

  if p_clear_txn then
    update public.books_bank_transactions
       set cleared = true,
           cleared_at = now(),
           updated_at = now()
     where tenant_id = p_tenant_id
       and id = v_txn_id;
  end if;
end;
$$;

-- Simple reject (UI action)
create or replace function public.books_reject_match(
  p_tenant_id uuid,
  p_match_id uuid
) returns void
language plpgsql
as $$
begin
  update public.books_matches
     set status = 'rejected',
         updated_at = now()
   where tenant_id = p_tenant_id
     and id = p_match_id;
end;
$$;

-- =========================================================
-- 7) Views (dashboards / queues)
-- =========================================================

-- Rank suggested matches per document
create or replace view public.books_receipt_top_suggestions as
select
  m.tenant_id,
  m.document_id,
  m.id as match_id,
  m.bank_transaction_id,
  m.score,
  m.reasons,
  row_number() over (
    partition by m.tenant_id, m.document_id
    order by m.score desc nulls last, m.created_at desc
  ) as rnk
from public.books_matches m
where m.status = 'suggested';

-- Basic review queue (one row per receipt)
create or replace view public.books_receipt_review_queue as
with matched_docs as (
  select
    tenant_id,
    document_id,
    bool_or(status in ('confirmed','auto_linked')) as is_matched
  from public.books_matches
  group by tenant_id, document_id
)
select
  d.tenant_id,
  d.id as document_id,
  d.created_at,
  d.updated_at,
  d.document_type,
  d.vendor_guess,
  d.vendor_norm,
  d.total_amount,
  d.currency,
  d.document_date,
  d.confidence_overall,
  coalesce(md.is_matched,false) as is_matched,
  (
    select count(*)
    from public.books_matches m2
    where m2.tenant_id = d.tenant_id
      and m2.document_id = d.id
      and m2.status='suggested'
  ) as suggested_count
from public.books_documents d
left join matched_docs md
  on md.tenant_id = d.tenant_id
 and md.document_id = d.id
where d.document_type='receipt';

-- Single-query view: documents + top-3 suggestions as JSON (for UI)
create or replace view public.books_receipt_review_queue_with_suggestions_v1 as
with matched_docs as (
  select
    m.tenant_id,
    m.document_id,
    bool_or(m.status in ('confirmed','auto_linked')) as is_matched
  from public.books_matches m
  group by m.tenant_id, m.document_id
),
suggestions_ranked as (
  select
    m.tenant_id,
    m.document_id,
    m.id as match_id,
    m.bank_transaction_id,
    m.status,
    m.score,
    m.reasons,
    m.created_at,
    row_number() over (
      partition by m.tenant_id, m.document_id
      order by m.score desc nulls last, m.created_at desc
    ) as rnk
  from public.books_matches m
  where m.status = 'suggested'
)
select
  d.tenant_id,
  d.id as document_id,
  d.created_at,
  d.updated_at,
  d.document_type,
  d.vendor_guess,
  d.total_amount,
  d.currency,
  d.document_date,
  d.confidence_overall,
  coalesce(md.is_matched,false) as is_matched,
  (
    select count(*)
    from public.books_matches m2
    where m2.tenant_id = d.tenant_id
      and m2.document_id = d.id
      and m2.status='suggested'
  ) as suggested_count,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'match_id', sr.match_id,
          'bank_transaction_id', sr.bank_transaction_id,
          'status', sr.status,
          'score', sr.score,
          'reasons', sr.reasons,
          'txn', jsonb_build_object(
            'posted_at', t.posted_at,
            'amount', t.amount,
            'currency', t.currency,
            'merchant', t.merchant,
            'merchant_norm', t.merchant_norm,
            'description', t.description,
            'external_id', t.external_id,
            'cleared', t.cleared
          )
        )
        order by sr.rnk
      )
      from suggestions_ranked sr
      join public.books_bank_transactions t
        on t.tenant_id = sr.tenant_id
       and t.id = sr.bank_transaction_id
      where sr.tenant_id = d.tenant_id
        and sr.document_id = d.id
        and sr.rnk <= 3
    ),
    '[]'::jsonb
  ) as top_suggestions
from public.books_documents d
left join matched_docs md
  on md.tenant_id = d.tenant_id
 and md.document_id = d.id
where d.document_type='receipt';

-- Exceptions queue (missing vendor/date/total or low confidence)
create or replace view public.books_receipt_exceptions_queue as
select
  d.*
from public.books_documents d
where d.document_type='receipt'
  and (
    d.vendor_guess is null
    or d.document_date is null
    or d.total_amount is null
    or d.confidence_overall is null
    or d.confidence_overall < 0.60
    or (d.flags is not null and array_length(d.flags,1) > 0)
  );

-- KPI summary (per-tenant counts)
create or replace view public.books_kpi_summary as
with doc_counts as (
  select
    tenant_id,
    count(*) filter (where document_type='receipt') as receipts_total,
    count(*) filter (where document_type='receipt' and id in (
      select document_id from public.books_matches where status in ('confirmed','auto_linked')
    )) as receipts_matched,
    count(*) filter (where document_type='receipt' and id not in (
      select document_id from public.books_matches where status in ('confirmed','auto_linked')
    )) as receipts_unmatched,
    count(*) filter (where document_type='receipt' and id not in (
      select document_id from public.books_matches where status in ('confirmed','auto_linked')
    ) and id in (
      select document_id from public.books_matches where status='suggested'
    )) as receipts_unmatched_with_suggestions,
    count(*) filter (where document_type='receipt' and (
      vendor_guess is null or document_date is null or total_amount is null or confidence_overall is null or confidence_overall < 0.60
    )) as receipts_exceptions
  from public.books_documents
  group by tenant_id
),
txn_counts as (
  select
    tenant_id,
    count(*) as bank_txns_total,
    count(*) filter (where cleared) as bank_txns_cleared,
    count(*) filter (where not cleared) as bank_txns_uncleared
  from public.books_bank_transactions
  group by tenant_id
),
match_counts as (
  select
    tenant_id,
    count(*) filter (where status='suggested') as matches_suggested,
    count(*) filter (where status='auto_linked') as matches_auto_linked,
    count(*) filter (where status='confirmed') as matches_confirmed,
    count(*) filter (where status='rejected') as matches_rejected
  from public.books_matches
  group by tenant_id
)
select
  coalesce(dc.tenant_id, tc.tenant_id, mc.tenant_id) as tenant_id,
  coalesce(receipts_total,0) as receipts_total,
  coalesce(receipts_matched,0) as receipts_matched,
  coalesce(receipts_unmatched,0) as receipts_unmatched,
  coalesce(receipts_unmatched_with_suggestions,0) as receipts_unmatched_with_suggestions,
  coalesce(receipts_exceptions,0) as receipts_exceptions,
  coalesce(bank_txns_total,0) as bank_txns_total,
  coalesce(bank_txns_cleared,0) as bank_txns_cleared,
  coalesce(bank_txns_uncleared,0) as bank_txns_uncleared,
  coalesce(matches_suggested,0) as matches_suggested,
  coalesce(matches_auto_linked,0) as matches_auto_linked,
  coalesce(matches_confirmed,0) as matches_confirmed,
  coalesce(matches_rejected,0) as matches_rejected
from doc_counts dc
full join txn_counts tc on tc.tenant_id = dc.tenant_id
full join match_counts mc on mc.tenant_id = coalesce(dc.tenant_id, tc.tenant_id);

-- =========================================================
-- 8) RLS (tenant isolation)
-- =========================================================
alter table public.books_settings enable row level security;
alter table public.books_documents enable row level security;
alter table public.books_bank_transactions enable row level security;
alter table public.books_matches enable row level security;
alter table public.books_reconciliations enable row level security;
alter table public.books_external_connections enable row level security;
alter table public.books_outbox enable row level security;

-- Settings
drop policy if exists books_settings_select on public.books_settings;
create policy books_settings_select on public.books_settings
for select using (tenant_id = public.nexcyte_tenant_id());

drop policy if exists books_settings_mutate on public.books_settings;
create policy books_settings_mutate on public.books_settings
for all using (tenant_id = public.nexcyte_tenant_id())
with check (tenant_id = public.nexcyte_tenant_id());

-- Documents
drop policy if exists books_documents_select on public.books_documents;
create policy books_documents_select on public.books_documents
for select using (tenant_id = public.nexcyte_tenant_id());

drop policy if exists books_documents_mutate on public.books_documents;
create policy books_documents_mutate on public.books_documents
for all using (tenant_id = public.nexcyte_tenant_id())
with check (tenant_id = public.nexcyte_tenant_id());

-- Bank txns
drop policy if exists books_bank_transactions_select on public.books_bank_transactions;
create policy books_bank_transactions_select on public.books_bank_transactions
for select using (tenant_id = public.nexcyte_tenant_id());

drop policy if exists books_bank_transactions_mutate on public.books_bank_transactions;
create policy books_bank_transactions_mutate on public.books_bank_transactions
for all using (tenant_id = public.nexcyte_tenant_id())
with check (tenant_id = public.nexcyte_tenant_id());

-- Matches
drop policy if exists books_matches_select on public.books_matches;
create policy books_matches_select on public.books_matches
for select using (tenant_id = public.nexcyte_tenant_id());

drop policy if exists books_matches_mutate on public.books_matches;
create policy books_matches_mutate on public.books_matches
for all using (tenant_id = public.nexcyte_tenant_id())
with check (tenant_id = public.nexcyte_tenant_id());

-- Reconciliations
drop policy if exists books_reconciliations_select on public.books_reconciliations;
create policy books_reconciliations_select on public.books_reconciliations
for select using (tenant_id = public.nexcyte_tenant_id());

drop policy if exists books_reconciliations_mutate on public.books_reconciliations;
create policy books_reconciliations_mutate on public.books_reconciliations
for all using (tenant_id = public.nexcyte_tenant_id())
with check (tenant_id = public.nexcyte_tenant_id());

-- Connector slot tables
drop policy if exists books_external_connections_select on public.books_external_connections;
create policy books_external_connections_select on public.books_external_connections
for select using (tenant_id = public.nexcyte_tenant_id());

drop policy if exists books_external_connections_mutate on public.books_external_connections;
create policy books_external_connections_mutate on public.books_external_connections
for all using (tenant_id = public.nexcyte_tenant_id())
with check (tenant_id = public.nexcyte_tenant_id());

drop policy if exists books_outbox_select on public.books_outbox;
create policy books_outbox_select on public.books_outbox
for select using (tenant_id = public.nexcyte_tenant_id());

drop policy if exists books_outbox_mutate on public.books_outbox;
create policy books_outbox_mutate on public.books_outbox
for all using (tenant_id = public.nexcyte_tenant_id())
with check (tenant_id = public.nexcyte_tenant_id());

commit;
