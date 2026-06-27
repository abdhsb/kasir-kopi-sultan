-- Migration: catatan tambahan pada transaksi
-- Jalankan ini di SQL Editor Supabase jika project sudah pernah menjalankan schema.sql versi lama

alter table transactions
  add column if not exists notes text;
