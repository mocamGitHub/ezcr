import type { OutboxRow } from "./types";
import { renderTemplate } from "./render";
import { sendMailgunEmail } from "./providers/mailgun";
import { sendTwilioSms } from "./providers/twilio";

/**
 * Dispatch a single outbox row using provider config resolved per tenant.
 * Claude Code should replace `resolveTenantCommsConfig` with existing comms config system.
 */
async function resolveTenantCommsConfig(tenantId: string) {
  // TODO: replace with Supabase lookup or existing config source
  return {
    mailgun: {
      apiKey: process.env.MAILGUN_API_KEY || "",
      domain: process.env.MAILGUN_DOMAIN || "",
      fromEmail: process.env.MAILGUN_FROM_EMAIL || "no-reply@example.com",
      messageStream: process.env.MAILGUN_MESSAGE_STREAM || undefined,
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || "",
      authToken: process.env.TWILIO_AUTH_TOKEN || "",
      fromNumber: process.env.TWILIO_FROM_NUMBER || "",
    },
  };
}

export async function dispatchOutboxRow(row: OutboxRow) {
  const cfg = await resolveTenantCommsConfig(row.tenant_id);

  const data = {
    ...row.payload,
    start_at: row.payload?.start_at ?? null,
    tenant_id: row.tenant_id,
  };

  // Basic template defaults (if DB templates are not used)
  const subject = row.subject ?? `Notification: ${row.event_key}`;
  const text = row.body_text ?? renderTemplate("Event {{event_key}} for {{start_at}}", { event_key: row.event_key, start_at: data.start_at }) ?? "";
  const html = row.body_html ?? null;

  if (row.channel === "email") {
    await sendMailgunEmail(cfg.mailgun, {
      to: row.to_address,
      subject,
      text,
      html,
    });
    return;
  }

  if (row.channel === "sms") {
    await sendTwilioSms(cfg.twilio, {
      to: row.to_address,
      body: text,
    });
    return;
  }

  // in_app: integrate with your UI notifications store
  return;
}
