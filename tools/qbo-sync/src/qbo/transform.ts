/**
 * Minimal transforms for "website transactions".
 * We store the full raw payload regardless; these transforms are convenience rollups.
 */
export type WebTxn = {
  tenantId: string;
  entityType: string;
  entityId: string;
  txnDate?: string | null;
  docNumber?: string | null;
  customerRef?: string | null;
  customerName?: string | null;
  totalAmount?: number | null;
  currency?: string | null;
  status?: string | null;
  payload: any;
  lines: Array<{
    lineNum: number;
    itemRef?: string | null;
    itemName?: string | null;
    description?: string | null;
    quantity?: number | null;
    unitPrice?: number | null;
    lineAmount?: number | null;
    payload: any;
  }>;
};

function num(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

export function toWebTxn(tenantId: string, entityType: string, payload: any): WebTxn | null {
  const id = payload?.Id?.toString?.() ?? payload?.Id ?? null;
  if (!id) return null;

  const txnDate = payload?.TxnDate ?? null;
  const docNumber = payload?.DocNumber ?? null;

  const custRef = payload?.CustomerRef?.value ?? null;
  const custName = payload?.CustomerRef?.name ?? null;

  const total = payload?.TotalAmt ?? payload?.TotalAmt?.value ?? payload?.TotalAmt ?? null;
  const currency = payload?.CurrencyRef?.value ?? null;

  // Some entities have different status fields; keep it simple
  const status =
    payload?.PrivateNote?.includes?.('VOID') ? 'VOID' :
    payload?.TxnStatus ?? payload?.status ?? null;

  const lineArr: any[] = Array.isArray(payload?.Line) ? payload.Line : [];
  const lines = lineArr.map((ln, idx) => {
    const detail = ln?.SalesItemLineDetail ?? ln?.ItemBasedExpenseLineDetail ?? ln?.AccountBasedExpenseLineDetail ?? {};
    const itemRef = detail?.ItemRef?.value ?? null;
    const itemName = detail?.ItemRef?.name ?? null;
    const qty = num(detail?.Qty ?? detail?.Quantity);
    const unitPrice = num(detail?.UnitPrice);
    const amount = num(ln?.Amount);
    return {
      lineNum: idx + 1,
      itemRef,
      itemName,
      description: ln?.Description ?? null,
      quantity: qty,
      unitPrice,
      lineAmount: amount,
      payload: ln,
    };
  });

  return {
    tenantId,
    entityType,
    entityId: id,
    txnDate,
    docNumber,
    customerRef: custRef,
    customerName: custName,
    totalAmount: num(total),
    currency,
    status,
    payload,
    lines,
  };
}
