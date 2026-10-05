-- Configurable workload pricing in whole XAF amounts (35000 = 35,000 FCFA).
create table if not exists public.credential_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  stage text not null check (stage in ('estimate', 'document_review')),
  factor_type text not null,
  factor_value text not null,
  label_fr text not null,
  label_en text not null,
  amount_xaf bigint not null,
  exclusive_group text,
  priority int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (stage='document_review' or amount_xaf >= 0),
  unique (stage, factor_type, factor_value)
);

create table if not exists public.credential_price_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  inputs jsonb not null,
  documents jsonb not null default '[]'::jsonb,
  credential_count int not null check (credential_count between 1 and 20),
  estimate_xaf bigint not null check (estimate_xaf >= 0),
  estimate_breakdown jsonb not null default '[]'::jsonb,
  final_xaf bigint check (final_xaf is null or final_xaf >= 0),
  final_breakdown jsonb,
  final_explanation jsonb,
  status text not null default 'estimated' check (status in ('estimated', 'awaiting_acceptance', 'accepted', 'declined')),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.credential_pricing_rules enable row level security;
alter table public.credential_price_quotes enable row level security;
create policy "admins manage credential pricing rules" on public.credential_pricing_rules
  for all using (public.is_admin()) with check (public.is_admin());
create policy "customers and admins read credential quotes" on public.credential_price_quotes
  for select using (user_id = auth.uid() or public.is_admin());

-- Illustrative starting prices; administrators can edit them in Supabase.
-- Similar specialized factors share an exclusive group to avoid double-charging.
insert into public.credential_pricing_rules
  (stage,factor_type,factor_value,label_fr,label_en,amount_xaf,exclusive_group,priority)
values
  ('estimate','base','default','Analyse de base','Base credential analysis',35000,null,100),
  ('estimate','purpose','study','Parcours études','Study pathway',10000,null,50),
  ('estimate','purpose','immigration','Parcours immigration','Immigration pathway',20000,null,50),
  ('estimate','purpose','work','Parcours emploi','Employment pathway',12000,null,50),
  ('estimate','purpose','licensing','Licence professionnelle','Professional licensing',30000,null,50),
  ('estimate','qualification_type','professional','Diplôme professionnel','Professional credential',10000,'specialized_pathway',40),
  ('estimate','qualification_type','engineering','Diplôme ingénieur','Engineering credential',25000,'specialized_pathway',60),
  ('estimate','qualification_type','medical','Diplôme santé','Health credential',35000,'specialized_pathway',70),
  ('estimate','qualification_type','doctoral','Niveau doctoral','Doctoral level',20000,'specialized_pathway',50),
  ('estimate','academic_system','former_system','Ancien système universitaire','Legacy academic system',10000,null,30),
  ('estimate','academic_system','professional','Système professionnel','Professional system',8000,null,30),
  ('estimate','academic_system','engineering','Système ingénieur','Engineering system',15000,'specialized_pathway',30),
  ('estimate','academic_system','medical','Système médical','Medical system',15000,'specialized_pathway',30),
  ('estimate','institution_review','needs_verification','Vérification institutionnelle','Institution verification',12000,null,20),
  ('estimate','additional_credential','same_pathway','Diplôme supplémentaire, parcours commun','Additional credential, shared pathway',18000,null,10),
  ('document_review','document_review','clear','Documents lisibles et cohérents','Clear, consistent documents',-5000,null,10),
  ('document_review','document_review','poor_quality','Documents difficiles à lire','Poor-quality documents',10000,null,20),
  ('document_review','document_review','conflict','Informations divergentes','Conflicting information',15000,null,30),
  ('document_review','verification','manual','Vérification manuelle','Manual verification',20000,null,40),
  ('document_review','document_review','missing_required','Document requis manquant','Missing required document',8000,null,15)
on conflict (stage,factor_type,factor_value) do nothing;

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
    where active and stage='estimate' and (
      factor_type in ('base','additional_credential') or p_inputs->>factor_type=factor_value)
    order by priority desc, factor_type
  loop
    if v_rule.exclusive_group is not null and v_rule.exclusive_group=any(v_groups) then continue; end if;
    if v_rule.exclusive_group is not null then v_groups:=array_append(v_groups,v_rule.exclusive_group); end if;
    v_amount := case when v_rule.factor_type='additional_credential'
      then v_rule.amount_xaf * greatest(v_count-1,0) else v_rule.amount_xaf end;
    v_total:=v_total+v_amount;
    v_breakdown:=v_breakdown||jsonb_build_array(jsonb_build_object(
      'factor_type',v_rule.factor_type,'factor_value',v_rule.factor_value,
      'label_fr',v_rule.label_fr,'label_en',v_rule.label_en,'amount_xaf',v_amount));
  end loop;
  if not exists(select 1 from public.credential_pricing_rules where active and stage='estimate' and factor_type='base' and factor_value='default') then
    raise exception 'No base price is configured';
  end if;
  if v_total<0 then raise exception 'Estimate cannot be negative'; end if;
  insert into public.credential_price_quotes(user_id,inputs,credential_count,estimate_xaf,estimate_breakdown)
    values(v_user,p_inputs,v_count,v_total,v_breakdown) returning * into v_quote;
  return jsonb_build_object('id',v_quote.id,'status',v_quote.status,'estimate_xaf',v_total,
    'currency','XAF','breakdown',v_breakdown,
    'message_fr','Estimation initiale. Le montant final peut changer après examen des documents.',
    'message_en','Initial estimate. The final amount may change after document review.');
end; $$;

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
  update public.credential_price_quotes set documents=p_documents
    where id=p_quote_id and user_id=auth.uid() and status='estimated' returning * into v_quote;
  if not found then raise exception 'Quote not found or already reviewed'; end if;
  return jsonb_build_object('id',v_quote.id,'documents',v_quote.documents);
end; $$;

create or replace function public.set_credential_final_price(
  p_quote_id uuid,p_review_factors jsonb,p_explanation_fr text,p_explanation_en text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_quote public.credential_price_quotes;
  v_factor jsonb;
  v_rule record;
  v_total bigint;
  v_breakdown jsonb := '[]'::jsonb;
  v_seen_types text[] := array[]::text[];
  v_seen_groups text[] := array[]::text[];
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  select * into v_quote from public.credential_price_quotes where id=p_quote_id for update;
  if not found then raise exception 'Quote not found'; end if;
  if v_quote.status <> 'estimated' then raise exception 'This quote has already been reviewed'; end if;
  if jsonb_array_length(v_quote.documents)=0 then raise exception 'Upload the diploma document before review'; end if;
  v_total:=v_quote.estimate_xaf;
  for v_factor in select value from jsonb_array_elements(coalesce(p_review_factors,'[]'::jsonb)) loop
    select * into v_rule from public.credential_pricing_rules where active and stage='document_review'
      and factor_type=v_factor->>'factor_type' and factor_value=v_factor->>'factor_value'
      order by priority desc limit 1;
    if not found then raise exception 'Unknown document review pricing factor'; end if;
    if v_rule.factor_type = any(v_seen_types) then raise exception 'Only one rule per review factor can be applied'; end if;
    v_seen_types:=array_append(v_seen_types,v_rule.factor_type);
    if v_rule.exclusive_group is not null and v_rule.exclusive_group = any(v_seen_groups) then
      raise exception 'Mutually exclusive review factors cannot be combined';
    end if;
    if v_rule.exclusive_group is not null then v_seen_groups:=array_append(v_seen_groups,v_rule.exclusive_group); end if;
    v_total:=v_total+v_rule.amount_xaf;
    v_breakdown:=v_breakdown||jsonb_build_array(jsonb_build_object(
      'factor_type',v_rule.factor_type,'factor_value',v_rule.factor_value,
      'label_fr',v_rule.label_fr,'label_en',v_rule.label_en,'amount_xaf',v_rule.amount_xaf));
  end loop;
  if v_total<0 then raise exception 'Final price cannot be negative'; end if;
  if v_total<>v_quote.estimate_xaf and (nullif(btrim(p_explanation_fr),'') is null or nullif(btrim(p_explanation_en),'') is null) then
    raise exception 'Explain every price change in both supported languages';
  end if;
  update public.credential_price_quotes set final_xaf=v_total,final_breakdown=v_breakdown,
    final_explanation=jsonb_build_object('fr',p_explanation_fr,'en',p_explanation_en),
    status=case when v_total>estimate_xaf then 'awaiting_acceptance' else 'accepted' end,
    accepted_at=case when v_total<=estimate_xaf then now() else null end,reviewed_at=now()
    where id=p_quote_id returning * into v_quote;
  return jsonb_build_object('id',v_quote.id,'status',v_quote.status,
    'estimate_xaf',v_quote.estimate_xaf,'final_xaf',v_quote.final_xaf,
    'currency','XAF','breakdown',v_quote.final_breakdown,'explanation',v_quote.final_explanation);
end; $$;

create or replace function public.respond_to_credential_price(p_quote_id uuid,p_accept boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_quote public.credential_price_quotes;
begin
  update public.credential_price_quotes set status=case when p_accept then 'accepted' else 'declined' end,
    accepted_at=case when p_accept then now() else null end
  where id=p_quote_id and user_id=auth.uid() and status='awaiting_acceptance' returning * into v_quote;
  if not found then raise exception 'No revised price is awaiting your response'; end if;
  return jsonb_build_object('id',v_quote.id,'status',v_quote.status,'final_xaf',v_quote.final_xaf,'currency','XAF');
end; $$;

revoke all on function public.create_credential_price_quote(jsonb) from public;
revoke all on function public.attach_credential_documents(uuid,jsonb) from public;
revoke all on function public.set_credential_final_price(uuid,jsonb,text,text) from public;
revoke all on function public.respond_to_credential_price(uuid,boolean) from public;
grant execute on function public.create_credential_price_quote(jsonb) to authenticated;
grant execute on function public.attach_credential_documents(uuid,jsonb) to authenticated;
grant execute on function public.set_credential_final_price(uuid,jsonb,text,text) to authenticated;
grant execute on function public.respond_to_credential_price(uuid,boolean) to authenticated;
