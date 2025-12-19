export function mustGet(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function get(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

export function getMinorVersion(): string {
  return process.env.QBO_MINOR_VERSION ?? '75';
}

export function getEntitiesCsv(override?: string): string {
  return (override ?? process.env.QBO_SYNC_ENTITY_LIST ?? 'Invoice,SalesReceipt,Payment,RefundReceipt,CreditMemo').trim();
}
