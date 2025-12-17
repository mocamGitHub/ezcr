"use server";

import { createSupabaseAdmin } from "@/lib/comms/admin";
import { requireTenant } from "@/lib/comms/tenant";
import { revalidatePath } from "next/cache";

export async function listSequences() {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("comms_sequences")
    .select("id,name,status,updated_at")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listTemplateVersionsForBuilder() {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("comms_template_versions")
    .select("id,template_id,version_number,channel")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  return (data ?? []).map((v: any) => ({
    id: v.id,
    label: `v${v.version_number} • ${v.template_id.slice(0, 8)} (${v.channel})`,
    channel: v.channel,
  }));
}

export async function createSequence(args: {
  name: string;
  status?: string;
  steps: Array<{ delayMinutes: number; templateVersionId: string }>;
}) {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();

  const { data: seq, error: sErr } = await supabase
    .from("comms_sequences")
    .insert({ tenant_id: tenantId, name: args.name, status: args.status ?? "draft" })
    .select("id")
    .single();
  if (sErr) throw sErr;

  const stepRows = args.steps.map((s, idx) => ({
    tenant_id: tenantId,
    sequence_id: seq.id,
    step_index: idx,
    delay_minutes: s.delayMinutes,
    template_version_id: s.templateVersionId,
    status: "active",
  }));

  if (stepRows.length) {
    const { error: stErr } = await supabase.from("comms_sequence_steps").insert(stepRows);
    if (stErr) throw stErr;
  }

  revalidatePath("/comms/sequences");
  return seq;
}
