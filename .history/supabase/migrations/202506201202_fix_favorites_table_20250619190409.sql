BEGIN;

-- Удаляем и пересоздаем таблицу favorites с правильными настройками
DROP TABLE IF EXISTS public.favorites CASCADE;

-- Создаем таблицу заново
CREATE TABLE public.favorites (
    id SERIAL PRIMARY KEY,
    user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, service_id)
);

-- Создаем индексы
CREATE INDEX favorites_user_id_idx ON public.favorites(user_id);
CREATE INDEX favorites_service_id_idx ON public.favorites(service_id);
CREATE INDEX favorites_created_at_idx ON public.favorites(created_at);

-- Отключаем RLS для упрощения работы
ALTER TABLE public.favorites DISABLE ROW LEVEL SECURITY;

-- Даем все права анонимным и аутентифицированным пользователям
GRANT ALL ON public.favorites TO anon;
GRANT ALL ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO postgres;

-- Даем права на последовательность
GRANT USAGE, SELECT ON SEQUENCE favorites_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE favorites_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE favorites_id_seq TO postgres;

COMMIT; 