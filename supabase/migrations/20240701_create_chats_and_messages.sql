-- Таблица чатов (диалогов)
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user1_id bigint references public.users(id),
  user2_id bigint references public.users(id),
  created_at timestamptz not null default now()
);

-- Таблица сообщений
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id),
  sender_id bigint references public.users(id),
  content text not null,
  created_at timestamptz not null default now()
); 