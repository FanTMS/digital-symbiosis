-- Добавление таблицы предложений по цене (торг)
create table if not exists public.price_proposals (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  from_user_id bigint references public.users(id) on delete cascade,
  to_user_id bigint references public.users(id) on delete cascade,
  proposed_price integer not null,
  status text not null default 'pending', -- pending, accepted, rejected
  created_at timestamptz not null default now()
);

-- Добавление диапазона цен для услуг и заказов
alter table public.services add column if not exists min_price integer;
alter table public.orders add column if not exists max_price integer;

-- Индексы для быстрого поиска
create index if not exists idx_price_proposals_order_id on public.price_proposals(order_id);
create index if not exists idx_price_proposals_from_user_id on public.price_proposals(from_user_id);
create index if not exists idx_price_proposals_to_user_id on public.price_proposals(to_user_id); 