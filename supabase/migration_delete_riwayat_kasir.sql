create policy "transactions_delete_own" on transactions
  for delete using (cashier_id = auth.uid());
