"use server";

import { createSupabaseAdmin } from "@/lib/comms/admin";
import { requireTenant } from "@/lib/comms/tenant";
import { revalidatePath } from "next/cache";

export async function listTemplates() {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("comms_templates")
    .select("id,name,channel,status,active_version_id,updated_at")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTemplate(args: { name: string; channel: "email" | "sms" }) {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("comms_templates")
    .insert({
      tenant_id: tenantId,
      name: args.name,
      channel: args.channel,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath("/comms/templates");
  return data;
}

export async function createTemplateVersion(args: {
  templateId: string;
  subject?: string;
  textBody: string;
  htmlBody?: string | null;
}) {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();

  // Determine next version number
  const { data: latest, error: lErr } = await supabase
    .from("comms_template_versions")
    .select("version_number")
    .eq("tenant_id", tenantId)
    .eq("template_id", args.templateId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lErr) throw lErr;
  const nextVersion = (latest?.version_number ?? 0) + 1;

  // Get template channel
  const { data: tpl, error: tErr } = await supabase
    .from("comms_templates")
    .select("channel")
    .eq("tenant_id", tenantId)
    .eq("id", args.templateId)
    .single();
  if (tErr) throw tErr;

  const { data, error } = await supabase
    .from("comms_template_versions")
    .insert({
      tenant_id: tenantId,
      template_id: args.templateId,
      version_number: nextVersion,
      channel: tpl.channel,
      subject: args.subject ?? null,
      text_body: args.textBody,
      html_body: args.htmlBody ?? null,
      metadata: {},
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath(`/comms/templates/${args.templateId}`);
  return data;
}

export async function publishTemplateVersion(args: { templateId: string; versionId: string }) {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from("comms_templates")
    .update({ active_version_id: args.versionId, status: "active" })
    .eq("tenant_id", tenantId)
    .eq("id", args.templateId);

  if (error) throw error;
  revalidatePath(`/comms/templates/${args.templateId}`);
}

export async function archiveTemplate(args: { templateId: string }) {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from("comms_templates")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", args.templateId);

  if (error) throw error;
  revalidatePath("/comms/templates");
}
