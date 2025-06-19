BEGIN;

-- Полностью отключаем RLS для таблицы favorites
ALTER TABLE public.favorites DISABLE ROW LEVEL SECURITY;

-- Удаляем все существующие политики
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

-- Даем полные права на таблицу для anon и authenticated
GRANT ALL ON public.favorites TO anon;
GRANT ALL ON public.favorites TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE favorites_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE favorites_id_seq TO authenticated;

COMMIT; 