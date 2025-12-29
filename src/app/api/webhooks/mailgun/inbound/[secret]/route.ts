import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/comms/admin";
import { mustGetMailgunSignatureFromFormData, verifyMailgunWebhookSignature, isMailgunTimestampFresh } from "@/lib/comms/mailgunSignature";

/**
 * Mailgun Inbound Route Webhook (multipart/form-data)
 *
 * URL: /api/webhooks/mailgun/inbound/[secret]
 * - secret is resolved against comms_inbound_routes.route_secret to get tenant_id
 * - creates/updates contact by email
 * - creates/updates conversation (email thread)
 * - inserts comms_messages inbound
 * - stores attachments metadata (and optionally uploads to Storage bucket `comms-attachments` if available)
 *
 * Note:
 * - Mailgun forward() can post "fully parsed" multipart form fields (preferred)
 * - Mailgun signs posts with timestamp/token/signature; enable verification in production.
 */

function normalizeEmail(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function safeStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

async function getOrCreateContact(args: { tenantId: string; email: string; name?: string | null }) {
  const supabase = createSupabaseAdmin();
  const email = normalizeEmail(args.email);
  if (!email) throw new Error("Missing sender email");

  const { data: existing, error: selErr } = await supabase
    .from("comms_contacts")
    .select("id,email,display_name")
    .eq("tenant_id", args.tenantId)
    .eq("email", email)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing?.id) return existing.id as string;

  const { data: created, error: insErr } = await supabase
    .from("comms_contacts")
    .insert({
      tenant_id: args.tenantId,
      email,
      display_name: args.name ?? null,
      status: "active",
      metadata: {},
    })
    .select("id")
    .single();
  if (insErr) throw insErr;

  return created.id as string;
}

async function maybeUploadAttachment(args: {
  tenantId: string;
  messageId: string;
  filename: string;
  contentType: string;
  file: File;
}) {
  const supabase = createSupabaseAdmin();

  const bucket = "comms-attachments";
  const key = `${args.tenantId}/${args.messageId}/${Date.now()}_${args.filename}`.replace(/\s+/g, "_");

  try {
    const arrayBuffer = await args.file.arrayBuffer();
    const { error } = await supabase.storage.from(bucket).upload(key, new Uint8Array(arrayBuffer), {
      contentType: args.contentType,
      upsert: false,
    });
    if (error) return { storage_key: null as string | null, upload_error: error.message };
    return { storage_key: key, upload_error: null as string | null };
  } catch (e: any) {
    return { storage_key: null as string | null, upload_error: e?.message ?? String(e) };
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  const supabase = createSupabaseAdmin();

  // Resolve inbound route -> tenant
  const { data: route, error: routeErr } = await supabase
    .from("comms_inbound_routes")
    .select("tenant_id,provider,channel,route_secret,metadata")
    .eq("provider", "mailgun")
    .eq("route_secret", secret)
    .maybeSingle();

  if (routeErr) throw routeErr;
  if (!route?.tenant_id) return NextResponse.json({ error: "Invalid route secret" }, { status: 403 });

  const tenantId = route.tenant_id as string;

  const form = await req.formData();

  // Optional signature verification
  if (String(process.env.MAILGUN_VERIFY_WEBHOOK_SIGNATURE ?? "true").toLowerCase() === "true") {
    const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    if (!signingKey) return NextResponse.json({ error: "Missing MAILGUN_WEBHOOK_SIGNING_KEY" }, { status: 500 });

    const sig = mustGetMailgunSignatureFromFormData(form);
    if (!isMailgunTimestampFresh(sig.timestamp, Number(process.env.MAILGUN_MAX_TIMESTAMP_SKEW_SECONDS ?? 900))) {
      return NextResponse.json({ error: "Stale Mailgun webhook timestamp" }, { status: 403 });
    }
    if (!verifyMailgunWebhookSignature({ signingKey, ...sig })) {
      return NextResponse.json({ error: "Invalid Mailgun webhook signature" }, { status: 403 });
    }
  }

  // Mailgun parsed fields (best effort; depends on route action)
  const fromField = safeStr(form.get("from")) || safeStr(form.get("sender"));
  const sender = safeStr(form.get("sender")) || fromField;
  const recipient = safeStr(form.get("recipient")) || safeStr(form.get("To"));
  const subject = safeStr(form.get("subject"));
  const bodyPlain = safeStr(form.get("body-plain")) || safeStr(form.get("stripped-text")) || safeStr(form.get("body"));
  const bodyHtml = safeStr(form.get("body-html")) || safeStr(form.get("stripped-html"));
  const messageIdHeader = safeStr(form.get("Message-Id")) || safeStr(form.get("message-id"));

  const fromEmail = normalizeEmail(((sender || fromField || "").match(/<([^>]+)>/)?.[1]) ?? (sender || fromField));

  // Create/lookup contact
  const contactId = await getOrCreateContact({ tenantId, email: fromEmail, name: null });

  // Conversation: reuse latest open thread with this contact (simple)
  const { data: existingConv, error: convSelErr } = await supabase
    .from("comms_conversations")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("contact_id", contactId)
    .eq("channel", "email")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (convSelErr) throw convSelErr;

  let conversationId = existingConv?.id as string | undefined;

  if (!conversationId) {
    const { data: convCreated, error: convInsErr } = await supabase
      .from("comms_conversations")
      .insert({
        tenant_id: tenantId,
        contact_id: contactId,
        channel: "email",
        subject: subject || `Email with ${fromEmail}`,
        status: "open",
        metadata: { to: recipient, from: fromEmail, provider: "mailgun" },
      })
      .select("id")
      .single();
    if (convInsErr) throw convInsErr;
    conversationId = convCreated.id as string;
  }

  // Insert inbound message
  const { data: msg, error: msgErr } = await supabase
    .from("comms_messages")
    .insert({
      tenant_id: tenantId,
      conversation_id: conversationId,
      direction: "inbound",
      channel: "email",
      contact_id: contactId,
      status: "received",
      subject: subject ?? null,
      body_text: bodyPlain ?? null,
      body_html: bodyHtml ?? null,
      provider: "mailgun",
      provider_message_id: messageIdHeader || null,
      metadata: {
        from: fromField,
        sender,
        recipient,
        message_id: messageIdHeader || null,
      },
    })
    .select("id")
    .single();
  if (msgErr) throw msgErr;

  // Insert message event
  await supabase.from("comms_message_events").insert({
    tenant_id: tenantId,
    message_id: msg.id,
    provider: "mailgun",
    event_type: "inbound",
    payload: {
      subject,
      from: fromField,
      recipient,
      has_html: Boolean(bodyHtml),
      message_id: messageIdHeader || null,
    },
  });

  // Attachments: Mailgun names fields "attachment-1", "attachment-2", ...
  const attachmentCount = Number(safeStr(form.get("attachment-count")) || "0");
  let saved = 0;

  for (const [key, value] of form.entries()) {
    if (!key.startsWith("attachment-")) continue;
    if (!(value instanceof File)) continue;

    const file = value;
    const filename = file.name || key;
    const contentType = file.type || "application/octet-stream";
    const size = file.size ?? null;

    const upload = await maybeUploadAttachment({ tenantId, messageId: msg.id, filename, contentType, file });

    const { error: attErr } = await supabase.from("comms_message_attachments").insert({
      tenant_id: tenantId,
      message_id: msg.id,
      filename,
      content_type: contentType,
      byte_size: size,
      storage_key: upload.storage_key,
      metadata: {
        upload_error: upload.upload_error,
        source: "mailgun",
      },
    });
    if (attErr) throw attErr;
    saved++;
  }

  return NextResponse.json({ ok: true, tenantId, conversationId, messageId: msg.id, attachmentCount, saved });
}
