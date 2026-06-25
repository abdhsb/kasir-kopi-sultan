-- Skema database untuk Kasir Kopi Sultan
-- Jalankan di Supabase SQL Editor

-- Role pengguna disimpan di tabel profiles, terhubung ke auth.users
create type user_role as enum ('admin', 'kasir');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role user_role not null default 'kasir',
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories (id) on delete set null,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  stock integer not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create type transaction_status as enum ('paid', 'cancelled');
create type payment_method as enum ('cash', 'qris', 'debit');

create table transactions (
  id uuid primary key default gen_random_uuid(),
  cashier_id uuid references profiles (id) on delete set null,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  total numeric(12, 2) not null check (total >= 0),
  payment_method payment_method not null default 'cash',
  cash_received numeric(12, 2),
  status transaction_status not null default 'paid',
  created_at timestamptz not null default now()
);

create table transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions (id) on delete cascade,
  product_id uuid not null references products (id),
  product_name text not null,
  price numeric(12, 2) not null,
  quantity integer not null check (quantity > 0),
  subtotal numeric(12, 2) not null
);

-- Helper untuk cek role admin dari dalam policy tanpa rekursi RLS
create function is_admin (uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = uid and role = 'admin'
  );
$$;

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;

-- profiles: semua user login bisa baca profilnya sendiri & admin baca semua
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin (auth.uid()));
create policy "profiles_update_admin" on profiles
  for update using (is_admin (auth.uid()));
create policy "profiles_insert_admin" on profiles
  for insert with check (is_admin (auth.uid()));

-- categories & products: semua user login bisa baca, hanya admin bisa ubah
create policy "categories_select_authenticated" on categories
  for select using (auth.uid() is not null);
create policy "categories_write_admin" on categories
  for all using (is_admin (auth.uid())) with check (is_admin (auth.uid()));

create policy "products_select_authenticated" on products
  for select using (auth.uid() is not null);
create policy "products_write_admin" on products
  for all using (is_admin (auth.uid())) with check (is_admin (auth.uid()));

-- transactions: kasir hanya bisa insert/lihat transaksi miliknya, admin lihat semua
create policy "transactions_select_own_or_admin" on transactions
  for select using (cashier_id = auth.uid() or is_admin (auth.uid()));
create policy "transactions_insert_self" on transactions
  for insert with check (cashier_id = auth.uid());
create policy "transactions_update_admin" on transactions
  for update using (is_admin (auth.uid()));
create policy "transactions_delete_admin" on transactions
  for delete using (is_admin (auth.uid()));
create policy "transactions_delete_own" on transactions
  for delete using (cashier_id = auth.uid());

create policy "transaction_items_select_via_transaction" on transaction_items
  for select using (
    exists (
      select 1 from transactions t
      where t.id = transaction_items.transaction_id
        and (t.cashier_id = auth.uid() or is_admin (auth.uid()))
    )
  );
create policy "transaction_items_insert_via_transaction" on transaction_items
  for insert with check (
    exists (
      select 1 from transactions t
      where t.id = transaction_items.transaction_id
        and t.cashier_id = auth.uid()
    )
  );

-- Saat user baru daftar lewat Supabase Auth, otomatis buat profile (default kasir)
create function handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), 'kasir');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user ();

-- Storage bucket untuk foto produk
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
