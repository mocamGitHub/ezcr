"use client";

import React, { useEffect, useState } from "react";

type Props = {
  tenantSlug: string;
};

type Settings = {
  organization_slug: string;
  is_enabled: boolean;
};

export function SchedulerSettingsClient({ tenantSlug }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgSlug, setOrgSlug] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const url = new URL("/api/admin/scheduling/settings", window.location.origin);
      url.searchParams.set("tenantSlug", tenantSlug);
      const res = await fetch(url.toString(), { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load settings");
      const s: Settings | null = json?.settings ?? null;
      setOrgSlug(s?.organization_slug ?? "");
      setEnabled(Boolean(s?.is_enabled ?? true));
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/admin/scheduling/settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          organization_slug: orgSlug.trim(),
          is_enabled: enabled,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Save failed");
      setOk("Saved.");
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { load(); }, [tenantSlug]);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
      <h1>Scheduling Settings</h1>

      {loading ? <div>Loading…</div> : null}
      {error ? <div style={{ color: "crimson" }}>{error}</div> : null}
      {ok ? <div style={{ color: "green" }}>{ok}</div> : null}

      <label>
        Cal.com Organization Slug
        <input
          value={orgSlug}
          onChange={(e) => setOrgSlug(e.target.value)}
          placeholder="e.g. ezcycleramp"
          style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
        />
      </label>

      <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enable scheduling for this tenant
      </label>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={save} disabled={saving || loading}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={load} disabled={saving || loading}>
          Refresh
        </button>
      </div>
    </div>
  );
}
