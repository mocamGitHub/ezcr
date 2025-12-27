-- ZeroTouch smoke tests (DB-level)
-- Returns results; any FAILED row indicates a blocking issue.

with checks as (
  select 'table nx_scheduler_booking exists' as name,
    exists (select 1 from information_schema.tables where table_schema='public' and table_name='nx_scheduler_booking') as ok
  union all
  select 'table nx_notification_outbox exists',
    exists (select 1 from information_schema.tables where table_schema='public' and table_name='nx_notification_outbox')
  union all
  select 'RLS enabled on nx_scheduler_booking',
    (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname='nx_scheduler_booking')
  union all
  select 'RLS enabled on nx_notification_outbox',
    (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname='nx_notification_outbox')
  union all
  select 'trigger trg_nx_sched_booking_outbox exists',
    exists (
      select 1 from pg_trigger t
      join pg_class c on c.oid=t.tgrelid
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname='nx_scheduler_booking' and t.tgname='trg_nx_sched_booking_outbox'
    )
)
select name, case when ok then 'PASS' else 'FAIL' end as result
from checks
order by result desc, name;
