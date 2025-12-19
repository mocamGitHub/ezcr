import { Pool } from 'pg';
import { WebTxn } from '../qbo/transform.js';

export async function upsertWebTxn(pool: Pool, realmId: string, txn: WebTxn) {
  const q = `
    insert into web_transactions
      (tenant_id, source, qbo_entity_type, qbo_entity_id, txn_date, doc_number, customer_ref, customer_name, total_amount, currency, status, payload, updated_at)
    values
      ($1,'qbo',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
    on conflict (tenant_id, source, qbo_entity_type, qbo_entity_id)
    do update set
      txn_date = excluded.txn_date,
      doc_number = excluded.doc_number,
      customer_ref = excluded.customer_ref,
      customer_name = excluded.customer_name,
      total_amount = excluded.total_amount,
      currency = excluded.currency,
      status = excluded.status,
      payload = excluded.payload,
      updated_at = now()
  `;
  await pool.query(q, [
    txn.tenantId,
    txn.entityType,
    txn.entityId,
    txn.txnDate ? new Date(txn.txnDate) : null,
    txn.docNumber ?? null,
    txn.customerRef ?? null,
    txn.customerName ?? null,
    txn.totalAmount,
    txn.currency ?? null,
    txn.status ?? null,
    JSON.stringify(txn.payload),
  ]);

  // Replace lines for idempotency
  await pool.query(
    `delete from web_transaction_lines where tenant_id=$1 and source='qbo' and qbo_entity_type=$2 and qbo_entity_id=$3`,
    [txn.tenantId, txn.entityType, txn.entityId]
  );

  const ins = `
    insert into web_transaction_lines
      (tenant_id, source, qbo_entity_type, qbo_entity_id, line_num, item_ref, item_name, description, quantity, unit_price, line_amount, payload)
    values
      ($1,'qbo',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
  `;
  for (const ln of txn.lines) {
    await pool.query(ins, [
      txn.tenantId,
      txn.entityType,
      txn.entityId,
      ln.lineNum,
      ln.itemRef ?? null,
      ln.itemName ?? null,
      ln.description ?? null,
      ln.quantity,
      ln.unitPrice,
      ln.lineAmount,
      JSON.stringify(ln.payload),
    ]);
  }
}
