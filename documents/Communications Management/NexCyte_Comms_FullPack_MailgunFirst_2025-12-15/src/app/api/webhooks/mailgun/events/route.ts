import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/comms/admin";
import { mustGetMailgunSignatureFromJson, verifyMailgunWebhookSignature, isMailgunTimestampFresh } from "@/lib/comms/mailgunSignature";

/**
 * Mailgun Events Webhook
 * Receives application/json payload containing:
 * - signature: { timestamp, token, signature }
 * - event-data: { event, id, timestamp, message, recipient, user-variables, ... }
 *
 * We correlate using user-variables.nc_message_id (kept non-sensitive and small).
 *
 * Optional signature validation (recommended in production):
 * - MAILGUN_VERIFY_WEBHOOK_SIGNATURE=true
 * - MAILGUN_WEBHOOK_SIGNING_KEY=...
 */

function mapMailgunEventToStatus(evt: string): string | null {
  switch ((evt || "").toLowerCase()) {
    case "accepted":
      return "sent";
    case "delivered":
      return "delivered";
    case "failed":
    case "rejected":
    case "bounced":
    case "complained":
      return "failed";
    default:
      return null;
  }
}

function getUserVars(eventData: any): Record<string, any> | null {
  return (
    eventData?.["user-variables"] ??
    eventData?.["user_variables"] ??
    eventData?.["userVariables"] ??
    eventData?.["user_vars"] ??
    null
  );
}

export async function POST(req: Request) {
  const raw = await req.text();

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Optional signature verification
  if (String(process.env.MAILGUN_VERIFY_WEBHOOK_SIGNATURE ?? "true").toLowerCase() === "true") {
    const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    if (!signingKey) return NextResponse.json({ error: "Missing MAILGUN_WEBHOOK_SIGNING_KEY" }, { status: 500 });

    const sig = mustGetMailgunSignatureFromJson(body);
    if (!isMailgunTimestampFresh(sig.timestamp, Number(process.env.MAILGUN_MAX_TIMESTAMP_SKEW_SECONDS ?? 900))) {
      return NextResponse.json({ error: "Stale Mailgun webhook timestamp" }, { status: 403 });
    }
    if (!verifyMailgunWebhookSignature({ signingKey, ...sig })) {
      return NextResponse.json({ error: "Invalid Mailgun webhook signature" }, { status: 403 });
    }
  }

  const eventData = body?.["event-data"] ?? body?.event_data ?? body?.eventData;
  if (!eventData) return NextResponse.json({ ok: true, processed: 0 });

  const evt = String(eventData.event ?? "");
  const uv = getUserVars(eventData) ?? {};
  const ncMessageId = String(uv.nc_message_id ?? "");

  if (!ncMessageId) {
    // Nothing to correlate; accept to avoid retries.
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const supabase = createSupabaseAdmin();

  // Fetch message to resolve tenant_id and optional nc_token
  const { data: msg, error: msgErr } = await supabase
    .from("comms_messages")
    .select("id,tenant_id,metadata")
    .eq("id", ncMessageId)
    .maybeSingle();

  if (msgErr) throw msgErr;
  if (!msg?.id) return NextResponse.json({ ok: true, processed: 0 });

  const tenantId = msg.tenant_id as string;

  // Optional token check (only if stored)
  const expectedToken = (msg.metadata as any)?.nc_token ?? null;
  const gotToken = uv.nc_token ?? null;
  if (expectedToken && gotToken && String(expectedToken) !== String(gotToken)) {
    return NextResponse.json({ error: "Invalid nc_token" }, { status: 403 });
  }

  // Insert event row
  await supabase.from("comms_message_events").insert({
    tenant_id: tenantId,
    message_id: msg.id,
    provider: "mailgun",
    event_type: evt || "unknown",
    payload: eventData,
  });

  // Patch message status if relevant
  const mapped = mapMailgunEventToStatus(evt);
  if (mapped) {
    const patch: Record<string, any> = { status: mapped, provider_status: evt };
    if (mapped === "delivered") patch.delivered_at = new Date().toISOString();
    if (mapped === "sent") patch.sent_at = new Date().toISOString();
    if (mapped === "failed") patch.failed_at = new Date().toISOString();

    // capture Mailgun message-id if available
    const mgMessageId =
      eventData?.message?.headers?.["message-id"] ??
      eventData?.message?.headers?.["Message-Id"] ??
      eventData?.message?.headers?.message_id ??
      eventData?.id ??
      null;

    if (mgMessageId) patch.provider_message_id = mgMessageId;

    const { error: updErr } = await supabase
      .from("comms_messages")
      .update(patch)
      .eq("tenant_id", tenantId)
      .eq("id", msg.id);

    if (updErr) throw updErr;
  }

  // Unsubscribe/complaint handling -> channel prefs best-effort
  if (evt === "unsubscribed" || evt === "complained") {
    const email = String(eventData?.recipient ?? eventData?.["recipient"] ?? "");
    if (email) {
      const { data: contact } = await supabase
        .from("comms_contacts")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (contact?.id) {
        await supabase
          .from("comms_channel_preferences")
          .upsert(
            {
              tenant_id: tenantId,
              contact_id: contact.id,
              channel: "email",
              consent_status: "opted_out",
              consent_source: "mailgun_webhook",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "tenant_id,contact_id,channel" }
          );
      }
    }
  }

  return NextResponse.json({ ok: true, processed: 1 });
}
