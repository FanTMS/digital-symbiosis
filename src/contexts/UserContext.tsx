import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { supabase } from '../lib/supabase';
import type { User } from '../types/models';

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  error: null,
  refetch: async () => {},
});

// Выносим хук useUser в именованный экспорт
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user: telegramUser, error: telegramError } = useTelegram();

  useEffect(() => {
    // Если есть ошибка в Telegram авторизации, прокидываем её
    if (telegramError) {
      setError(telegramError);
      setLoading(false);
      return;
    }

    if (telegramUser?.id) {
      const fetchUser = async () => {
        try {
          const { data, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', telegramUser.id)
            .single();

          if (userError) throw userError;
          if (!data) throw new Error('User not found');
          
          setUser(data);
          setError(null);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to fetch user');
          console.error('Error fetching user:', error);
          setError(error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      };

      fetchUser();

      // Подписываемся на изменения пользователя в реальном времени
      const userSubscription = supabase
        .channel('user_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${telegramUser.id}`,
          },
          (payload) => {
            if (payload.new) {
              setUser(payload.new as User);
            }
          }
        )
        .subscribe();

      return () => {
        userSubscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, [telegramUser?.id, telegramError]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      supabase.from('users').update({ updated_at: new Date().toISOString() }).eq('id', user.id);
    }, 60000); // раз в минуту
    return () => clearInterval(interval);
  }, [user?.id]);

  // Функция для ручного обновления пользователя
  const refetch = async () => {
    if (!telegramUser?.id) return;
    setLoading(true);
    try {
      const { data, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', telegramUser.id)
        .single();
      if (userError) throw userError;
      setUser(data);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user');
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, error, refetch }}>
      {children}
    </UserContext.Provider>
  );
} 