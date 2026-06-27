-- Migration: bukti pembayaran QRIS
-- Jalankan ini di SQL Editor Supabase jika project sudah pernah menjalankan schema.sql versi lama

alter table transactions
  add column if not exists payment_proof_url text;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

create policy "payment_proofs_read_authenticated" on storage.objects
  for select using (bucket_id = 'payment-proofs' and auth.uid() is not null);
create policy "payment_proofs_insert_authenticated" on storage.objects
  for insert with check (bucket_id = 'payment-proofs' and auth.uid() is not null);
