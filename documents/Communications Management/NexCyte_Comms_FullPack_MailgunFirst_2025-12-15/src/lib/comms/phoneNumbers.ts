import { createSupabaseAdmin } from "@/lib/comms/admin";

export function normalizeE164(input: string | null | undefined): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/[()\s.-]/g, "");
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

export async function resolveTenantByTwilioTo(toRaw: string) {
  const supabase = createSupabaseAdmin();
  const to = normalizeE164(toRaw);

  const { data, error } = await supabase
    .from("comms_phone_numbers")
    .select("tenant_id,id,phone_number")
    .eq("provider", "twilio")
    .eq("phone_number", to)
    .is("archived_at", null)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data?.tenant_id) return null;

  return { tenantId: data.tenant_id as string, phoneNumberId: data.id as string, toE164: data.phone_number as string };
}

export async function resolveTenantTwilioFrom(tenantId: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("comms_phone_numbers")
    .select("phone_number")
    .eq("tenant_id", tenantId)
    .eq("provider", "twilio")
    .is("archived_at", null)
    .eq("is_active", true)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.phone_number as string) || process.env.TWILIO_DEFAULT_FROM || "";
}
