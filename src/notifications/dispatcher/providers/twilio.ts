/**
 * Twilio SMS sender (placeholder).
 * Claude Code should wire to existing Twilio module if present.
 */
export type TwilioConfig = {
  accountSid: string;
  authToken: string;
  fromNumber: string; // per-tenant if you support it
};

export async function sendTwilioSms(cfg: TwilioConfig, input: { to: string; body: string }) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Messages.json`;
  const form = new URLSearchParams();
  form.set("From", cfg.fromNumber);
  form.set("To", input.to);
  form.set("Body", input.body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Twilio send failed (${res.status}): ${text}`);
  }
  return text;
}
