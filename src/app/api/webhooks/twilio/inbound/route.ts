import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseAdmin } from "@/lib/comms/admin";
import { normalizeE164, resolveTenantByTwilioTo } from "@/lib/comms/phoneNumbers";

function getPublicUrlForTwilio(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}${url.pathname}${url.search}`;
}

function validateTwilioSignature(args: {
  authToken: string;
  providedSignature: string | null;
  url: string;
  params: Record<string, string>;
}): boolean {
  const { authToken, providedSignature, url, params } = args;
  if (!providedSignature) return false;

  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join("");

  const digest = crypto.createHmac("sha1", authToken).update(data, "utf8").digest("base64");

  const a = Buffer.from(digest);
  const b = Buffer.from(providedSignature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const OPTOUT_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);

export async function POST(request: Request) {
  const validate = (process.env.TWILIO_VALIDATE_SIGNATURE ?? "true").toLowerCase() === "true";
  const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
  const signature = request.headers.get("x-twilio-signature");

  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  if (validate) {
    if (!authToken) return NextResponse.json({ error: "Missing TWILIO_AUTH_TOKEN" }, { status: 500 });
    const url = getPublicUrlForTwilio(request);
    const ok = validateTwilioSignature({ authToken, providedSignature: signature, url, params });
    if (!ok) return NextResponse.json({ error: "Invalid Twilio signature" }, { status: 403 });
  }

  const to = normalizeE164(params.To);
  const from = normalizeE164(params.From);
  const body = (params.Body ?? "").toString();
  const messageSid = (params.MessageSid ?? params.SmsSid ?? "").toString();

  if (!to || !from) return NextResponse.json({ error: "Missing To/From" }, { status: 400 });

  const mapping = await resolveTenantByTwilioTo(to);
  if (!mapping) return NextResponse.json({ error: "Unmapped To number (no tenant)", to }, { status: 404 });

  const supabase = createSupabaseAdmin();
  const tenantId = mapping.tenantId;

  const upper = body.trim().toUpperCase();
  const isOptOut = OPTOUT_KEYWORDS.has(upper);

  const { data: existingContact, error: contactSelErr } = await supabase
    .from("comms_contacts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("phone_e164", from)
    .maybeSingle();
  if (contactSelErr) throw contactSelErr;

  let contactId = existingContact?.id as string | undefined;

  if (!contactId) {
    const { data: created, error: insErr } = await supabase
      .from("comms_contacts")
      .insert({ tenant_id: tenantId, phone_e164: from, display_name: from, metadata: { source: "twilio_inbound" } })
      .select("id")
      .single();
    if (insErr) throw insErr;
    contactId = created.id as string;
  }

  const { data: existingConv, error: convSelErr } = await supabase
    .from("comms_conversations")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("contact_id", contactId)
    .eq("channel", "sms")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (convSelErr) throw convSelErr;

  let conversationId = existingConv?.id as string | undefined;

  if (!conversationId) {
    const { data: convCreated, error: convInsErr } = await supabase
      .from("comms_conversations")
      .insert({ tenant_id: tenantId, contact_id: contactId, channel: "sms", subject: `SMS with ${from}`, status: "open", metadata: { to, from, provider: "twilio" } })
      .select("id")
      .single();
    if (convInsErr) throw convInsErr;
    conversationId = convCreated.id as string;
  }

  const { data: msg, error: msgErr } = await supabase
    .from("comms_messages")
    .insert({
      tenant_id: tenantId,
      conversation_id: conversationId,
      contact_id: contactId,
      direction: "inbound",
      channel: "sms",
      provider: "twilio",
      provider_message_id: messageSid || null,
      from_address: from,
      to_address: to,
      body_text: body,
      status: "received",
      received_at: new Date().toISOString(),
      metadata: { phone_number_id: mapping.phoneNumberId, raw: params, opt_out: isOptOut },
    })
    .select("id")
    .single();
  if (msgErr) throw msgErr;

  await supabase.from("comms_message_events").insert({
    tenant_id: tenantId,
    message_id: msg.id,
    provider: "twilio",
    event_type: "inbound_received",
    payload: { to, from, messageSid: messageSid || null, raw: params },
  });

  if (isOptOut) {
    await supabase
      .from("comms_channel_preferences")
      .upsert(
        { tenant_id: tenantId, contact_id: contactId, channel: "sms", consent_status: "opted_out", consent_source: "twilio_inbound_keyword", updated_at: new Date().toISOString() },
        { onConflict: "tenant_id,contact_id,channel" }
      );
  }

  return NextResponse.json({ ok: true });
}
