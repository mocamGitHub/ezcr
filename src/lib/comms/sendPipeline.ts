import { createSupabaseAdmin } from "@/lib/comms/admin";
import { normalizeE164, resolveTenantTwilioFrom } from "@/lib/comms/phoneNumbers";
import { evaluateCommsPolicy } from "@/lib/comms/policy";
import { renderTemplate } from "@/lib/comms/templating";
import { sendMailgunEmail } from "@/lib/comms/providers/mailgun";
import { sendTwilioSms } from "@/lib/comms/providers/twilio";
import crypto from "crypto";

export type SendRequest = {
  tenantId: string;
  contactId: string;
  channel: "email" | "sms";
  templateVersionId: string;
  variables: Record<string, any>;
  conversationId?: string | null;
  idempotencyKey?: string | null;
};

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function makeDedupeKey(args: SendRequest): string {
  return `${args.channel}:${args.templateVersionId}:${args.contactId}`;
}

function cryptoRandomBase64Url(bytes: number): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

async function getOrCreateConversation(args: {
  tenantId: string;
  contactId: string;
  channel: "email" | "sms";
  subjectHint?: string | null;
}) {
  const supabase = createSupabaseAdmin();

  const { data: existing, error } = await supabase
    .from("comms_conversations")
    .select("id")
    .eq("tenant_id", args.tenantId)
    .eq("contact_id", args.contactId)
    .eq("channel", args.channel)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (existing?.id) return existing.id as string;

  const { data: created, error: insErr } = await supabase
    .from("comms_conversations")
    .insert({
      tenant_id: args.tenantId,
      contact_id: args.contactId,
      channel: args.channel,
      subject: args.subjectHint ?? (args.channel === "email" ? "Email Conversation" : "SMS Conversation"),
      status: "open",
      metadata: {},
    })
    .select("id")
    .single();

  if (insErr) throw insErr;
  return created.id as string;
}

export async function queueAndSendNow(req: SendRequest) {
  const supabase = createSupabaseAdmin();

  const { data: contact, error: cErr } = await supabase
    .from("comms_contacts")
    .select("id,email,phone_e164,display_name,metadata")
    .eq("tenant_id", req.tenantId)
    .eq("id", req.contactId)
    .single();
  if (cErr) throw cErr;

  const { data: tv, error: tvErr } = await supabase
    .from("comms_template_versions")
    .select("id,template_id,subject,text_body,html_body,channel,metadata,version_number")
    .eq("tenant_id", req.tenantId)
    .eq("id", req.templateVersionId)
    .single();
  if (tvErr) throw tvErr;

  const channel = (tv.channel ?? req.channel) as "email" | "sms";
  if (channel !== req.channel) throw new Error("Template channel does not match requested channel.");

  const dedupeKey = makeDedupeKey(req);

  const decision = await evaluateCommsPolicy({
    tenantId: req.tenantId,
    contactId: req.contactId,
    channel,
    dedupeKey,
  });

  // Ensure conversation exists (for threading)
  const conversationId = req.conversationId ?? (await getOrCreateConversation({
    tenantId: req.tenantId,
    contactId: req.contactId,
    channel,
    subjectHint: channel === "email" ? (tv.subject ?? null) : null,
  }));

  if (!decision.allowed) {
    const { data: suppressed, error: supErr } = await supabase
      .from("comms_messages")
      .insert({
        tenant_id: req.tenantId,
        conversation_id: conversationId,
        contact_id: req.contactId,
        direction: "outbound",
        channel,
        provider: channel === "email" ? "mailgun" : "twilio",
        status: "failed",
        text_body: "",
        html_body: null,
        subject: null,
        to_address: channel === "email" ? (contact.email ?? "") : (contact.phone_e164 ?? ""),
        metadata: { dedupe_key: dedupeKey, policy_block: decision, variables: req.variables, idempotency_key: req.idempotencyKey ?? null },
      })
      .select("id")
      .single();
    if (supErr) throw supErr;

    await supabase.from("comms_message_events").insert({
      tenant_id: req.tenantId,
      message_id: suppressed.id,
      provider: channel === "email" ? "mailgun" : "twilio",
      event_type: "policy_blocked",
      metadata: decision,
    });

    return { ok: false as const, blocked: decision, messageId: suppressed.id };
  }

  const vars = {
    tenant: { id: req.tenantId },
    contact: { id: contact.id, email: contact.email, phone_e164: contact.phone_e164, display_name: contact.display_name, ...((contact.metadata ?? {}) as any) },
    ...req.variables,
  };

  const subject = channel === "email" ? renderTemplate(tv.subject ?? "", vars) : null;
  const text = renderTemplate(tv.text_body ?? "", vars);
  const html = tv.html_body ? renderTemplate(tv.html_body ?? "", vars) : null;

  const toEmail = (contact.email ?? "").trim();
  const toPhone = normalizeE164(contact.phone_e164 ?? "");

  // Idempotency
  if (req.idempotencyKey) {
    const { data: existing } = await supabase
      .from("comms_messages")
      .select("id,status")
      .eq("tenant_id", req.tenantId)
      .eq("contact_id", req.contactId)
      .eq("direction", "outbound")
      .contains("metadata", { idempotency_key: req.idempotencyKey })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) return { ok: true as const, messageId: existing.id, idempotent: true as const };
  }

  const { data: msg, error: msgErr } = await supabase
    .from("comms_messages")
    .insert({
      tenant_id: req.tenantId,
      conversation_id: conversationId,
      contact_id: req.contactId,
      direction: "outbound",
      channel,
      provider: channel === "email" ? "mailgun" : "twilio",
      status: "queued",
      subject,
      text_body: text,
      html_body: html,
      from_address: channel === "email" ? process.env.MAILGUN_FROM_EMAIL ?? null : null,
      to_address: channel === "email" ? toEmail : toPhone,
      metadata: { dedupe_key: dedupeKey, template_version_id: tv.id, template_id: tv.template_id, variables: req.variables, idempotency_key: req.idempotencyKey ?? null },
    })
    .select("id")
    .single();
  if (msgErr) throw msgErr;

  await supabase.from("comms_message_events").insert({
    tenant_id: req.tenantId,
    message_id: msg.id,
    provider: channel === "email" ? "mailgun" : "twilio",
    event_type: "queued",
    metadata: { templateVersionId: tv.id, dedupeKey },
  });

  try {
    if (channel === "email") {
      if (!toEmail) throw new Error("Contact has no email address.");

      const apiKey = mustGetEnv("MAILGUN_API_KEY");
      const domain = mustGetEnv("MAILGUN_DOMAIN");
      const fromEmail = mustGetEnv("MAILGUN_FROM_EMAIL");
      const fromName = process.env.MAILGUN_FROM_NAME ?? null;

      // Keep Mailgun variables minimal and non-sensitive:
      // - nc_message_id is enough for correlation
      // - optional nc_token provides extra safety against spoofed events
      const includeToken = String(process.env.MAILGUN_INCLUDE_NC_TOKEN ?? "false").toLowerCase() === "true";

      let ncToken: string | null = null;
      if (includeToken) {
        ncToken = cryptoRandomBase64Url(24);
        // persist token so webhook can validate
        // First fetch current metadata, then merge
        const { data: currentMsg } = await supabase
          .from("comms_messages")
          .select("metadata")
          .eq("id", msg.id)
          .single();
        await supabase
          .from("comms_messages")
          .update({ metadata: { ...((currentMsg?.metadata as Record<string, unknown>) ?? {}), nc_token: ncToken } })
          .eq("tenant_id", req.tenantId)
          .eq("id", msg.id);
      }

      const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

      const { messageId } = await sendMailgunEmail({
        apiKey,
        domain,
        from,
        to: toEmail,
        subject: subject ?? "",
        text,
        html,
        replyTo: fromEmail,
        variables: {
          nc_message_id: msg.id,
          ...(ncToken ? { nc_token: ncToken } : {}),
        },
        tags: tv.metadata?.tags ?? null,
      });

      await supabase
        .from("comms_messages")
        .update({
          status: "sent",
          provider_message_id: messageId ?? null,
          sent_at: new Date().toISOString(),
        })
        .eq("tenant_id", req.tenantId)
        .eq("id", msg.id);

      await supabase.from("comms_message_events").insert({
        tenant_id: req.tenantId,
        message_id: msg.id,
        provider: "mailgun",
        event_type: "sent",
        metadata: { mailgun_id: messageId ?? null },
      });

      return { ok: true as const, messageId: msg.id };
    }

if (channel === "sms") {
      if (!toPhone) throw new Error("Contact has no phone number.");
      const accountSid = mustGetEnv("TWILIO_ACCOUNT_SID");
      const authToken = mustGetEnv("TWILIO_AUTH_TOKEN");
      const from = await resolveTenantTwilioFrom(req.tenantId);
      if (!from) throw new Error("No Twilio From number resolved for tenant.");
      const statusCallbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL ?? "";

      const { sid } = await sendTwilioSms({
        accountSid,
        authToken,
        from,
        to: toPhone,
        body: text,
        statusCallbackUrl: statusCallbackUrl || undefined,
      });

      await supabase.from("comms_messages").update({
        status: "sent",
        provider_message_id: sid,
        sent_at: new Date().toISOString(),
        from_address: from,
      }).eq("id", msg.id);

      await supabase.from("comms_message_events").insert({
        tenant_id: req.tenantId,
        message_id: msg.id,
        provider: "twilio",
        event_type: "sent",
        metadata: { sid },
      });

      return { ok: true as const, messageId: msg.id };
    }

    throw new Error("Unsupported channel");
  } catch (err: any) {
    await supabase.from("comms_messages").update({
      status: "failed",
      failed_at: new Date().toISOString(),
      metadata: { error: err?.message ?? String(err) },
    }).eq("id", msg.id);

    await supabase.from("comms_message_events").insert({
      tenant_id: req.tenantId,
      message_id: msg.id,
      provider: channel === "email" ? "mailgun" : "twilio",
      event_type: "failed",
      metadata: { message: err?.message ?? String(err) },
    });

    return { ok: false as const, messageId: msg.id, error: err?.message ?? String(err) };
  }
}
