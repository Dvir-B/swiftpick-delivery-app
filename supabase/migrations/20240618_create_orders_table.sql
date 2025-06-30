create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  external_id text,
  order_number text not null,
  platform text not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  total_amount numeric,
  currency text,
  weight numeric,
  status text not null default 'pending',
  order_date timestamptz,
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid
);

create index idx_orders_user_id on public.orders(user_id); 