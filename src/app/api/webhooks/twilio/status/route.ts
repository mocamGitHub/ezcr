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

  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const digest = crypto.createHmac("sha1", authToken).update(data, "utf8").digest("base64");

  const a = Buffer.from(digest);
  const b = Buffer.from(providedSignature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function mapTwilioStatus(s: string): string {
  switch ((s || "").toLowerCase()) {
    case "accepted":
    case "queued":
    case "sending":
      return "queued";
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "undelivered":
    case "failed":
      return "failed";
    default:
      return "sent";
  }
}

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

  const messageSid = (params.MessageSid ?? params.SmsSid ?? "").toString();
  const messageStatus = (params.MessageStatus ?? params.SmsStatus ?? "").toString();
  const to = normalizeE164(params.To);
  const from = normalizeE164(params.From);
  const errorCode = params.ErrorCode ? Number(params.ErrorCode) : null;
  const errorMessage = params.ErrorMessage ? String(params.ErrorMessage) : null;

  if (!messageSid) return NextResponse.json({ error: "Missing MessageSid" }, { status: 400 });
  if (!to) return NextResponse.json({ error: "Missing To" }, { status: 400 });

  const mapping = await resolveTenantByTwilioTo(to);
  if (!mapping) return NextResponse.json({ error: "Unmapped To number (no tenant)", to }, { status: 404 });

  const supabase = createSupabaseAdmin();
  const tenantId = mapping.tenantId;

  const { data: msg, error: msgSelErr } = await supabase
    .from("comms_messages")
    .select("id,status")
    .eq("tenant_id", tenantId)
    .eq("provider", "twilio")
    .eq("provider_message_id", messageSid)
    .maybeSingle();
  if (msgSelErr) throw msgSelErr;

  if (!msg?.id) return NextResponse.json({ ok: true, note: "Message not found; ignored", messageSid });

  const mapped = mapTwilioStatus(messageStatus);

  const patch: Record<string, any> = { status: mapped, provider_status: messageStatus || null };
  if (mapped === "sent") patch.sent_at = new Date().toISOString();
  if (mapped === "delivered") patch.delivered_at = new Date().toISOString();
  if (mapped === "failed") patch.failed_at = new Date().toISOString();

  const { error: updErr } = await supabase.from("comms_messages").update(patch).eq("id", msg.id);
  if (updErr) throw updErr;

  const { error: evErr } = await supabase.from("comms_message_events").insert({
    tenant_id: tenantId,
    message_id: msg.id,
    provider: "twilio",
    event_type: "status_callback",
    payload: { messageSid, messageStatus, mappedStatus: mapped, to, from, errorCode, errorMessage, raw: params },
  });
  if (evErr) throw evErr;

  return NextResponse.json({ ok: true });
}
