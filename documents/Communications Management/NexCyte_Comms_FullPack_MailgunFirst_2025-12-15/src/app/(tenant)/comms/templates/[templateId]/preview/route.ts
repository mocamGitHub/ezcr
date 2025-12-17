import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/comms/admin";
import { requireTenant } from "@/lib/comms/tenant";
import { renderTemplate } from "@/lib/comms/templating";

export async function GET(req: Request) {
  const { tenantId } = requireTenant();
  const url = new URL(req.url);
  const versionId = url.searchParams.get("versionId");
  const mode = url.searchParams.get("mode") ?? "html";
  const varsB64 = url.searchParams.get("vars") ?? "";

  if (!versionId) return NextResponse.json({ error: "Missing versionId" }, { status: 400 });

  let vars: any = {};
  if (varsB64) {
    try { vars = JSON.parse(Buffer.from(varsB64, "base64").toString("utf8")); } catch { vars = {}; }
  }

  const supabase = createSupabaseAdmin();
  const { data: tv, error } = await supabase
    .from("comms_template_versions")
    .select("id,subject,text_body,html_body,channel")
    .eq("tenant_id", tenantId)
    .eq("id", versionId)
    .single();
  if (error) throw error;

  const rendered = {
    subject: renderTemplate(tv.subject ?? "", vars),
    text: renderTemplate(tv.text_body ?? "", vars),
    html: tv.html_body ? renderTemplate(tv.html_body ?? "", vars) : null,
  };

  if (mode === "text") {
    return new NextResponse(rendered.text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const html = rendered.html ?? `<pre style="white-space:pre-wrap">${escapeHtml(rendered.text)}</pre>`;
  const doc = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;margin:16px}</style></head><body>${html}</body></html>`;
  return new NextResponse(doc, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function escapeHtml(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
