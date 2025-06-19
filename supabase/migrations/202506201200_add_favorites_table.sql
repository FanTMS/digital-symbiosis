BEGIN;

-- Создаем таблицу для избранных услуг
CREATE TABLE IF NOT EXISTS public.favorites (
    id         SERIAL PRIMARY KEY,
    user_id    integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, service_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_service_id_idx ON public.favorites(service_id);
CREATE INDEX IF NOT EXISTS favorites_created_at_idx ON public.favorites(created_at);

-- RLS политики
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если они есть
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

-- Пользователи могут видеть только свои избранные
CREATE POLICY "Users can view their own favorites" ON public.favorites
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::integer);

-- Пользователи могут добавлять в свое избранное
CREATE POLICY "Users can insert their own favorites" ON public.favorites
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true)::integer);

-- Пользователи могут удалять из своего избранного
CREATE POLICY "Users can delete their own favorites" ON public.favorites
    FOR DELETE USING (user_id = current_setting('app.current_user_id', true)::integer);

COMMIT; 