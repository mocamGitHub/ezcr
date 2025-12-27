export type NxAccountKind = "prospect" | "customer" | "staff";

export type SchedulePurpose = "intro_call" | "demo" | "support";

export type Slot = {
  start: string; // ISO
  end?: string;  // ISO
};

export type CreateBookingInput = {
  tenantSlug: string;
  purpose: SchedulePurpose;
  start: string; // ISO
  timeZone: string;
  notes?: string;
};

export type BookingSummary = {
  bookingUid: string;
  tenantId: string;
  startAt: string;
  endAt?: string;
  status: "scheduled" | "cancelled" | "rescheduled";
  title?: string;
};
