/**
 * Template: POST /api/internal/comms/dispatch
 *
 * Purpose:
 * - run from n8n / cron (server-to-server) to send pending outbox notifications
 * - uses service role to read/update outbox
 *
 * Security:
 * - require an internal secret header: `x-nexcyte-internal-secret`
 */

import { dispatchOutboxRow } from "../dispatchOne";

// TODO: import your Supabase service-role server client
// import { getServiceSupabase } from "@/lib/supabase/service";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: Request): Promise<Response> {
  const secret = req.headers.get("x-nexcyte-internal-secret") ?? "";
  if (!process.env.NEXCYTE_INTERNAL_DISPATCH_SECRET || secret !== process.env.NEXCYTE_INTERNAL_DISPATCH_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "25");

  // TODO: fetch pending rows using FOR UPDATE SKIP LOCKED
  // Example (pseudo):
  // const rows = await supabase.rpc("nx_outbox_dequeue", { p_limit: limit });

  const rows: any[] = []; // TODO replace

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      // TODO: mark row as 'sending'
      await dispatchOutboxRow(row);

      // TODO: mark row as 'sent', set sent_at
      sent += 1;
    } catch (e: any) {
      failed += 1;
      const msg = e?.message ?? String(e);

      // TODO: increment attempt_count, set last_error, set next_attempt_at with backoff, set status failed/dead
    }

    // small jitter to avoid provider bursts
    await sleep(50);
  }

  return Response.json({ ok: true, sent, failed }, { status: 200 });
}
