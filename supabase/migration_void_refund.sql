-- Migration tambahan: void/refund transaksi
-- Jalankan ini di SQL Editor Supabase jika project sudah pernah menjalankan schema.sql versi lama

create policy "transactions_update_admin" on transactions
  for update using (is_admin (auth.uid()));
