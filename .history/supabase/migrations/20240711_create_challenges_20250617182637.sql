-- Таблица челленджей
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  prize text,
  status text not null default 'active', -- active, voting, finished
  ends_at timestamptz not null,
  sponsor_id bigint references public.users(id),
  created_at timestamptz not null default now()
);

-- Таблица работ участников
create table if not exists public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  user_id bigint references public.users(id) on delete cascade,
  file_url text,
  comment text,
  status text not null default 'pending', -- pending, approved, rejected
  created_at timestamptz not null default now()
);

-- Таблица голосов (анонимно)
create table if not exists public.challenge_votes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.challenge_submissions(id) on delete cascade,
  voter_id bigint references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(submission_id, voter_id)
);

-- Таблица комментариев к работам
create table if not exists public.challenge_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.challenge_submissions(id) on delete cascade,
  user_id bigint references public.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- Таблица жалоб на работы
create table if not exists public.challenge_reports (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.challenge_submissions(id) on delete cascade,
  user_id bigint references public.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

-- Таблица спонсоров челленджей
create table if not exists public.challenge_sponsors (
  id uuid primary key default gen_random_uuid(),
  user_id bigint references public.users(id) on delete cascade,
  name text,
  logo_url text
);

-- Таблица наград за челленджи
create table if not exists public.challenge_awards (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  user_id bigint references public.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

-- Баллы активности за участие в челленджах
alter table public.users add column if not exists challenge_points integer default 0; 