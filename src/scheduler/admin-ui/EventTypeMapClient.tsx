"use client";

import React, { useEffect, useMemo, useState } from "react";

type AccountKind = "prospect" | "customer" | "staff";
type Purpose = "intro_call" | "demo" | "support";

type Row = {
  purpose: Purpose;
  cal_event_type_id: number | null;
  allow_kinds: AccountKind[];
  is_enabled: boolean;
};

const PURPOSES: Purpose[] = ["intro_call", "demo", "support"];
const KIND_LABELS: Record<AccountKind, string> = {
  prospect: "Prospect",
  customer: "Customer",
  staff: "Staff",
};

export function EventTypeMapClient({ tenantSlug }: { tenantSlug: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Purpose | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [rows, setRows] = useState<Record<Purpose, Row>>(() => {
    const initial: any = {};
    for (const p of PURPOSES) {
      initial[p] = { purpose: p, cal_event_type_id: null, allow_kinds: ["prospect","customer"], is_enabled: true };
    }
    return initial;
  });

  async function load() {
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const url = new URL("/api/admin/scheduling/event-types", window.location.origin);
      url.searchParams.set("tenantSlug", tenantSlug);
      const res = await fetch(url.toString(), { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load mappings");
      const data: Row[] = json?.mappings ?? [];
      const next = { ...rows };
      for (const p of PURPOSES) {
        const match = data.find((d) => d.purpose === p);
        if (match) next[p] = match;
      }
      setRows(next);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function setRow(p: Purpose, patch: Partial<Row>) {
    setRows((prev) => ({ ...prev, [p]: { ...prev[p], ...patch } }));
  }

  async function save(purpose: Purpose) {
    setSaving(purpose);
    setError(null);
    setOk(null);
    try {
      const row = rows[purpose];
      const res = await fetch("/api/admin/scheduling/event-types/upsert", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, ...row }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Save failed");
      setOk(`Saved ${purpose}.`);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setSaving(null);
    }
  }

  useEffect(() => { load(); }, [tenantSlug]);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 980 }}>
      <h1>Scheduling Event Types</h1>

      {loading ? <div>Loading…</div> : null}
      {error ? <div style={{ color: "crimson" }}>{error}</div> : null}
      {ok ? <div style={{ color: "green" }}>{ok}</div> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {PURPOSES.map((p) => {
          const row = rows[p];
          return (
            <div key={p} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p}</div>
                  <div style={{ opacity: 0.75 }}>Map this purpose to a Cal.com eventTypeId.</div>
                </div>
                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={row.is_enabled}
                    onChange={(e) => setRow(p, { is_enabled: e.target.checked })}
                  />
                  Enabled
                </label>
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                <label>
                  Cal.com eventTypeId
                  <input
                    type="number"
                    value={row.cal_event_type_id ?? ""}
                    onChange={(e) => setRow(p, { cal_event_type_id: e.target.value ? Number(e.target.value) : null })}
                    style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
                    placeholder="e.g. 12345"
                  />
                </label>

                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Who can book this?</div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {(["prospect","customer","staff"] as AccountKind[]).map((k) => {
                      const checked = row.allow_kinds.includes(k);
                      return (
                        <label key={k} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? Array.from(new Set([...row.allow_kinds, k]))
                                : row.allow_kinds.filter((x) => x !== k);
                              setRow(p, { allow_kinds: next });
                            }}
                          />
                          {KIND_LABELS[k]}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => save(p)} disabled={saving === p || loading}>
                    {saving === p ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
