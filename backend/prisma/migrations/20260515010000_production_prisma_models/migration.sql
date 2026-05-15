create table if not exists public.order_items (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text,
  name text not null default '',
  category text not null default '',
  image text not null default '',
  size text not null default '',
  color text not null default '',
  quantity integer not null default 1,
  price numeric(10,2) not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  provider text not null default 'abacatepay',
  method text not null default 'PIX',
  status text not null default 'pending',
  external_id text,
  amount numeric(10,2) not null default 0,
  qr_code text,
  copy_paste text,
  checkout_url text,
  webhook_payload jsonb,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id text primary key,
  code text not null unique,
  type text not null default 'percent',
  target text not null default 'products',
  value numeric(10,2) not null default 0,
  active boolean not null default true,
  min_order_value numeric(10,2) not null default 0,
  usage_limit integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id text primary key,
  email text not null unique,
  role text not null default 'customer',
  password_hash text,
  first_name text,
  last_name text,
  provider text,
  avatar_url text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists order_number_formatted text;
alter table public.orders add column if not exists order_access_code text;
alter table public.orders add column if not exists payment_status text not null default 'pending';
alter table public.orders add column if not exists payment_method text not null default 'PIX';
alter table public.orders add column if not exists payment_provider text not null default 'abacatepay';
alter table public.orders add column if not exists currency text not null default 'brl';
alter table public.orders add column if not exists amount_subtotal numeric(10,2) not null default 0;
alter table public.orders add column if not exists discount_amount numeric(10,2) not null default 0;
alter table public.orders add column if not exists product_discount_amount numeric(10,2) not null default 0;
alter table public.orders add column if not exists shipping_discount_amount numeric(10,2) not null default 0;
alter table public.orders add column if not exists shipping_label text;
alter table public.orders add column if not exists payment_event_id text;
alter table public.orders add column if not exists tracking_code text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists session_url text;
alter table public.orders add column if not exists hidden_in_admin boolean not null default false;
alter table public.orders add column if not exists payment_confirmed boolean not null default false;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists canceled_at timestamptz;
alter table public.orders add column if not exists inventory_debited_at timestamptz;
alter table public.orders add column if not exists coupon_code text;

update public.orders
set amount_subtotal = coalesce(amount_subtotal, total_amount - shipping_amount),
    payment_method = case
      when nullif(payment_method, '') is not null then payment_method
      when lower(coalesce(data->>'paymentMethod', '')) in ('card', 'cartao', 'credit_card', 'card_checkout') then 'CARD'
      else 'PIX'
    end,
    payment_provider = coalesce(nullif(payment_provider, ''), coalesce(data->>'paymentProvider', 'abacatepay')),
    payment_status = case
      when coalesce(payment_confirmed, false) = true or lower(coalesce(status, '')) in ('paid', 'processing', 'shipped', 'delivered') then 'paid'
      when lower(coalesce(status, '')) in ('canceled', 'cancelled', 'refunded') then 'canceled'
      else 'pending'
    end
where true;

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);
create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_external_id_idx on public.payments (external_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists coupons_active_idx on public.coupons (active);

insert into public.store_settings (key, data)
values ('public', '{"store":{"name":"BigSmoke","whatsapp":"5583986494691","instagram":"@bigsmokestyle","email":"contato@bigsmoke.com.br"}}'::jsonb)
on conflict (key) do nothing;
