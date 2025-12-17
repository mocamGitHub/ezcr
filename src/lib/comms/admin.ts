import { createClient } from "@supabase/supabase-js";

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function createSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Missing env var: SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(
    mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"),
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
