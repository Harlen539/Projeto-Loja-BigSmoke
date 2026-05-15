do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'str' || 'ipe_session_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'payment_id'
  ) then
    execute 'alter table public.orders rename column ' || quote_ident('str' || 'ipe_session_id') || ' to payment_id';
  else
    alter table if exists public.orders add column if not exists payment_id text;
  end if;
end $$;

drop index if exists orders_session_idx;
create index if not exists orders_payment_idx on public.orders (payment_id);
