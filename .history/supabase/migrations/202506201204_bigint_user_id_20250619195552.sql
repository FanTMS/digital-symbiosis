BEGIN;

-- 0. Отключаем RLS и удаляем политики, чтобы не мешали изменению типа
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Сохраняем список существующих политик, чтобы потом восстановить
-- В Supabase обычно есть одна политика для пользователей
DROP POLICY IF EXISTS "Users can view themselves" ON public.users;
DROP POLICY IF EXISTS "Users can update themselves" ON public.users;

-- 1. Меняем тип id в users на bigint
ALTER TABLE public.users
    ALTER COLUMN id TYPE bigint USING id::bigint;

-- 2. Обновляем все внешние ключи/колонки ссылающиеся на users.id === bigint
ALTER TABLE public.services ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE public.favorites ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE public.orders ALTER COLUMN client_id TYPE bigint USING client_id::bigint;
ALTER TABLE public.orders ALTER COLUMN provider_id TYPE bigint USING provider_id::bigint;
ALTER TABLE public.reviews ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE public.user_badges ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE public.referrals ALTER COLUMN referrer_id TYPE bigint USING referrer_id::bigint;
ALTER TABLE public.referrals ALTER COLUMN referred_id TYPE bigint USING referred_id::bigint;
ALTER TABLE public.price_proposals ALTER COLUMN from_user_id TYPE bigint USING from_user_id::bigint;
ALTER TABLE public.price_proposals ALTER COLUMN to_user_id TYPE bigint USING to_user_id::bigint;
ALTER TABLE public.challenge_submissions ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE public.challenge_comments ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
ALTER TABLE public.challenge_votes ALTER COLUMN voter_id TYPE bigint USING voter_id::bigint;
ALTER TABLE public.challenge_reports ALTER COLUMN user_id TYPE bigint USING user_id::bigint;

-- 3. Обновляем последовательность, если используется SERIAL / IDENTITY
DO $$
DECLARE seq text;
BEGIN
  SELECT pg_get_serial_sequence('public.users','id') INTO seq;
  IF seq IS NOT NULL THEN
    EXECUTE format('ALTER SEQUENCE %I AS bigint', seq);
  END IF;
END $$;

-- 4. Создаём политики заново (минимально необходимые)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Пользователь может видеть только себя
CREATE POLICY "Users can view themselves" ON public.users
  FOR SELECT USING ( id = NULLIF(current_setting('app.current_user_id', true), '')::bigint );

-- Пользователь может обновлять только себя
CREATE POLICY "Users can update themselves" ON public.users
  FOR UPDATE USING ( id = NULLIF(current_setting('app.current_user_id', true), '')::bigint );

COMMIT; 