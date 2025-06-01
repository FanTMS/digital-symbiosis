-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create tables
create table users (
  id bigint primary key,
  name text not null,
  username text unique not null,
  skills text[] default '{}',
  portfolio text[] default '{}',
  level text,
  rating decimal(3,2) default 0,
  credits integer default 0,
  completed_tasks integer default 0,
  avatar_url text,
  joined_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table badges (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  image_url text,
  created_at timestamp with time zone default now()
);

create table user_badges (
  user_id bigint references users(id) on delete cascade,
  badge_id uuid references badges(id) on delete cascade,
  received_at timestamp with time zone default now(),
  primary key (user_id, badge_id)
);

create table services (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  category text not null,
  price integer not null,
  user_id bigint references users(id) on delete cascade,
  skills text[] default '{}',
  rating decimal(3,2) default 0,
  reviews_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  service_id uuid references services(id) on delete cascade,
  client_id bigint references users(id) on delete cascade,
  provider_id bigint references users(id) on delete cascade,
  status text not null,
  price integer not null,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);

create table reviews (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  user_id bigint references users(id) on delete cascade,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now()
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id bigint references users(id) on delete cascade,
  type text not null,
  message text not null,
  read boolean default false,
  data jsonb default '{}',
  created_at timestamp with time zone default now()
);

create table referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id bigint references users(id) on delete cascade,
  referred_id bigint references users(id) on delete cascade,
  status text not null,
  bonus_received boolean default false,
  created_at timestamp with time zone default now()
);

-- Шаблоны пополнения
create table topup_templates (
  id serial primary key,
  credits integer not null check (credits >= 20),
  price integer not null check (price > 0),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- История пополнений
create table topup_history (
  id uuid primary key default uuid_generate_v4(),
  user_id bigint references users(id) on delete set null,
  template_id integer references topup_templates(id) on delete set null,
  amount integer not null, -- сумма в рублях
  credits integer not null, -- сколько кредитов начислено
  status text not null default 'pending', -- pending, success, failed
  payment_id text, -- id платежа в ЮKassa
  payment_method text, -- например, sbp, card, yoomoney
  created_at timestamp with time zone default now()
);

-- Create indexes
create index idx_services_category on services(category);
create index idx_services_user_id on services(user_id);
create index idx_orders_client_id on orders(client_id);
create index idx_orders_provider_id on orders(provider_id);
create index idx_notifications_user_id on notifications(user_id);
create index idx_reviews_order_id on reviews(order_id);

-- Create RLS policies
alter table users enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table services enable row level security;
alter table orders enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table referrals enable row level security;

-- Users policies
create policy "Users are viewable by everyone"
  on users for select
  using (true);

create policy "Users can update their own profile"
  on users for update
  using (auth.uid()::bigint = id);

-- Services policies
create policy "Services are viewable by everyone"
  on services for select
  using (true);

create policy "Users can create their own services"
  on services for insert
  with check (auth.uid()::bigint = user_id);

create policy "Users can update their own services"
  on services for update
  using (auth.uid()::bigint = user_id);

create policy "Users can delete their own services"
  on services for delete
  using (auth.uid()::bigint = user_id);

-- Orders policies
create policy "Users can view orders they are involved in"
  on orders for select
  using (
    auth.uid()::bigint = client_id or
    auth.uid()::bigint = provider_id
  );

create policy "Users can create orders"
  on orders for insert
  with check (auth.uid()::bigint = client_id);

create policy "Users can update orders they are involved in"
  on orders for update
  using (
    auth.uid()::bigint = client_id or
    auth.uid()::bigint = provider_id
  );

-- Reviews policies
create policy "Reviews are viewable by everyone"
  on reviews for select
  using (true);

create policy "Users can create reviews for their orders"
  on reviews for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = order_id
      and orders.client_id = auth.uid()::bigint
      and orders.status = 'completed'
    )
  );

-- Notifications policies
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid()::bigint = user_id);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid()::bigint = user_id);

-- Referrals policies
create policy "Users can view referrals they are involved in"
  on referrals for select
  using (
    auth.uid()::bigint = referrer_id or
    auth.uid()::bigint = referred_id
  );

-- Create functions
create or replace function update_service_rating()
returns trigger as $$
begin
  update services
  set
    rating = (
      select avg(rating)::decimal(3,2)
      from reviews
      join orders on orders.id = reviews.order_id
      where orders.service_id = new.service_id
    ),
    reviews_count = (
      select count(*)
      from reviews
      join orders on orders.id = reviews.order_id
      where orders.service_id = new.service_id
    )
  where id = (
    select service_id
    from orders
    where id = new.order_id
  );
  return new;
end;
$$ language plpgsql;

create trigger update_service_rating_after_review
  after insert or update
  on reviews
  for each row
  execute function update_service_rating(); 