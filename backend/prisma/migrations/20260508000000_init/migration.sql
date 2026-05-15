create extension if not exists "pgcrypto";

create table if not exists public.products (
  id          text primary key,
  name        text not null default '',
  category    text not null default '',
  description text not null default '',
  price       numeric(10,2) not null default 0,
  stock       integer not null default 0,
  image       text not null default '',
  sizes       text not null default 'P, M, G, GG',
  badge       text not null default '',
  active      boolean not null default true,
  featured    boolean not null default false,
  colors      jsonb not null default '[]'::jsonb,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.orders (
  id                 text primary key,
  order_number       text,
  status             text not null default 'pending',
  customer_name      text not null default '',
  customer_email     text not null default '',
  customer_phone     text not null default '',
  total_amount       numeric(10,2) not null default 0,
  shipping_amount    numeric(10,2) not null default 0,
  delivery_method    text not null default 'retirada',
  payment_id         text,
  payment_intent_id  text,
  data               jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.order_counters (
  id         text primary key,
  next       integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_updated_at_idx on public.products (updated_at desc);
create index if not exists products_active_idx on public.products (active) where active = true;
create index if not exists products_category_idx on public.products (category);
create index if not exists orders_updated_at_idx on public.orders (updated_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_payment_idx on public.orders (payment_id);
create index if not exists orders_customer_idx on public.orders (customer_email);
create index if not exists orders_number_idx on public.orders (order_number);

insert into public.order_counters (id, next)
values ('orders', 1)
on conflict (id) do nothing;
