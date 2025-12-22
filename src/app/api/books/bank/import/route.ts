import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

const N8N_WEBHOOK_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL!;
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET!;

function signatureBaseForBankImport(tenantId: string, importId: string) {
  return `${tenantId}|${importId}`;
}

function hmac(base: string) {
  return crypto.createHmac("sha256", N8N_WEBHOOK_SECRET).update(base).digest("hex");
}

// TODO: implement against your tenant membership model.
async function assertTenantAccess(_tenantId: string) {
  return true;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const tenantId = String(form.get("tenant_id") ?? "");
  const file = form.get("file");

  if (!tenantId) return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

  await assertTenantAccess(tenantId);

  const importId = crypto.randomUUID();
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const base = signatureBaseForBankImport(tenantId, importId);

  // Send JSON to n8n with base64 file content.
  const res = await fetch(`${N8N_WEBHOOK_BASE_URL}/books/bank/import`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-nexcyte-signature": hmac(base),
    },
    body: JSON.stringify({
      tenant_id: tenantId,
      import_id: importId,
      filename: file.name,
      content_type: file.type || "text/csv",
      file_base64: base64,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: `n8n webhook failed: ${res.status}` }, { status: 502 });

  return NextResponse.json({ ok: true, tenant_id: tenantId, import_id: importId });
}
