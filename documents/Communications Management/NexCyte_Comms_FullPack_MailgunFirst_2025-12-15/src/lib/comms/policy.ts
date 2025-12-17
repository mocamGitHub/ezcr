import { createSupabaseAdmin } from "@/lib/comms/admin";

export type Channel = "email" | "sms";

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; reason: string; code: "OPTED_OUT" | "QUIET_HOURS" | "CAP_EXCEEDED" | "DEDUPED" };

type TenantSettings = {
  timezone?: string;
  quiet_hours?: { enabled?: boolean; start?: string; end?: string };
  caps?: { per_contact_per_day?: number; per_contact_per_hour?: number; dedupe_minutes?: number };
};

function parseHHMM(s: string): { h: number; m: number } | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!m) return null;
  return { h: Number(m[1]), m: Number(m[2]) };
}

function nowInTz(timezone: string): Date {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = fmt.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const yyyy = get("year");
  const mm = get("month");
  const dd = get("day");
  const hh = get("hour");
  const mi = get("minute");
  const ss = get("second");
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}Z`);
}

function minutesSinceMidnight(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function isWithinQuietHours(nowMin: number, startMin: number, endMin: number): boolean {
  if (startMin === endMin) return false;
  if (startMin < endMin) return nowMin >= startMin && nowMin < endMin;
  return nowMin >= startMin || nowMin < endMin;
}

export async function evaluateCommsPolicy(args: {
  tenantId: string;
  contactId: string;
  channel: Channel;
  dedupeKey?: string | null;
}): Promise<PolicyDecision> {
  const supabase = createSupabaseAdmin();

  // Consent
  const { data: pref, error: prefErr } = await supabase
    .from("comms_channel_preferences")
    .select("consent_status")
    .eq("tenant_id", args.tenantId)
    .eq("contact_id", args.contactId)
    .eq("channel", args.channel)
    .maybeSingle();

  if (prefErr) throw prefErr;
  if ((pref?.consent_status ?? "").toLowerCase() === "opted_out") {
    return { allowed: false, code: "OPTED_OUT", reason: "Contact opted out for this channel." };
  }

  // Tenant settings
  const { data: settingsRow, error: setErr } = await supabase
    .from("comms_tenant_settings")
    .select("settings_json")
    .eq("tenant_id", args.tenantId)
    .maybeSingle();

  if (setErr) throw setErr;

  const settings: TenantSettings = (settingsRow?.settings_json ?? {}) as any;
  const tz = settings.timezone || "America/New_York";

  // Quiet hours
  const q = settings.quiet_hours;
  if (q?.enabled && q.start && q.end) {
    const s = parseHHMM(q.start);
    const e = parseHHMM(q.end);
    if (s && e) {
      const now = nowInTz(tz);
      const nowMin = minutesSinceMidnight(now);
      const startMin = s.h * 60 + s.m;
      const endMin = e.h * 60 + e.m;
      if (isWithinQuietHours(nowMin, startMin, endMin)) {
        return { allowed: false, code: "QUIET_HOURS", reason: `Quiet hours active (${q.start}-${q.end} ${tz}).` };
      }
    }
  }

  // Caps + dedupe settings
  const caps = settings.caps ?? {};
  const perDay = caps.per_contact_per_day ?? 6;
  const perHour = caps.per_contact_per_hour ?? 2;
  const dedupeMinutes = caps.dedupe_minutes ?? 30;

  // per-hour
  {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("comms_messages")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", args.tenantId)
      .eq("contact_id", args.contactId)
      .eq("channel", args.channel)
      .eq("direction", "outbound")
      .gte("created_at", since)
      .in("status", ["queued", "sent", "delivered"]);
    if (error) throw error;
    if ((count ?? 0) >= perHour) return { allowed: false, code: "CAP_EXCEEDED", reason: "Hourly cap exceeded." };
  }

  // per-day
  {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("comms_messages")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", args.tenantId)
      .eq("contact_id", args.contactId)
      .eq("channel", args.channel)
      .eq("direction", "outbound")
      .gte("created_at", since)
      .in("status", ["queued", "sent", "delivered"]);
    if (error) throw error;
    if ((count ?? 0) >= perDay) return { allowed: false, code: "CAP_EXCEEDED", reason: "Daily cap exceeded." };
  }

  // Dedupe (same dedupeKey within window)
  if (args.dedupeKey) {
    const since = new Date(Date.now() - dedupeMinutes * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("comms_messages")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", args.tenantId)
      .eq("contact_id", args.contactId)
      .eq("channel", args.channel)
      .eq("direction", "outbound")
      .gte("created_at", since)
      .contains("metadata", { dedupe_key: args.dedupeKey });
    if (error) throw error;
    if ((count ?? 0) > 0) return { allowed: false, code: "DEDUPED", reason: "Duplicate send suppressed." };
  }

  return { allowed: true };
}
