-- ============================================================
-- Oasis-Doc — initial schema, RLS policies, triggers, storage
-- Run this once in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

-- ---------- USERS ----------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a public.users row whenever someone signs up via Supabase Auth.
-- Also auto-promotes to admin if their email is already in admin_invites
-- (this is how "add co-admin from the dashboard" works without a direct
-- DB edit — an existing admin adds the email, and the promotion happens
-- here on signup, or immediately via the trigger below if they already
-- have an account).
create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
  invited boolean;
begin
  select exists (
    select 1 from public.admin_invites
    where lower(btrim(email)) = lower(btrim(new.email))
  ) into invited;

  insert into public.users (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    lower(btrim(new.email)),
    case when invited then 'admin' else 'user' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------- ADMIN INVITES (co-admin support) ----------
create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  invited_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create unique index if not exists admin_invites_email_canonical_idx
  on public.admin_invites (lower(btrim(email)));

create or replace function public.normalize_admin_invite_email()
returns trigger as $$
begin
  new.email := lower(btrim(new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_admin_invite_normalize on public.admin_invites;
create trigger on_admin_invite_normalize
  before insert or update on public.admin_invites
  for each row execute function public.normalize_admin_invite_email();

-- If the invited email already has an account, promote them immediately.
create or replace function public.handle_new_admin_invite()
returns trigger as $$
begin
  update public.users
    set role = 'admin'
    where lower(btrim(email)) = lower(btrim(new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_admin_invite_created on public.admin_invites;
create trigger on_admin_invite_created
  after insert on public.admin_invites
  for each row execute function public.handle_new_admin_invite();

-- ---------- CATALOG ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_fr text not null,
  name_en text not null,
  slug text not null unique,
  icon text default '📄',
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.service_sections (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name_fr text not null,
  name_en text not null,
  sort_order int not null default 0
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.service_sections(id) on delete cascade,
  name_fr text not null,
  name_en text not null,
  description_fr text default '',
  description_en text default '',
  price_xaf numeric not null default 0,
  is_active boolean not null default true
);

create table if not exists public.service_requirements (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  type text not null check (type in ('short_text','long_text','date','file_image','file_pdf','file_multi')),
  label_fr text not null,
  label_en text not null,
  help_text text,
  is_required boolean not null default true,
  accepted_formats text[],
  max_size_mb int default 5,
  sort_order int not null default 0
);

-- ---------- ORDERS ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  order_ref text not null unique,
  created_at timestamptz not null default now(),
  whatsapp_sent_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  service_id uuid not null references public.services(id),
  price_at_order numeric not null,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid')),
  work_status text not null default 'pending' check (work_status in ('pending','in_progress','done')),
  submitted_values jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.order_item_files (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  requirement_id uuid references public.service_requirements(id),
  storage_path text not null,
  file_name text,
  uploaded_by text not null check (uploaded_by in ('user','admin')),
  kind text not null check (kind in ('source','deliverable')),
  created_at timestamptz not null default now()
);

-- ---------- SETTINGS (WhatsApp number, etc.) ----------
create table if not exists public.settings (
  key text primary key,
  value text
);
insert into public.settings (key, value)
  values ('whatsapp_number', '+237690409736')
  on conflict (key) do nothing;

create or replace function public.lookup_order_tracking(p_order_ref text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'order', jsonb_build_object(
      'id', o.id,
      'order_ref', o.order_ref,
      'created_at', o.created_at
    ),
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'order_id', oi.order_id,
            'service_id', oi.service_id,
            'price_at_order', oi.price_at_order,
            'payment_status', oi.payment_status,
            'work_status', oi.work_status,
            'submitted_values', oi.submitted_values,
            'created_at', oi.created_at,
            'service', to_jsonb(s.*)
          )
          order by oi.created_at
        )
        from public.order_items oi
        join public.services s on s.id = oi.service_id
        where oi.order_id = o.id
      ),
      '[]'::jsonb
    )
  )
  into result
  from public.orders o
  where upper(btrim(o.order_ref)) = upper(btrim(p_order_ref))
  limit 1;

  return result;
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.users enable row level security;
alter table public.admin_invites enable row level security;
alter table public.categories enable row level security;
alter table public.service_sections enable row level security;
alter table public.services enable row level security;
alter table public.service_requirements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_files enable row level security;
alter table public.settings enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- users: everyone can read their own row; admins can read/update all
create policy "users read own" on public.users
  for select using (auth.uid() = id or public.is_admin());
create policy "users update own" on public.users
  for update using (auth.uid() = id or public.is_admin());

-- admin_invites: admin-only
create policy "admin_invites admin all" on public.admin_invites
  for all using (public.is_admin()) with check (public.is_admin());

-- catalog: public read of active rows; admin full access
create policy "categories public read" on public.categories
  for select using (is_active or public.is_admin());
create policy "categories admin write" on public.categories
  for insert with check (public.is_admin());
create policy "categories admin update" on public.categories
  for update using (public.is_admin());
create policy "categories admin delete" on public.categories
  for delete using (public.is_admin());

create policy "sections public read" on public.service_sections
  for select using (true);
create policy "sections admin write" on public.service_sections
  for insert with check (public.is_admin());
create policy "sections admin update" on public.service_sections
  for update using (public.is_admin());
create policy "sections admin delete" on public.service_sections
  for delete using (public.is_admin());

create policy "services public read" on public.services
  for select using (is_active or public.is_admin());
create policy "services admin write" on public.services
  for insert with check (public.is_admin());
create policy "services admin update" on public.services
  for update using (public.is_admin());
create policy "services admin delete" on public.services
  for delete using (public.is_admin());

create policy "requirements public read" on public.service_requirements
  for select using (true);
create policy "requirements admin write" on public.service_requirements
  for insert with check (public.is_admin());
create policy "requirements admin update" on public.service_requirements
  for update using (public.is_admin());
create policy "requirements admin delete" on public.service_requirements
  for delete using (public.is_admin());

-- orders: a customer sees only their own; admin sees all; anyone can
-- look an order up by exact order_ref through lookup_order_tracking()
create policy "orders owner or admin read" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders owner insert" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders admin update" on public.orders
  for update using (public.is_admin());

-- order_items: readable if you own the parent order, or you're admin,
-- guest lookups use lookup_order_tracking() instead of direct table reads.
create policy "order_items read" on public.order_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "order_items owner insert" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "order_items admin update" on public.order_items
  for update using (public.is_admin());

create policy "order_item_files read" on public.order_item_files
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_id and o.user_id = auth.uid()
    )
  );
create policy "order_item_files owner insert source" on public.order_item_files
  for insert with check (
    kind = 'source'
    and exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_id and o.user_id = auth.uid()
    )
  );
create policy "order_item_files admin insert deliverable" on public.order_item_files
  for insert with check (kind = 'deliverable' and public.is_admin());

-- settings: public read (needed for WhatsApp number on public pages), admin write
create policy "settings public read" on public.settings
  for select using (true);
create policy "settings admin write" on public.settings
  for insert with check (public.is_admin());
create policy "settings admin update" on public.settings
  for update using (public.is_admin());

-- ============================================================
-- Storage buckets (private) + policies
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('order-source-files', 'order-source-files', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('order-deliverables', 'order-deliverables', false)
  on conflict (id) do nothing;

-- Source files: path is `${user_id}/${order_ref}/...` — a user can only
-- write/read under their own folder; admins can read everything.
create policy "source files owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'order-source-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "source files owner read"
  on storage.objects for select
  using (
    bucket_id = 'order-source-files'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- Deliverables: only admins upload; owning user + admin can read.
-- (Read-access scoping to the right customer for deliverables happens
-- via signed URLs generated after an order_item ownership check in the
-- app, since the deliverable path is keyed by order_id/order_item_id
-- rather than user_id.)
create policy "deliverables admin upload"
  on storage.objects for insert
  with check (bucket_id = 'order-deliverables' and public.is_admin());
create policy "deliverables read"
  on storage.objects for select
  using (bucket_id = 'order-deliverables');
