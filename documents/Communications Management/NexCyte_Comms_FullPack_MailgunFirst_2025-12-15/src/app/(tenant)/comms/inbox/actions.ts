"use server";

import { createSupabaseAdmin } from "@/lib/comms/admin";
import { requireTenant } from "@/lib/comms/tenant";
import { sendCommsMessageAction } from "@/app/(tenant)/comms/actions/sendMessage";

export async function listConversations() {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("comms_conversations")
    .select("id,channel,subject,status,updated_at,contact_id")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function getConversationThread(conversationId: string) {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();

  const { data: conv, error: convErr } = await supabase
    .from("comms_conversations")
    .select("id,channel,subject,status,contact_id")
    .eq("tenant_id", tenantId)
    .eq("id", conversationId)
    .single();
  if (convErr) throw convErr;

  const { data: msgs, error: msgErr } = await supabase
    .from("comms_messages")
    .select("id,created_at,direction,channel,provider,status,subject,body_text,body_html,from_address,to_address,provider_message_id")
    .eq("tenant_id", tenantId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (msgErr) throw msgErr;

  return { conversation: conv, messages: msgs ?? [] };
}

export async function listTemplateVersionsForChannel(channel: "email" | "sms") {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("comms_template_versions")
    .select("id,template_id,version_number,channel")
    .eq("tenant_id", tenantId)
    .eq("channel", channel)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data ?? []).map((v: any) => ({
    id: v.id,
    label: `v${v.version_number} • ${v.template_id.slice(0, 8)}`,
  }));
}

export async function sendReply(args: {
  conversationId: string;
  contactId: string;
  channel: "email" | "sms";
  templateVersionId: string;
  variables: any;
}) {
  return sendCommsMessageAction({
    contactId: args.contactId,
    channel: args.channel,
    templateVersionId: args.templateVersionId,
    variables: args.variables,
    conversationId: args.conversationId,
    idempotencyKey: `reply:${args.conversationId}:${args.templateVersionId}:${Date.now()}`,
  });
}
