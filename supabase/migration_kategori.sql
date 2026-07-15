-- Tambah kategori Minuman dan Cemilan jika belum ada
insert into categories (name)
select 'Minuman'
where not exists (select 1 from categories where lower(name) = 'minuman');

insert into categories (name)
select 'Cemilan'
where not exists (select 1 from categories where lower(name) = 'cemilan');
