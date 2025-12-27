/**
 * Mailgun sender (placeholder).
 * Claude Code should wire this to the repo's existing Mailgun module,
 * including per-tenant from-email, domain, and message stream handling.
 */
export type MailgunConfig = {
  apiKey: string;
  domain: string;
  fromEmail: string; // per-tenant
  baseUrl?: string;  // default https://api.mailgun.net
  messageStream?: string; // optional
};

export async function sendMailgunEmail(cfg: MailgunConfig, input: {
  to: string;
  subject: string;
  text?: string | null;
  html?: string | null;
}) {
  const baseUrl = cfg.baseUrl ?? "https://api.mailgun.net";
  const url = `${baseUrl}/v3/${cfg.domain}/messages`;

  const form = new URLSearchParams();
  form.set("from", cfg.fromEmail);
  form.set("to", input.to);
  form.set("subject", input.subject);
  if (cfg.messageStream) form.set("o:message-stream", cfg.messageStream);
  if (input.text) form.set("text", input.text);
  if (input.html) form.set("html", input.html);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`api:${cfg.apiKey}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Mailgun send failed (${res.status}): ${text}`);
  }
  return text;
}
