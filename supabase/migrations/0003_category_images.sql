-- Category illustrations for catalogue cards.

alter table public.categories
  add column if not exists image_path text;

update public.categories
set image_path = case
  when image_path is not null and image_path <> '' then image_path
  when sort_order = 0 then '/cat1.png'
  when sort_order = 1 then '/cat2.png'
  when sort_order = 2 then '/cat3.png'
  else '/cat4.png'
end;

insert into storage.buckets (id, name, public)
  values ('category-images', 'category-images', true)
  on conflict (id) do nothing;

create policy "category images admin upload"
  on storage.objects for insert
  with check (bucket_id = 'category-images' and public.is_admin());

create policy "category images admin update"
  on storage.objects for update
  using (bucket_id = 'category-images' and public.is_admin());

create policy "category images admin delete"
  on storage.objects for delete
  using (bucket_id = 'category-images' and public.is_admin());
