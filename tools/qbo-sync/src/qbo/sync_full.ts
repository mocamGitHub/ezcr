import { mustGet, getEntitiesCsv } from './env.js';
import { getAuthState, qboGet } from './http.js';
import { getPool } from '../db/pg.js';
import { upsertQboRaw, upsertSyncState } from '../db/upsert.js';
import { toWebTxn } from './transform.js';
import { upsertWebTxn } from '../db/upsert_web.js';

/**
 * Full sync uses the QBO Query endpoint with STARTPOSITION/MAXRESULTS pagination.
 * For transactions: SELECT * FROM Invoice STARTPOSITION 1 MAXRESULTS 1000
 */
export async function syncFull(opts: { entitiesCsv?: string }) {
  const tenantId = mustGet('EZCR_TENANT_ID');
  const realmId = mustGet('QBO_REALM_ID');
  const entities = getEntitiesCsv(opts.entitiesCsv).split(',').map(s => s.trim()).filter(Boolean);

  const auth = await getAuthState();
  const pool = getPool();

  console.log(`[QBO] Full sync start: tenant=${tenantId} realm=${realmId} entities=${entities.join(',')}`);

  try {
    for (const entity of entities) {
      let start = 1;
      const max = 1000;
      while (true) {
        const q = `SELECT * FROM ${entity} STARTPOSITION ${start} MAXRESULTS ${max}`;
        const path = `/v3/company/${encodeURIComponent(realmId)}/query?query=${encodeURIComponent(q)}`;
        const json = await qboGet(path, auth);
        const block = json?.QueryResponse?.[entity] ?? [];
        const items: any[] = Array.isArray(block) ? block : (block ? [block] : []);
        console.log(`[QBO] ${entity}: fetched ${items.length} at start=${start}`);
        if (items.length === 0) break;

        for (const payload of items) {
          const id = payload?.Id?.toString?.() ?? payload?.Id;
          if (!id) continue;

          await upsertQboRaw(pool, {
            tenantId,
            realmId,
            entityType: entity,
            entityId: id,
            syncToken: payload?.SyncToken?.toString?.() ?? payload?.SyncToken ?? null,
            lastUpdatedTime: payload?.MetaData?.LastUpdatedTime ?? null,
            deleted: false,
            payload,
          });

          const web = toWebTxn(tenantId, entity, payload);
          if (web) await upsertWebTxn(pool, realmId, web);
        }

        if (items.length < max) break;
        start += max;
      }
    }

    await upsertSyncState(pool, {
      tenantId,
      realmId,
      lastFullSyncAt: new Date().toISOString(),
    });

    console.log('[QBO] Full sync complete.');
  } finally {
    await pool.end();
  }
}
