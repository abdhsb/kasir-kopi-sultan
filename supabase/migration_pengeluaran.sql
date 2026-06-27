-- Migration: pengeluaran mendadak
-- Jalankan ini di SQL Editor Supabase jika project sudah pernah menjalankan schema.sql versi lama

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  cashier_id uuid references profiles (id) on delete set null,
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;

create policy "expenses_select_own_or_admin" on expenses
  for select using (cashier_id = auth.uid() or is_admin (auth.uid()));
create policy "expenses_insert_self" on expenses
  for insert with check (cashier_id = auth.uid());
create policy "expenses_delete_own_or_admin" on expenses
  for delete using (cashier_id = auth.uid() or is_admin (auth.uid()));
