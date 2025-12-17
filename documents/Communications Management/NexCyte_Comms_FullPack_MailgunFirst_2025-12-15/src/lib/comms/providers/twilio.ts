export type TwilioSendArgs = {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
  statusCallbackUrl?: string;
};

export async function sendTwilioSms(args: TwilioSendArgs): Promise<{ sid: string; raw: any }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(args.accountSid)}/Messages.json`;

  const form = new URLSearchParams();
  form.set("From", args.from);
  form.set("To", args.to);
  form.set("Body", args.body);
  if (args.statusCallbackUrl) form.set("StatusCallback", args.statusCallbackUrl);

  const auth = Buffer.from(`${args.accountSid}:${args.authToken}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = raw?.message || raw?.detail || `Twilio send failed (${res.status})`;
    throw new Error(msg);
  }

  return { sid: raw.sid as string, raw };
}
