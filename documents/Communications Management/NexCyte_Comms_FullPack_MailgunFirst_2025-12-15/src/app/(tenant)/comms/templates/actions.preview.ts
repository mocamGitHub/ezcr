"use server";

import { requireTenant } from "@/lib/comms/tenant";
import { createSupabaseAdmin } from "@/lib/comms/admin";
import { extractPlaceholders } from "@/lib/comms/templating";

export async function getTemplatePreviewMeta(args: { templateId: string }) {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();

  const { data: tpl, error: tplErr } = await supabase
    .from("comms_templates")
    .select("id,active_version_id")
    .eq("tenant_id", tenantId)
    .eq("id", args.templateId)
    .single();
  if (tplErr) throw tplErr;

  let versionId = tpl.active_version_id as string | null;

  if (!versionId) {
    const { data: v } = await supabase
      .from("comms_template_versions")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("template_id", args.templateId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    versionId = (v?.id as string) ?? null;
  }

  if (!versionId) return { versionId: null, placeholders: [] as string[] };

  const { data: tv, error: tvErr } = await supabase
    .from("comms_template_versions")
    .select("subject,text_body,html_body,channel")
    .eq("tenant_id", tenantId)
    .eq("id", versionId)
    .single();
  if (tvErr) throw tvErr;

  const placeholders = [
    ...extractPlaceholders(tv.subject ?? ""),
    ...extractPlaceholders(tv.text_body ?? ""),
    ...extractPlaceholders(tv.html_body ?? ""),
  ];

  return { versionId, placeholders: Array.from(new Set(placeholders)).sort(), channel: tv.channel };
}
