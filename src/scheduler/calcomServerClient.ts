/**
 * Cal.com API v2 server-only client.
 *
 * Uses Bearer auth + cal-api-version header as per Cal.com v2 docs.
 */
export type CalcomClientConfig = {
  baseUrl: string;      // e.g. https://api.cal.com
  apiKey: string;       // Bearer token
  apiVersion: string;   // e.g. 2024-08-13
};

export class CalcomError extends Error {
  public status: number;
  public details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "CalcomError";
    this.status = status;
    this.details = details;
  }
}

export function getCalcomConfigFromEnv(): CalcomClientConfig {
  const baseUrl = process.env.CALCOM_API_BASE_URL || "https://api.cal.com";
  const apiKey = process.env.CALCOM_API_KEY || "";
  const apiVersion = process.env.CALCOM_API_VERSION || "2024-08-13";

  if (!apiKey) {
    throw new Error("Missing CALCOM_API_KEY (server-side only)");
  }
  return { baseUrl, apiKey, apiVersion };
}

type FetchJsonOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  path: string; // should start with /v2/...
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
};

export async function calcomFetchJson<T>(cfg: CalcomClientConfig, opts: FetchJsonOptions): Promise<T> {
  const url = new URL(cfg.baseUrl.replace(/\/$/, "") + opts.path);

  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers: {
      "Authorization": `Bearer ${cfg.apiKey}`,
      "cal-api-version": cfg.apiVersion,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const msg = (json?.error?.message || json?.message || `Cal.com API error (${res.status})`);
    throw new CalcomError(msg, res.status, json ?? text);
  }

  // Cal.com v2 commonly returns {status,data}
  return (json?.data ?? json) as T;
}
