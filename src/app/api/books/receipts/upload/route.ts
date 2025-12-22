import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Use existing env var naming conventions from this project
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const BOOKS_BUCKET = process.env.BOOKS_STORAGE_BUCKET ?? "books";

const N8N_WEBHOOK_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL!;
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET!;

// Signature base string MUST be stable (no JSON stringify ordering issues).
function signatureBaseForReceipt(tenantId: string, docId: string) {
  return `${tenantId}|${docId}`;
}

function hmac(base: string) {
  return crypto.createHmac("sha256", N8N_WEBHOOK_SECRET).update(base).digest("hex");
}

// TODO: implement against your tenant membership model.
async function assertTenantAccess(_tenantId: string) {
  return true;
}

export async function POST(req: NextRequest) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const form = await req.formData();
  const tenantId = String(form.get("tenant_id") ?? "");
  const file = form.get("file");

  if (!tenantId) return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

  await assertTenantAccess(tenantId);

  const docId = crypto.randomUUID();
  const originalName = file.name || "receipt";
  const contentType = file.type || "application/octet-stream";
  const bytes = await file.arrayBuffer();
  const byteSize = bytes.byteLength;

  const safeName = originalName.replace(/[^\w.\-]+/g, "_");
  const storagePath = `books/${tenantId}/documents/${docId}/${safeName}`;

  // 1) Create doc row
  const { error: insErr } = await supabase.from("books_documents").insert({
    id: docId,
    tenant_id: tenantId,
    document_type: "receipt",
    sync_status: "pending",
    storage_bucket: BOOKS_BUCKET,
    storage_path: storagePath,
    original_filename: originalName,
    content_type: contentType,
    byte_size: byteSize,
  });

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // 2) Upload to Storage
  const { error: upErr } = await supabase.storage
    .from(BOOKS_BUCKET)
    .upload(storagePath, Buffer.from(bytes), {
      contentType,
      upsert: false,
    });

  if (upErr) {
    await supabase.from("books_documents").update({ sync_status: "failed" }).eq("id", docId).eq("tenant_id", tenantId);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  // 3) Kick n8n
  const base = signatureBaseForReceipt(tenantId, docId);
  const res = await fetch(`${N8N_WEBHOOK_BASE_URL}/books/receipt/process`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-nexcyte-signature": hmac(base),
    },
    body: JSON.stringify({ tenant_id: tenantId, doc_id: docId }),
  });

  if (!res.ok) {
    await supabase.from("books_documents").update({ sync_status: "failed" }).eq("id", docId).eq("tenant_id", tenantId);
    return NextResponse.json({ error: `n8n webhook failed: ${res.status}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true, tenant_id: tenantId, doc_id: docId, storage_path: storagePath });
}
