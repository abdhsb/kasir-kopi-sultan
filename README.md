# Kasir Kopi Sultan

Aplikasi kasir (POS) untuk Kopi Sultan, dibangun dengan Next.js (App Router) dan Supabase, siap deploy ke Vercel.

## Fitur

- Login dengan Supabase Auth, role `admin` dan `kasir`.
- Halaman kasir: pilih produk per kategori, keranjang, diskon (persen/nominal), metode pembayaran (cash/qris/debit), hitung kembalian, cetak struk, simpan transaksi & potong stok otomatis.
- Admin: kelola produk (CRUD + stok + foto), tambah pengguna baru & atur role, laporan transaksi (filter per kasir + detail & cetak ulang struk) & total penjualan harian.
- Row Level Security di Supabase: kasir hanya melihat transaksinya sendiri, admin melihat semua data.

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi file `supabase/schema.sql` untuk membuat tabel, role, RLS policy, trigger pembuatan profile otomatis, dan storage bucket `products` untuk foto produk. Jika project Supabase sudah ada sebelumnya (sudah pernah jalankan versi lama `schema.sql`), jalankan juga `supabase/migration_diskon_foto.sql` untuk menambahkan kolom diskon & bucket foto produk.
3. Buka **Authentication > Providers**, pastikan Email/Password aktif.
4. Buat user pertama lewat **Authentication > Users > Add user**, lalu di tabel `profiles`, ubah `role` user tersebut menjadi `admin` (lewat SQL editor: `update profiles set role = 'admin' where id = '<user-id>';`). User berikutnya bisa ditambahkan langsung dari halaman **Pengguna** di aplikasi (admin bisa membuat akun kasir/admin baru tanpa perlu masuk ke Supabase Dashboard).
5. Ambil `Project URL`, `anon public key`, dan `service_role key` dari **Project Settings > API**. `service_role key` dipakai server-side untuk membuat user baru lewat halaman Pengguna — jangan pernah expose key ini ke browser/client.

## 2. Konfigurasi environment

Salin `.env.local.example` menjadi `.env.local` dan isi dengan kredensial Supabase:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Jalankan secara lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), akan diarahkan ke halaman login.

## 4. Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Di [vercel.com](https://vercel.com), import repository.
3. Tambahkan environment variable `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di **Project Settings > Environment Variables**.
4. Deploy.

## Struktur data

Lihat `supabase/schema.sql` untuk detail tabel: `profiles`, `categories`, `products`, `transactions` (termasuk kolom `subtotal` dan `discount`), `transaction_items`, serta storage bucket `products` untuk foto produk.
