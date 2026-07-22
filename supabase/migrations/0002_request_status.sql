-- Add a single request status column and backfill it from the legacy
-- payment/work split used by the earlier app version.

alter table public.order_items
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'paid', 'in_progress', 'validated', 'completed', 'available', 'rejected'));

update public.order_items
set status = case
  when work_status = 'done' then 'available'
  when work_status = 'in_progress' then 'in_progress'
  when payment_status = 'paid' then 'paid'
  else 'pending'
end
where status = 'pending';

