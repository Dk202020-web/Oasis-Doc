-- Admin recipient for automated order and deliverable email notifications.
insert into public.settings (key, value)
values ('admin_email', '')
on conflict (key) do nothing;
