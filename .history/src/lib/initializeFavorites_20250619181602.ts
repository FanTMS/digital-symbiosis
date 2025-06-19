import { supabase } from './supabase';

// Функция для создания таблицы favorites и настройки прав доступа
export async function initializeFavorites() {
  try {
    // Проверяем, существует ли таблица
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'favorites');

    if (!tables || tables.length === 0) {
      console.log('Таблица favorites не найдена, создаем...');
      
      // Создаем таблицу через SQL
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.favorites (
            id SERIAL PRIMARY KEY,
            user_id integer NOT NULL,
            service_id uuid NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now(),
            UNIQUE(user_id, service_id)
          );
          
          CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);
          CREATE INDEX IF NOT EXISTS favorites_service_id_idx ON public.favorites(service_id);
          
          ALTER TABLE public.favorites DISABLE ROW LEVEL SECURITY;
          
          GRANT ALL ON public.favorites TO anon;
          GRANT ALL ON public.favorites TO authenticated;
          GRANT USAGE, SELECT ON SEQUENCE favorites_id_seq TO anon;
          GRANT USAGE, SELECT ON SEQUENCE favorites_id_seq TO authenticated;
        `
      });

      if (error) {
        console.error('Ошибка создания таблицы favorites:', error);
      } else {
        console.log('Таблица favorites успешно создана');
      }
    } else {
      console.log('Таблица favorites уже существует');
      
      // Убеждаемся, что права доступа настроены правильно
      const { error: permError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE public.favorites DISABLE ROW LEVEL SECURITY;
          GRANT ALL ON public.favorites TO anon;
          GRANT ALL ON public.favorites TO authenticated;
          GRANT USAGE, SELECT ON SEQUENCE favorites_id_seq TO anon;
          GRANT USAGE, SELECT ON SEQUENCE favorites_id_seq TO authenticated;
        `
      });

      if (permError) {
        console.error('Ошибка настройки прав доступа:', permError);
      } else {
        console.log('Права доступа настроены');
      }
    }
  } catch (error) {
    console.error('Ошибка инициализации favorites:', error);
  }
}

// Альтернативный способ - простое добавление/удаление через fetch
export async function addToFavoritesViaAPI(userId: number, serviceId: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        service_id: serviceId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка добавления в избранное через API:', error);
    throw error;
  }
}

export async function removeFromFavoritesViaAPI(userId: number, serviceId: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/favorites?user_id=eq.${userId}&service_id=eq.${serviceId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('Ошибка удаления из избранного через API:', error);
    throw error;
  }
} 