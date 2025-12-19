import { mustGet, getEntitiesCsv } from './env.js';
import { getAuthState, qboGet } from './http.js';
import { getPool } from '../db/pg.js';
import { upsertQboRaw, upsertSyncState } from '../db/upsert.js';
import { toWebTxn } from './transform.js';
import { upsertWebTxn } from '../db/upsert_web.js';

/**
 * CDC sync pulls changes since a timestamp.
 * The CDC API returns full payloads for entities changed within a look-back window.
 * If your dataset is large, you may need to call CDC in smaller time slices.
 */
export async function syncCdc(opts: { sinceIso?: string; entitiesCsv?: string }) {
  const tenantId = mustGet('EZCR_TENANT_ID');
  const realmId = mustGet('QBO_REALM_ID');
  const entities = getEntitiesCsv(opts.entitiesCsv).split(',').map(s => s.trim()).filter(Boolean);

  const auth = await getAuthState();
  const pool = getPool();

  // Default: last_cdc_time from DB, else 7 days lookback
  const defaultSince = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  let since = opts.sinceIso ?? defaultSince;

  // read state
  const stateRes = await pool.query(
    `select last_cdc_time from qbo_sync_state where tenant_id=$1 and realm_id=$2`,
    [tenantId, realmId]
  );
  if (!opts.sinceIso && (stateRes.rowCount ?? 0) > 0 && stateRes.rows[0].last_cdc_time) {
    since = new Date(stateRes.rows[0].last_cdc_time).toISOString();
  }

  console.log(`[QBO] CDC sync start: tenant=${tenantId} realm=${realmId} since=${since} entities=${entities.join(',')}`);

  try {
    const entParam = entities.join(',');
    const path = `/v3/company/${encodeURIComponent(realmId)}/cdc?entities=${encodeURIComponent(entParam)}&changedSince=${encodeURIComponent(since)}`;
    const json = await qboGet(path, auth);

    const cdc = json?.CDCResponse ?? {};
    for (const entity of entities) {
      const block = cdc?.[entity] ?? [];
      const items: any[] = Array.isArray(block) ? block : (block ? [block] : []);
      console.log(`[QBO] CDC ${entity}: ${items.length} changed`);

      for (const payload of items) {
        const id = payload?.Id?.toString?.() ?? payload?.Id;
        if (!id) continue;

        // Heuristic deleted detection (CDC marks deletions with a status in some cases)
        const status = payload?.status ?? payload?.Status ?? payload?.MetaData?.status ?? null;
        const isDeleted = (typeof status === 'string' && status.toUpperCase() === 'DELETED') ? true : false;

        await upsertQboRaw(pool, {
          tenantId,
          realmId,
          entityType: entity,
          entityId: id,
          syncToken: payload?.SyncToken?.toString?.() ?? payload?.SyncToken ?? null,
          lastUpdatedTime: payload?.MetaData?.LastUpdatedTime ?? null,
          deleted: isDeleted,
          payload,
        });

        const web = toWebTxn(tenantId, entity, payload);
        if (web) await upsertWebTxn(pool, realmId, web);
      }
    }

    const nowIso = new Date().toISOString();
    await upsertSyncState(pool, {
      tenantId,
      realmId,
      lastCdcTime: nowIso,
    });

    console.log('[QBO] CDC sync complete.');
  } finally {
    await pool.end();
  }
}
