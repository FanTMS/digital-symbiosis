BEGIN;

-- Сохраняем существующие политики безопасности строк для таблицы users
DO $$
DECLARE
    policies RECORD;
BEGIN
    FOR policies IN 
        SELECT policyname, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policies.policyname);
    END LOOP;
END
$$;

-- Обновляем тип данных первичного ключа в таблице users
ALTER TABLE public.users
  ALTER COLUMN id TYPE bigint;

-- Обновляем тип данных в таблице users для поля credits и locked_credits
ALTER TABLE public.users
  ALTER COLUMN credits TYPE numeric,
  ALTER COLUMN locked_credits TYPE numeric;

-- Обновляем значения credits для пользователей, у которых они равны NULL
UPDATE public.users
SET credits = 0
WHERE credits IS NULL;

-- Обновляем значения locked_credits для пользователей, у которых они равны NULL
UPDATE public.users
SET locked_credits = 0
WHERE locked_credits IS NULL;

-- Добавляем ограничение NOT NULL для credits и locked_credits
ALTER TABLE public.users
  ALTER COLUMN credits SET NOT NULL,
  ALTER COLUMN locked_credits SET NOT NULL;

-- Восстанавливаем политику "Users can update themselves"
CREATE POLICY "Users can update themselves" ON public.users
    FOR UPDATE
    USING (auth.uid() = auth_uid OR auth.uid() IN (SELECT auth_uid FROM public.users WHERE role = 'admin'))
    WITH CHECK (auth.uid() = auth_uid OR auth.uid() IN (SELECT auth_uid FROM public.users WHERE role = 'admin'));

-- Восстанавливаем политику "Users can read all profiles"
CREATE POLICY "Users can read all profiles" ON public.users
    FOR SELECT
    USING (true);

COMMIT;