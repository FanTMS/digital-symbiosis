import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    Telegram: {
      WebApp: typeof WebApp;
    };
  }
}

// Мок данных для режима разработки
const DEV_USER = {
  id: 12345,
  username: 'dev_user',
  first_name: 'Dev',
  last_name: 'User',
  photo_url: 'https://placehold.co/100x100'
};

const DEV_TG = {
  ready: () => {},
  expand: () => {},
  close: () => {},
  enableClosingConfirmation: () => {},
  MainButton: {
    show: () => {},
    hide: () => {},
    onClick: () => {}
  },
  BackButton: {
    show: () => {},
    hide: () => {},
    onClick: () => {},
    offClick: () => {}
  },
  setHeaderColor: () => {},
  showAlert: (message: string) => alert(message),
  initData: 'mock_init_data',
  initDataUnsafe: {
    user: DEV_USER,
    start_param: 'dev'
  }
};

export function useTelegram() {
  const [tg, setTg] = useState<typeof DEV_TG | typeof WebApp | null>(null);
  const [user, setUser] = useState<{
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const telegram = window.Telegram?.WebApp;
    console.log('window.Telegram:', window.Telegram);
    console.log('window.Telegram?.WebApp:', telegram);
    console.log('window.Telegram?.WebApp?.initDataUnsafe:', telegram?.initDataUnsafe);

    if (process.env.NODE_ENV === 'development' && (!telegram || !telegram.initDataUnsafe?.user)) {
      console.warn('DEV MODE: Подставляем тестового пользователя');
      setTg(DEV_TG);
      setUser(DEV_USER);
      handleAuth(DEV_USER.id, 'mock_init_data');
      return;
    }

    if (telegram && telegram.initDataUnsafe?.user) {
      setTg(telegram);
      setUser(telegram.initDataUnsafe.user);
      handleAuth(telegram.initDataUnsafe.user.id, telegram.initData || '');
    } else {
      setError(new Error('No user data available'));
    }
  }, []);

  // Функция для авторизации пользователя в Supabase
  const handleAuth = async (telegramId: number, initData: string) => {
    try {
      // В режиме разработки пропускаем проверку подписи
      if (process.env.NODE_ENV === 'development') {
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', telegramId)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          throw userError;
        }

        if (!existingUser) {
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: telegramId,
              name: [DEV_USER.first_name, DEV_USER.last_name].filter(Boolean).join(' '),
              username: DEV_USER.username || `user_${telegramId}`,
              joined_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              avatar_url: DEV_USER.photo_url
            });

          if (createError) {
            throw createError;
          }
        }
        return;
      }

      // Для production используем стандартную авторизацию
      const { data, error } = await supabase.rpc('authenticate_telegram', {
        init_data: initData,
        user_id: telegramId
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.message || 'Authentication failed');
      }

      // После успешной авторизации — создаём/обновляем профиль пользователя с валидными полями
      if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const tgUser = tg.initDataUnsafe.user;
        const { error: upsertError } = await supabase.from('users').upsert({
          id: tgUser.id,
          name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
          username: tgUser.username || `user_${tgUser.id}`,
          avatar_url: tgUser.photo_url || null,
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          level: 'ПОЛЬЗОВАТЕЛЬ',
          rating: 0,
          credits: 0,
          completed_tasks: 0
        }, { onConflict: 'id' });
        if (upsertError) throw upsertError;
      }

      const { data: session, error: sessionError } = await supabase.auth.setSession({
        access_token: data.session_id,
        refresh_token: data.session_id
      });

      if (sessionError) throw sessionError;
      if (!session) throw new Error('Failed to set session');

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Authentication failed');
      console.error('Auth error:', error);
      setError(error);
    }
  };

  return { tg, user, error };
}