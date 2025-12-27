"use client";

import React, { useEffect, useMemo, useState } from "react";

type Channel = "email" | "sms" | "in_app";
type EventKey = "booking_created" | "booking_cancelled" | "booking_rescheduled";

type TemplateRow = {
  event_key: EventKey;
  channel: Channel;
  subject_template: string | null;
  body_text_template: string | null;
  body_html_template: string | null;
  is_enabled: boolean;
};

const EVENTS: EventKey[] = ["booking_created","booking_cancelled","booking_rescheduled"];
const CHANNELS: Channel[] = ["email","sms"];

export function SchedulerTemplatesClient({ tenantSlug }: { tenantSlug: string }) {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [rows, setRows] = useState<Record<string, TemplateRow>>({});

  const keyOf = (e: EventKey, c: Channel) => `${e}:${c}`;

  function ensureDefaults() {
    const next: Record<string, TemplateRow> = {};
    for (const e of EVENTS) {
      for (const c of CHANNELS) {
        next[keyOf(e,c)] = {
          event_key: e,
          channel: c,
          subject_template: c === "email" ? defaultSubject(e) : null,
          body_text_template: defaultText(e),
          body_html_template: null,
          is_enabled: true,
        };
      }
    }
    setRows(next);
  }

  function defaultSubject(e: EventKey) {
    if (e === "booking_created") return "Appointment scheduled";
    if (e === "booking_cancelled") return "Appointment cancelled";
    return "Appointment rescheduled";
  }

  function defaultText(e: EventKey) {
    if (e === "booking_created") return "Your appointment is scheduled for {{start_at}}.";
    if (e === "booking_cancelled") return "Your appointment has been cancelled.";
    return "Your appointment has been rescheduled to {{start_at}}.";
  }

  async function load() {
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const url = new URL("/api/admin/notifications/templates", window.location.origin);
      url.searchParams.set("tenantSlug", tenantSlug);
      url.searchParams.set("scope", "scheduler");
      const res = await fetch(url.toString(), { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load templates");
      const templates: TemplateRow[] = json?.templates ?? [];

      const next: Record<string, TemplateRow> = {};
      for (const t of templates) next[keyOf(t.event_key, t.channel)] = t;

      // ensure missing rows show defaults
      for (const e of EVENTS) {
        for (const c of CHANNELS) {
          const k = keyOf(e,c);
          if (!next[k]) {
            next[k] = {
              event_key: e,
              channel: c,
              subject_template: c === "email" ? defaultSubject(e) : null,
              body_text_template: defaultText(e),
              body_html_template: null,
              is_enabled: true,
            };
          }
        }
      }

      setRows(next);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      ensureDefaults();
    } finally {
      setLoading(false);
    }
  }

  function patch(k: string, p: Partial<TemplateRow>) {
    setRows((prev) => ({ ...prev, [k]: { ...prev[k], ...p } }));
  }

  async function save(k: string) {
    setSavingKey(k);
    setError(null);
    setOk(null);
    try {
      const row = rows[k];
      const res = await fetch("/api/admin/notifications/templates/upsert", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, ...row, scope: "scheduler" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Save failed");
      setOk("Saved.");
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setSavingKey(null);
    }
  }

  useEffect(() => { load(); }, [tenantSlug]);

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 980 }}>
      <h1>Scheduling Notifications</h1>
      <div style={{ opacity: 0.8 }}>
        Use variables like <code>{"{{start_at}}"}</code>, <code>{"{{booking_uid}}"}</code>, <code>{"{{tenant_id}}"}</code>.
      </div>

      {loading ? <div>Loading…</div> : null}
      {error ? <div style={{ color: "crimson" }}>{error}</div> : null}
      {ok ? <div style={{ color: "green" }}>{ok}</div> : null}

      {Object.entries(rows).map(([k, row]) => (
        <div key={k} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{row.event_key} / {row.channel}</div>
              <div style={{ opacity: 0.75 }}>Template for this notification.</div>
            </div>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={row.is_enabled}
                onChange={(e) => patch(k, { is_enabled: e.target.checked })}
              />
              Enabled
            </label>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {row.channel === "email" ? (
              <label>
                Subject
                <input
                  value={row.subject_template ?? ""}
                  onChange={(e) => patch(k, { subject_template: e.target.value })}
                  style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
                />
              </label>
            ) : null}

            <label>
              Body (text)
              <textarea
                value={row.body_text_template ?? ""}
                onChange={(e) => patch(k, { body_text_template: e.target.value })}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6, minHeight: 90 }}
              />
            </label>

            {row.channel === "email" ? (
              <label>
                Body (HTML) (optional)
                <textarea
                  value={row.body_html_template ?? ""}
                  onChange={(e) => patch(k, { body_html_template: e.target.value })}
                  style={{ display: "block", width: "100%", padding: 8, marginTop: 6, minHeight: 120 }}
                />
              </label>
            ) : null}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => save(k)} disabled={savingKey === k}>
                {savingKey === k ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
