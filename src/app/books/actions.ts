"use server";

import { createClient } from "@supabase/supabase-js";

// Use existing env var naming conventions from this project
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function booksConfirmMatch(params: { tenant_id: string; match_id: string; clear_txn?: boolean }) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase.rpc("books_confirm_match", {
    p_tenant_id: params.tenant_id,
    p_match_id: params.match_id,
    p_clear_txn: params.clear_txn ?? true,
  });

  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function booksRejectMatch(params: { tenant_id: string; match_id: string }) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase.rpc("books_reject_match", {
    p_tenant_id: params.tenant_id,
    p_match_id: params.match_id,
  });

  if (error) throw new Error(error.message);
  return { ok: true };
}
