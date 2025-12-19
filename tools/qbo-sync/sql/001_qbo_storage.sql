-- QBO raw storage + derived "website transactions" tables
-- Safe to run multiple times (uses IF NOT EXISTS)

create table if not exists qbo_sync_state (
  tenant_id uuid not null,
  realm_id text not null,
  last_cdc_time timestamptz,
  last_full_sync_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, realm_id)
);

create table if not exists qbo_entity_raw (
  tenant_id uuid not null,
  realm_id text not null,
  entity_type text not null,
  entity_id text not null,
  sync_token text,
  last_updated_time timestamptz,
  deleted boolean not null default false,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  primary key (tenant_id, realm_id, entity_type, entity_id)
);

create index if not exists idx_qbo_entity_raw_updated
  on qbo_entity_raw (tenant_id, realm_id, entity_type, last_updated_time desc);

-- Derived / normalized (for website use)
create table if not exists web_transactions (
  tenant_id uuid not null,
  source text not null default 'qbo',
  qbo_entity_type text not null,
  qbo_entity_id text not null,
  txn_date date,
  doc_number text,
  customer_ref text,
  customer_name text,
  total_amount numeric(14,2),
  currency text,
  status text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, source, qbo_entity_type, qbo_entity_id)
);

create table if not exists web_transaction_lines (
  tenant_id uuid not null,
  source text not null default 'qbo',
  qbo_entity_type text not null,
  qbo_entity_id text not null,
  line_num int not null,
  item_ref text,
  item_name text,
  description text,
  quantity numeric(14,4),
  unit_price numeric(14,4),
  line_amount numeric(14,2),
  payload jsonb not null,
  primary key (tenant_id, source, qbo_entity_type, qbo_entity_id, line_num)
);

create index if not exists idx_web_transactions_date
  on web_transactions (tenant_id, txn_date desc);
