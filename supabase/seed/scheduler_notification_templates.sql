-- Optional starter templates (per tenant).
-- Claude Code may convert this into an admin UI later, or integrate into existing template system.

-- Example: replace :TENANT_ID with real tenant UUID
-- insert into public.nx_notification_template (tenant_id, event_key, channel, subject_template, body_text_template, body_html_template)
-- values
-- (:TENANT_ID, 'booking_created', 'email', 'Appointment scheduled', 'Your appointment is scheduled for {{start_at}}.', null),
-- (:TENANT_ID, 'booking_cancelled', 'email', 'Appointment cancelled', 'Your appointment has been cancelled.', null),
-- (:TENANT_ID, 'booking_rescheduled', 'email', 'Appointment rescheduled', 'Your appointment has been rescheduled to {{start_at}}.', null);
