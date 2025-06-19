BEGIN;

-- 1. Изменяем тип id в таблице users на bigint
ALTER TABLE public.users
  ALTER COLUMN id TYPE bigint;

-- 2. Обновляем последовательность, если она существует
DO $$
DECLARE
  seq_name text;
BEGIN
  SELECT pg_get_serial_sequence('public.users', 'id') INTO seq_name;
  IF seq_name IS NOT NULL THEN
    -- Приводим тип последовательности к bigint
    ALTER SEQUENCE IF EXISTS seq_name AS bigint;
  END IF;
END $$;

-- 3. Изменяем все внешние ключи на bigint
-- Таблица favorites
ALTER TABLE public.favorites
  ALTER COLUMN user_id TYPE bigint;

-- Таблица services
ALTER TABLE public.services
  ALTER COLUMN user_id TYPE bigint;

-- Таблица orders
ALTER TABLE public.orders
  ALTER COLUMN client_id TYPE bigint,
  ALTER COLUMN provider_id TYPE bigint;

-- Таблица reviews
ALTER TABLE public.reviews
  ALTER COLUMN user_id TYPE bigint;

-- Таблица user_badges
ALTER TABLE public.user_badges
  ALTER COLUMN user_id TYPE bigint;

-- Таблица notifications
ALTER TABLE public.notifications
  ALTER COLUMN user_id TYPE bigint;

-- Таблица referrals
ALTER TABLE public.referrals
  ALTER COLUMN referrer_id TYPE bigint,
  ALTER COLUMN referred_id TYPE bigint;

-- Таблица price_proposals
ALTER TABLE public.price_proposals
  ALTER COLUMN from_user_id TYPE bigint,
  ALTER COLUMN to_user_id TYPE bigint;

-- Таблица challenge_submissions
ALTER TABLE public.challenge_submissions
  ALTER COLUMN user_id TYPE bigint;

-- Таблица challenge_comments
ALTER TABLE public.challenge_comments
  ALTER COLUMN user_id TYPE bigint;

-- Таблица challenge_votes
ALTER TABLE public.challenge_votes
  ALTER COLUMN voter_id TYPE bigint;

-- Таблица challenge_reports
ALTER TABLE public.challenge_reports
  ALTER COLUMN user_id TYPE bigint;

COMMIT; 