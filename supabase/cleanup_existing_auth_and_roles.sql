-- Cleanup existing auth/role data after the auth hardening migration.
-- Safe to run more than once.
--
-- What this does:
-- 1) Normalizes email casing/spacing in public.users and public.admin_invites
-- 2) Removes duplicate admin invite rows that collapse to the same email
-- 3) Promotes any already-existing users whose email is present in admin_invites
-- 4) Leaves existing admins alone unless they are matched by invite data
--
-- Run in the Supabase SQL editor.

begin;

-- Normalize all stored invite emails.
update public.admin_invites
set email = lower(btrim(email))
where email is not null
  and email <> lower(btrim(email));

-- Normalize stored user emails too, so invite matching stays stable.
update public.users
set email = lower(btrim(email))
where email is not null
  and email <> lower(btrim(email));

-- Remove duplicate invite rows that collapse to the same canonical email.
-- Keep the most recent row for each email.
with ranked_invites as (
  select
    id,
    email,
    row_number() over (
      partition by email
      order by created_at desc, id desc
    ) as rn
  from public.admin_invites
)
delete from public.admin_invites ai
using ranked_invites ri
where ai.id = ri.id
  and ri.rn > 1;

-- Re-promote any existing users whose normalized email is on the invite list.
update public.users u
set role = 'admin'
where exists (
  select 1
  from public.admin_invites i
  where lower(btrim(i.email)) = lower(btrim(u.email))
);

-- Optional review query:
-- These are current admins who do not have a matching invite row.
-- Uncomment if you want to inspect them before doing anything else.
-- select id, full_name, email
-- from public.users u
-- where role = 'admin'
--   and not exists (
--     select 1
--     from public.admin_invites i
--     where lower(btrim(i.email)) = lower(btrim(u.email))
--   )
-- order by email;

commit;
