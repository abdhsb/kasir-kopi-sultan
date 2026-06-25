alter table transactions alter column cashier_id drop not null;
alter table transactions drop constraint if exists transactions_cashier_id_fkey;
alter table transactions
  add constraint transactions_cashier_id_fkey
  foreign key (cashier_id) references profiles (id) on delete set null;
