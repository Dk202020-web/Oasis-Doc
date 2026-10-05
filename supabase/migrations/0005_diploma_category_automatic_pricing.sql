-- Diploma equivalence is a first-class catalog category. The request still
-- uses its specialized guided workflow rather than a fixed-price cart service.
insert into public.categories (name_fr, name_en, slug, icon, sort_order, is_active)
values ('Équivalence de diplômes', 'Diploma equivalence', 'equivalence-diplome', '🎓', 3, true)
on conflict (slug) do update set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  icon = excluded.icon,
  is_active = true;

insert into public.service_sections (category_id, name_fr, name_en, sort_order)
select id, 'Analyse de diplôme', 'Credential analysis', 0
from public.categories
where slug = 'equivalence-diplome'
  and not exists (
    select 1 from public.service_sections s
    where s.category_id = categories.id and s.name_en = 'Credential analysis'
  );

-- Present diploma equivalence as a normal catalog category, organized by
-- customer objective. These catalog entries lead to the guided case form;
-- their price is determined by the credential pricing rules, not cart prices.
update public.service_sections
set name_fr = 'Évaluation générale', name_en = 'General evaluation', sort_order = 0
where category_id = (select id from public.categories where slug = 'equivalence-diplome')
  and name_en = 'Credential analysis';

insert into public.service_sections (category_id, name_fr, name_en, sort_order)
select c.id, s.name_fr, s.name_en, s.sort_order
from public.categories c
cross join (values
  ('Études au Canada', 'Study in Canada', 1),
  ('Immigration au Canada', 'Immigration to Canada', 2),
  ('Emploi au Canada', 'Work in Canada', 3),
  ('Professions réglementées', 'Regulated professions', 4)
) as s(name_fr, name_en, sort_order)
where c.slug = 'equivalence-diplome'
  and not exists (
    select 1 from public.service_sections existing
    where existing.category_id = c.id and existing.name_en = s.name_en
  );

insert into public.services
  (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
select section.id, service_seed.name_fr, service_seed.name_en, service_seed.description_fr, service_seed.description_en, 0
from public.categories category
join public.service_sections section on section.category_id = category.id
join (values
  ('General evaluation', 'Analyse de diplôme et orientation', 'Credential analysis and guidance',
   'Analyse de votre diplôme et orientation selon votre objectif.', 'Credential analysis and guidance based on your goal.'),
  ('Study in Canada', 'Évaluation pour études et admission', 'Study and admission assessment',
   'Analyse de votre diplôme pour préparer un projet d’études au Canada.', 'Credential analysis to support a study plan in Canada.'),
  ('Immigration to Canada', 'Évaluation pour immigration', 'Immigration credential assessment',
   'Orientation sur les démarches d’évaluation liées à votre projet d’immigration.', 'Guidance on credential assessment steps for your immigration plans.'),
  ('Work in Canada', 'Évaluation pour emploi', 'Employment credential assessment',
   'Analyse de votre diplôme pour un projet professionnel au Canada.', 'Credential analysis for an employment plan in Canada.'),
  ('Regulated professions', 'Orientation pour profession réglementée', 'Regulated profession guidance',
   'Orientation initiale pour les démarches de reconnaissance d’une profession réglementée.', 'Initial guidance on recognition steps for a regulated profession.')
) as service_seed(section_en, name_fr, name_en, description_fr, description_en)
  on service_seed.section_en = section.name_en
where category.slug = 'equivalence-diplome'
  and not exists (
    select 1 from public.services existing
    where existing.section_id = section.id and existing.name_en = service_seed.name_en
  );

-- Configurable pathway reference data for the customer form. Institutions
-- and their faculties/schools use one hierarchical model so coverage can be
-- expanded from the initial Cameroon → Canada pathway without frontend edits.
create table if not exists public.credential_countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name_fr text not null,
  name_en text not null,
  support_status text not null check (support_status in ('supported','coming_soon','unsupported')),
  is_source boolean not null default false,
  is_destination boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.credential_institutions (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.credential_countries(code),
  parent_id uuid references public.credential_institutions(id) on delete set null,
  name_fr text not null,
  name_en text not null,
  institution_type text not null default 'institution',
  recognition_status text not null default 'unverified' check (recognition_status in ('recognized','unverified','needs_review','not_recognized')),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.credential_institution_aliases (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.credential_institutions(id) on delete cascade,
  alias text not null,
  normalized_alias text generated always as (lower(regexp_replace(alias, '[^[:alnum:]]+', '', 'g'))) stored
);

create unique index if not exists credential_institution_aliases_normalized_idx
  on public.credential_institution_aliases(normalized_alias);

alter table public.credential_countries enable row level security;
alter table public.credential_institutions enable row level security;
alter table public.credential_institution_aliases enable row level security;
drop policy if exists "active credential countries read" on public.credential_countries;
create policy "active credential countries read" on public.credential_countries
  for select using (active or public.is_admin());
drop policy if exists "admins manage credential countries" on public.credential_countries;
create policy "admins manage credential countries" on public.credential_countries
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "active credential institutions read" on public.credential_institutions;
create policy "active credential institutions read" on public.credential_institutions
  for select using (active or public.is_admin());
drop policy if exists "admins manage credential institutions" on public.credential_institutions;
create policy "admins manage credential institutions" on public.credential_institutions
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "credential aliases read" on public.credential_institution_aliases;
create policy "credential aliases read" on public.credential_institution_aliases
  for select using (true);
drop policy if exists "admins manage credential aliases" on public.credential_institution_aliases;
create policy "admins manage credential aliases" on public.credential_institution_aliases
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.credential_countries
  (code,name_fr,name_en,support_status,is_source,is_destination,sort_order)
values ('CM','Cameroun','Cameroon','supported',true,false,0),
       ('CA','Canada','Canada','supported',false,true,0)
on conflict (code) do update set active=true;

insert into public.credential_institutions
  (country_code,name_fr,name_en,institution_type,recognition_status,sort_order)
values
  ('CM','Université de Bamenda','University of Bamenda','state_university','unverified',10),
  ('CM','Université de Bertoua','University of Bertoua','state_university','unverified',20),
  ('CM','Université de Buea','University of Buea','state_university','unverified',30),
  ('CM','Université de Dschang','University of Dschang','state_university','unverified',40),
  ('CM','Université de Douala','University of Douala','state_university','unverified',50),
  ('CM','Université d’Ebolowa','University of Ebolowa','state_university','unverified',60),
  ('CM','Université de Garoua','University of Garoua','state_university','unverified',70),
  ('CM','Université de Maroua','University of Maroua','state_university','unverified',80),
  ('CM','Université de Ngaoundéré','University of Ngaoundéré','state_university','unverified',90),
  ('CM','Université de Yaoundé I','University of Yaounde I','state_university','unverified',100),
  ('CM','Université de Yaoundé II','University of Yaounde II','state_university','unverified',110)
on conflict do nothing;

insert into public.credential_institution_aliases(institution_id,alias)
select i.id, a.alias
from public.credential_institutions i
cross join lateral (values
  (i.name_fr),(i.name_en),
  (replace(i.name_fr,'Université','Universite')),
  (replace(i.name_en,'é','e'))
) a(alias)
where i.country_code='CM' and i.institution_type='state_university'
on conflict do nothing;

-- Representative components are editable through the same admin reference
-- data model; no unsupported recognition claim is implied by their presence.
insert into public.credential_institutions
  (country_code,parent_id,name_fr,name_en,institution_type,recognition_status,sort_order)
select 'CM', parent.id, component.name_fr, component.name_en, component.kind, 'unverified', component.sort_order
from (values
  ('University of Douala','IUT de Douala','IUT Douala','IUT',10),
  ('University of Ngaoundéré','IUT de Ngaoundéré','IUT Ngaoundere','IUT',20),
  ('University of Yaounde I','École normale supérieure de Yaoundé','Higher Teacher Training College Yaounde','school',30),
  ('University of Dschang','FASA','Faculty of Agronomy and Agricultural Sciences','faculty',40),
  ('University of Buea','College of Technology','College of Technology','school',50)
) component(parent_name,name_fr,name_en,kind,sort_order)
join public.credential_institutions parent on parent.name_en=component.parent_name
where not exists (select 1 from public.credential_institutions c where c.parent_id=parent.id and c.name_en=component.name_en);

-- Pricing configuration is backend-owned. Admins can continue to manage
-- catalog service prices, while credential quotes use the configured rules
-- without requiring staff review for each customer.
drop policy if exists "admins manage credential pricing rules" on public.credential_pricing_rules;

alter table public.credential_price_quotes
  drop constraint if exists credential_price_quotes_status_check;
alter table public.credential_price_quotes
  add constraint credential_price_quotes_status_check
  check (status in ('estimated', 'submitted', 'awaiting_acceptance', 'accepted', 'declined'));

create or replace function public.attach_credential_documents(p_quote_id uuid,p_documents jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_quote public.credential_price_quotes;
begin
  if jsonb_typeof(p_documents) <> 'array' or jsonb_array_length(p_documents) = 0 then
    raise exception 'At least the diploma document is required';
  end if;
  if not exists(select 1 from jsonb_array_elements(p_documents) d
    where d->>'kind'='diploma' and d->>'storage_path' like auth.uid()::text || '/%') then
    raise exception 'A diploma file in your own storage folder is required';
  end if;
  if exists(select 1 from jsonb_array_elements(p_documents) d
    where d->>'storage_path' not like auth.uid()::text || '/%') then
    raise exception 'Invalid document path';
  end if;
  update public.credential_price_quotes
    set documents=p_documents,
        final_xaf=estimate_xaf,
        final_breakdown=estimate_breakdown,
        final_explanation=jsonb_build_object(
          'fr','Le tarif est calculé automatiquement selon les informations de votre demande. Aucun supplément de revue ne sera ajouté après l’envoi des documents.',
          'en','The price is calculated automatically from your request details. No document review surcharge will be added after upload.'
        ),
        status='submitted',
        reviewed_at=now()
    where id=p_quote_id and user_id=auth.uid() and status='estimated'
    returning * into v_quote;
  if not found then raise exception 'Quote not found or documents already submitted'; end if;
  return jsonb_build_object('id',v_quote.id,'documents',v_quote.documents,
    'status',v_quote.status,'final_xaf',v_quote.final_xaf,'currency','XAF');
end; $$;

create or replace function public.create_credential_price_quote(p_inputs jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  -- Keep the established pricing function authoritative; update its customer
  -- copy through the stored quote response after calculating the same rules.
  v_result := public.create_credential_price_quote(p_inputs);
  return v_result || jsonb_build_object(
    'message_fr','Tarif calculé automatiquement selon le parcours déclaré. Il restera fixe après l’envoi des documents.',
    'message_en','Price calculated automatically from the selected pathway. It remains fixed after document upload.'
  );
end; $$;

-- Restore the authoritative server-side estimator with fixed-price copy.
create or replace function public.create_credential_price_quote(p_inputs jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_count int := coalesce((p_inputs->>'credential_count')::int,1);
  v_rule record;
  v_amount bigint;
  v_total bigint := 0;
  v_breakdown jsonb := '[]'::jsonb;
  v_groups text[] := array[]::text[];
  v_quote public.credential_price_quotes;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if v_count not between 1 and 20 then raise exception 'Credential count must be from 1 to 20'; end if;
  if p_inputs->>'source_country' is distinct from 'CM' or p_inputs->>'destination_country' is distinct from 'CA' then
    raise exception 'This pricing pathway currently supports Cameroon to Canada';
  end if;
  if p_inputs is null or jsonb_typeof(p_inputs) is distinct from 'object'
    or coalesce(p_inputs->>'purpose','') not in ('study','immigration','work','licensing','general')
    or coalesce(p_inputs->>'qualification_type','') not in ('general','professional','engineering','medical','doctoral')
    or coalesce(p_inputs->>'academic_system','') not in ('lmd','former_system','professional','engineering','medical','unknown')
    or coalesce(p_inputs->>'institution_review','') not in ('','needs_verification') then
    raise exception 'Invalid credential pricing inputs';
  end if;
  for v_rule in select * from public.credential_pricing_rules
    where active and stage='estimate' and (factor_type in ('base','additional_credential') or p_inputs->>factor_type=factor_value)
    order by priority desc, factor_type
  loop
    if v_rule.exclusive_group is not null and v_rule.exclusive_group=any(v_groups) then continue; end if;
    if v_rule.exclusive_group is not null then v_groups:=array_append(v_groups,v_rule.exclusive_group); end if;
    v_amount := case when v_rule.factor_type='additional_credential' then v_rule.amount_xaf * greatest(v_count-1,0) else v_rule.amount_xaf end;
    v_total:=v_total+v_amount;
    v_breakdown:=v_breakdown||jsonb_build_array(jsonb_build_object('factor_type',v_rule.factor_type,'factor_value',v_rule.factor_value,'label_fr',v_rule.label_fr,'label_en',v_rule.label_en,'amount_xaf',v_amount));
  end loop;
  if not exists(select 1 from public.credential_pricing_rules where active and stage='estimate' and factor_type='base' and factor_value='default') then raise exception 'No base price is configured'; end if;
  if v_total<0 then raise exception 'Estimate cannot be negative'; end if;
  insert into public.credential_price_quotes(user_id,inputs,credential_count,estimate_xaf,estimate_breakdown) values(v_user,p_inputs,v_count,v_total,v_breakdown) returning * into v_quote;
  return jsonb_build_object('id',v_quote.id,'status',v_quote.status,'estimate_xaf',v_total,'currency','XAF','breakdown',v_breakdown,
    'message_fr','Tarif calcule automatiquement selon le parcours declare. Il reste fixe apres envoi des documents.',
    'message_en','Price is calculated automatically from the selected pathway and stays fixed after document upload.');
end; $$;

-- Prevent the legacy per-quote admin adjustment function from changing an
-- automatically calculated customer price.
create or replace function public.set_credential_final_price(
  p_quote_id uuid,p_review_factors jsonb,p_explanation_fr text,p_explanation_en text
) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  raise exception 'Credential pricing is automatic; individual quote adjustments are disabled';
end; $$;

revoke all on function public.set_credential_final_price(uuid,jsonb,text,text) from public, authenticated;
