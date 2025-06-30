create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  hfd_shipment_number text,
  status text not null default 'created',
  order_id text,
  customer_name text,
  customer_phone text,
  customer_email text,
  shipping_address jsonb,
  shipment_data jsonb,
  hfd_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_shipments_order_id on public.shipments(order_id); 