"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { BookingSummary, SchedulePurpose } from "../types";

type Props = {
  tenantSlug: string;
  defaultPurpose?: SchedulePurpose;
};

function isoDayRange(daysForward: number) {
  const start = new Date();
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setDate(end.getDate() + daysForward);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function SchedulePage({ tenantSlug, defaultPurpose = "intro_call" }: Props) {
  const [purpose, setPurpose] = useState<SchedulePurpose>(defaultPurpose);
  const [timeZone, setTimeZone] = useState("America/New_York");
  const [rangeDays, setRangeDays] = useState(14);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [myBookings, setMyBookings] = useState<BookingSummary[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const range = useMemo(() => isoDayRange(rangeDays), [rangeDays]);

  async function loadSlots() {
    setLoadingSlots(true);
    setError(null);
    try {
      const url = new URL("/api/schedule/slots", window.location.origin);
      url.searchParams.set("tenantSlug", tenantSlug);
      url.searchParams.set("purpose", purpose);
      url.searchParams.set("start", range.start);
      url.searchParams.set("end", range.end);
      url.searchParams.set("timeZone", timeZone);
      const res = await fetch(url.toString(), { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load slots");
      setSlots(json?.slots ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function loadMyBookings() {
    setLoadingBookings(true);
    try {
      const url = new URL("/api/schedule/my-bookings", window.location.origin);
      url.searchParams.set("tenantSlug", tenantSlug);
      const res = await fetch(url.toString(), { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load bookings");
      setMyBookings(json?.bookings ?? []);
    } finally {
      setLoadingBookings(false);
    }
  }

  async function bookSlot(startIso: string) {
    setError(null);
    const res = await fetch("/api/schedule/book", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantSlug, purpose, start: startIso, timeZone }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json?.error ?? "Booking failed");
      return;
    }
    await loadMyBookings();
  }

  async function cancelBooking(bookingUid: string) {
    const res = await fetch("/api/schedule/cancel", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantSlug, bookingUid }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json?.error ?? "Cancel failed");
      return;
    }
    await loadMyBookings();
  }

  useEffect(() => {
    // best-effort timezone detection
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimeZone(tz);
    } catch {}
    loadMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, purpose, timeZone, rangeDays]);

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 960 }}>
      <h1>Schedule</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <label>
          Type{" "}
          <select value={purpose} onChange={(e) => setPurpose(e.target.value as SchedulePurpose)}>
            <option value="intro_call">Intro Call (Prospect)</option>
            <option value="demo">Demo / Consult</option>
            <option value="support">Customer Support</option>
          </select>
        </label>

        <label>
          Time zone{" "}
          <input value={timeZone} onChange={(e) => setTimeZone(e.target.value)} />
        </label>

        <label>
          Range{" "}
          <select value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))}>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </label>

        <button onClick={loadSlots} disabled={loadingSlots}>
          {loadingSlots ? "Loading..." : "Refresh slots"}
        </button>
      </div>

      {error ? <div style={{ color: "crimson" }}>{error}</div> : null}

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <h2>Available times</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {loadingSlots ? <div>Loading slots...</div> : null}
          {!loadingSlots && slots?.length === 0 ? <div>No slots found in selected range.</div> : null}
          {!loadingSlots && slots?.length > 0 ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {slots.slice(0, 60).map((s: any, idx: number) => {
                const start = s?.start ?? s?.startTime ?? s;
                const label = typeof start === "string" ? new Date(start).toLocaleString() : String(start);
                return (
                  <button key={idx} onClick={() => bookSlot(start)} style={{ padding: "8px 10px" }}>
                    {label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <h2>My bookings</h2>
        {loadingBookings ? <div>Loading...</div> : null}
        {!loadingBookings && myBookings.length === 0 ? <div>No bookings yet.</div> : null}
        {!loadingBookings && myBookings.length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {myBookings.map((b) => (
              <div key={b.bookingUid} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div><strong>{new Date(b.startAt).toLocaleString()}</strong></div>
                  <div style={{ opacity: 0.75 }}>{b.status}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => cancelBooking(b.bookingUid)} disabled={b.status !== "scheduled"}>
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
