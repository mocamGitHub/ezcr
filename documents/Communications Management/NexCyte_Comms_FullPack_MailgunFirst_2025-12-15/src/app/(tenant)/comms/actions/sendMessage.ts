"use server";

import { requireTenant } from "@/lib/comms/tenant";
import { queueAndSendNow } from "@/lib/comms/sendPipeline";

export async function sendCommsMessageAction(args: {
  contactId: string;
  channel: "email" | "sms";
  templateVersionId: string;
  variables: Record<string, any>;
  conversationId?: string | null;
  idempotencyKey?: string | null;
}) {
  const { tenantId } = requireTenant();
  return queueAndSendNow({
    tenantId,
    contactId: args.contactId,
    channel: args.channel,
    templateVersionId: args.templateVersionId,
    variables: args.variables,
    conversationId: args.conversationId ?? null,
    idempotencyKey: args.idempotencyKey ?? null,
  });
}
