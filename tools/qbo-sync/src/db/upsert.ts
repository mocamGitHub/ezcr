import { Pool } from 'pg';

export async function upsertQboRaw(pool: Pool, row: {
  tenantId: string;
  realmId: string;
  entityType: string;
  entityId: string;
  syncToken?: string | null;
  lastUpdatedTime?: string | null;
  deleted: boolean;
  payload: any;
}) {
  const q = `
    insert into qbo_entity_raw
      (tenant_id, realm_id, entity_type, entity_id, sync_token, last_updated_time, deleted, payload, fetched_at)
    values
      ($1,$2,$3,$4,$5,$6,$7,$8, now())
    on conflict (tenant_id, realm_id, entity_type, entity_id)
    do update set
      sync_token = excluded.sync_token,
      last_updated_time = excluded.last_updated_time,
      deleted = excluded.deleted,
      payload = excluded.payload,
      fetched_at = now()
  `;
  const vals = [
    row.tenantId,
    row.realmId,
    row.entityType,
    row.entityId,
    row.syncToken ?? null,
    row.lastUpdatedTime ? new Date(row.lastUpdatedTime) : null,
    row.deleted,
    JSON.stringify(row.payload),
  ];
  await pool.query(q, vals);
}

export async function upsertSyncState(pool: Pool, row: {
  tenantId: string;
  realmId: string;
  lastCdcTime?: string | null;
  lastFullSyncAt?: string | null;
}) {
  const q = `
    insert into qbo_sync_state
      (tenant_id, realm_id, last_cdc_time, last_full_sync_at, updated_at)
    values
      ($1,$2,$3,$4, now())
    on conflict (tenant_id, realm_id)
    do update set
      last_cdc_time = coalesce(excluded.last_cdc_time, qbo_sync_state.last_cdc_time),
      last_full_sync_at = coalesce(excluded.last_full_sync_at, qbo_sync_state.last_full_sync_at),
      updated_at = now()
  `;
  await pool.query(q, [
    row.tenantId,
    row.realmId,
    row.lastCdcTime ? new Date(row.lastCdcTime) : null,
    row.lastFullSyncAt ? new Date(row.lastFullSyncAt) : null,
  ]);
}
