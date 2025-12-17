export type MailgunSendArgs = {
  apiKey: string;
  domain: string; // e.g. mg.example.com or your Mailgun sending domain
  from: string; // e.g. "Support <support@example.com>"
  to: string;
  subject: string;
  text?: string | null;
  html?: string | null;
  replyTo?: string | null;
  headers?: Record<string, string>;
  variables?: Record<string, string>; // Mailgun v: variables (keep non-sensitive)
  tags?: string[] | null;
};

function basicAuthHeader(apiKey: string): string {
  const token = Buffer.from(`api:${apiKey}`).toString("base64");
  return `Basic ${token}`;
}

export async function sendMailgunEmail(args: MailgunSendArgs): Promise<{ messageId?: string; raw: any }> {
  const url = `https://api.mailgun.net/v3/${encodeURIComponent(args.domain)}/messages`;

  const form = new FormData();
  form.set("from", args.from);
  form.set("to", args.to);
  form.set("subject", args.subject);

  if (args.text) form.set("text", args.text);
  if (args.html) form.set("html", args.html);

  if (args.replyTo) form.set("h:Reply-To", args.replyTo);

  // Additional headers (safe + limited)
  if (args.headers) {
    for (const [k, v] of Object.entries(args.headers)) {
      // Mailgun custom headers use the h: prefix
      form.set(`h:${k}`, v);
    }
  }

  // Tags for analytics / grouping
  if (args.tags?.length) {
    for (const t of args.tags) form.append("o:tag", t);
  }

  // Custom variables (visible in X-Mailgun-Variables header; keep small and non-sensitive)
  if (args.variables) {
    for (const [k, v] of Object.entries(args.variables)) {
      if (v == null) continue;
      form.set(`v:${k}`, String(v));
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(args.apiKey),
    },
    body: form,
  });

  const raw = await res.json().catch(async () => ({ text: await res.text() }));

  if (!res.ok) {
    const msg = typeof raw === "object" ? JSON.stringify(raw) : String(raw);
    throw new Error(`Mailgun send failed (${res.status}): ${msg}`);
  }

  // Response usually includes: { id: "<...@domain>", message: "Queued. Thank you." }
  return { messageId: raw?.id, raw };
}
