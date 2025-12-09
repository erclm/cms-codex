-- Create product-images bucket if missing
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to product-images
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'product_images_insert_authenticated'
  ) then
    create policy product_images_insert_authenticated on storage.objects
      for insert
      with check (
        bucket_id = 'product-images' and auth.role() = 'authenticated'
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'product_images_select_public'
  ) then
    create policy product_images_select_public on storage.objects
      for select
      using (bucket_id = 'product-images');
  end if;
end $$;
