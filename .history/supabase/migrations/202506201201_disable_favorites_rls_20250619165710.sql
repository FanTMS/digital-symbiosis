BEGIN;

-- Временно отключаем RLS для таблицы favorites
ALTER TABLE public.favorites DISABLE ROW LEVEL SECURITY;

-- Удаляем все политики
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

COMMIT; 