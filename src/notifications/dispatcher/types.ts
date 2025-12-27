export type NotificationChannel = "email" | "sms" | "in_app";
export type NotificationStatus = "pending" | "sending" | "sent" | "failed" | "dead";

export type OutboxRow = {
  id: string;
  tenant_id: string;
  channel: NotificationChannel;
  event_key: string;
  to_address: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  payload: any;
  status: NotificationStatus;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string;
};
