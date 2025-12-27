-- Optional helper RPC to dequeue outbox rows with locking (FOR UPDATE SKIP LOCKED).
-- Claude Code can install this as a Supabase SQL function and call it from dispatcher.

create or replace function public.nx_outbox_dequeue(p_limit int default 25)
returns setof public.nx_notification_outbox
language plpgsql
security definer
as $$
begin
  return query
  with cte as (
    select o.*
    from public.nx_notification_outbox o
    where o.status = 'pending'
      and o.next_attempt_at <= now()
    order by o.created_at asc
    for update skip locked
    limit p_limit
  )
  select * from cte;
end;
$$;

-- IMPORTANT:
-- - Ensure this function's privileges are correct for your service role usage.
-- - Consider an additional filter by tenant or channel if needed.
