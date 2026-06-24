create policy "transactions_delete_admin" on transactions
  for delete using (is_admin (auth.uid()));
