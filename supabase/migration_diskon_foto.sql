-- Migration tambahan: diskon transaksi & foto produk
-- Jalankan ini di SQL Editor Supabase jika project sudah pernah menjalankan schema.sql versi lama

alter table transactions
  add column if not exists subtotal numeric(12, 2) not null default 0,
  add column if not exists discount numeric(12, 2) not null default 0;

update transactions set subtotal = total where subtotal = 0;

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "products_images_public_read" on storage.objects
  for select using (bucket_id = 'products');
create policy "products_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'products' and is_admin (auth.uid()));
create policy "products_images_admin_update" on storage.objects
  for update using (bucket_id = 'products' and is_admin (auth.uid()));
create policy "products_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'products' and is_admin (auth.uid()));
