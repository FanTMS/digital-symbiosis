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
    if (process.env.NODE_ENV === 'development' && (!telegram || !telegram.initDataUnsafe?.user)) {
      setTg(DEV_TG);
      setUser(DEV_USER);
      handleAuth(DEV_USER.id, 'mock_init_data');
      return;
    }
    if (telegram && telegram.initDataUnsafe?.user) {
      setTg(telegram);
      setUser(telegram.initDataUnsafe.user);
      let cleanInitData = telegram.initData || '';
      const params = new URLSearchParams(cleanInitData);
      params.delete('signature');
      cleanInitData = params.toString();
      handleAuth(telegram.initDataUnsafe.user.id, cleanInitData);
      return;
    } else {
      setError(new Error('No user data available'));
    }
  }, []);

  // Функция для авторизации пользователя в Supabase
  const handleAuth = async (telegramId: number, initData: string) => {
    try {
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
      // Новый способ: авторизация через backend
      const response = await fetch('https://digital-symbiosis.onrender.com/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData,
          telegramId
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Auth backend error');
      }
      const { access_token, refresh_token } = result;
      if (!access_token || !refresh_token) {
        throw new Error('No tokens from backend');
      }
      const { data: session, error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token
      });
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Failed to set session');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Authentication failed');
      setError(error);
    }
  };

  return { tg, user, error };
}