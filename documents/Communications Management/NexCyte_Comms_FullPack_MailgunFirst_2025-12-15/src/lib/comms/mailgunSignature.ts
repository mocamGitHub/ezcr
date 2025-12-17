import crypto from "crypto";

export function verifyMailgunWebhookSignature(args: {
  signingKey: string;
  timestamp: string;
  token: string;
  signature: string;
}): boolean {
  const value = `${args.timestamp}${args.token}`;
  const hmac = crypto.createHmac("sha256", args.signingKey).update(value).digest("hex");
  // constant-time compare
  const a = Buffer.from(hmac);
  const b = Buffer.from(args.signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function mustGetMailgunSignatureFromJson(body: any): { timestamp: string; token: string; signature: string } {
  const sig = body?.signature ?? body?.["signature"];
  const timestamp = String(sig?.timestamp ?? body?.timestamp ?? "");
  const token = String(sig?.token ?? body?.token ?? "");
  const signature = String(sig?.signature ?? body?.signature ?? "");
  if (!timestamp || !token || !signature) throw new Error("Missing Mailgun webhook signature fields.");
  return { timestamp, token, signature };
}

export function mustGetMailgunSignatureFromFormData(fd: FormData): { timestamp: string; token: string; signature: string } {
  const timestamp = String(fd.get("timestamp") ?? "");
  const token = String(fd.get("token") ?? "");
  const signature = String(fd.get("signature") ?? "");
  if (!timestamp || !token || !signature) throw new Error("Missing Mailgun webhook signature fields.");
  return { timestamp, token, signature };
}

export function isMailgunTimestampFresh(timestampSeconds: string, maxSkewSeconds = 900): boolean {
  const ts = Number(timestampSeconds);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - ts) <= maxSkewSeconds;
}
