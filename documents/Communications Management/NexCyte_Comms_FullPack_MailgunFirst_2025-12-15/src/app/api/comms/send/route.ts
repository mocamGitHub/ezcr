import { NextResponse } from "next/server";
import { queueAndSendNow } from "@/lib/comms/sendPipeline";

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/**
 * POST /api/comms/send
 * Body: { tenantId, contactId, channel, templateVersionId, variables, conversationId?, idempotencyKey? }
 * Secured via header: x-nc-internal-key == NC_INTERNAL_API_KEY
 */
export async function POST(req: Request) {
  const internalKey = req.headers.get("x-nc-internal-key") ?? "";
  const expected = mustGetEnv("NC_INTERNAL_API_KEY");
  if (!internalKey || internalKey !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { tenantId, contactId, channel, templateVersionId, variables = {}, conversationId = null, idempotencyKey = null } = body;
  if (!tenantId || !contactId || !channel || !templateVersionId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const result = await queueAndSendNow({ tenantId, contactId, channel, templateVersionId, variables, conversationId, idempotencyKey });
  return NextResponse.json(result);
}
