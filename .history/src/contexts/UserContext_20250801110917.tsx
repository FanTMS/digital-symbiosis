import React, { createContext, useContext, useEffect, useState } from "react";
import { useTelegram } from "../hooks/useTelegram";
import { supabase } from "../lib/supabase";
import type { User } from "../types/models";
import { logErrorToTelegram } from "../utils/logError";
import { cacheTelegramAvatar } from "../lib/cacheTelegramAvatar";

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
  refetch: async () => { },
});

// Выносим хук useUser в именованный экспорт
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
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
          let { data, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", telegramUser.id)
            .single();

          // Если пользователь не найден, создаём его
          if (userError && userError.code === "PGRST116") {
            const { error: createError } = await supabase.from("users").insert({
              id: telegramUser.id,
              name: [telegramUser.first_name, telegramUser.last_name]
                .filter(Boolean)
                .join(" "),
              username: telegramUser.username || `user_${telegramUser.id}`,
              joined_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            if (createError) throw createError;
            // После создания повторяем запрос
            const { data: createdUser, error: fetchCreatedError } =
              await supabase
                .from("users")
                .select("*")
                .eq("id", telegramUser.id)
                .single();
            if (fetchCreatedError) throw fetchCreatedError;
            // Если avatar_url отсутствует или это ссылка Telegram (t.me) – пробуем кешировать
            if (!createdUser.avatar_url || createdUser.avatar_url.includes('t.me')) {
              const cached = await cacheTelegramAvatar(telegramUser.id);
              if (cached) {
                createdUser = { ...createdUser, avatar_url: cached };
              }
            }
            setUser(createdUser);
            setError(null);
            return;
          }

          if (userError) throw userError;
          if (!data) throw new Error("User not found");

          // Если avatar_url отсутствует или это ссылка Telegram (t.me) – пробуем кешировать
          if (!data.avatar_url || data.avatar_url.includes('t.me')) {
            const cached = await cacheTelegramAvatar(telegramUser.id);
            if (cached) {
              data = { ...data, avatar_url: cached };
            }
          }

          // Если auth_uid отсутствует — записываем текущий uid и перезапрашиваем строку
          if (data && !data.auth_uid) {
            const currentUid = (await supabase.auth.getSession()).data.session?.user.id;
            if (currentUid) {
              await supabase.from('users').update({ auth_uid: currentUid }).eq('id', data.id);
              data = { ...data, auth_uid: currentUid } as any;
            }
          }

          // Поддерживаем старую схему с полями credits_available/credits_locked,
          // но только если поле credits отсутствует или равно null.
          if (data && (data.credits === null || data.credits === undefined) && (data as any).credits_available !== undefined) {
            const ca = Number((data as any).credits_available ?? 0);
            const cl = Number((data as any).credits_locked ?? 0);
            data = { ...data, credits: ca + cl } as any;
          } else if (data && (data.credits === null || data.credits === undefined)) {
            // Гарантируем, что credits никогда не равен null/undefined
            data = { ...data, credits: 0 } as any;
          }

          setUser(prev => ({ ...prev, ...data } as User));
          setError(null);
        } catch (err) {
          const error =
            err instanceof Error ? err : new Error("Failed to fetch user");
          console.error("Error fetching user:", error);
          logErrorToTelegram(error, "UserContext: fetchUser");
          setError(error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      };

      fetchUser();

      // Подписываемся на изменения пользователя в реальном времени
      const userSubscription = supabase
        .channel("user_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "users",
            filter: `id=eq.${telegramUser.id}`,
          },
          (payload) => {
            if (payload.new) {
              // payload.new содержит только новые данные строки.
              // Чтобы не потерять существующие поля (например, credits), мержим с предыдущим состоянием.
              setUser(prev => {
                let merged = { ...prev, ...(payload.new as User) } as User;
                // Поддержка старой схемы credits_available/credits_locked
                if ((merged.credits === null || merged.credits === undefined) && (merged as any).credits_available !== undefined) {
                  const ca = Number((merged as any).credits_available ?? 0);
                  const cl = Number((merged as any).credits_locked ?? 0);
                  merged = { ...merged, credits: ca + cl } as any;
                } else if (merged.credits === null || merged.credits === undefined) {
                  // Если поле credits отсутствует – сохраняем прежнее значение
                  merged = { ...merged, credits: prev?.credits ?? 0 } as any;
                }
                return merged;
              });
            }
          },
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
      supabase
        .from("users")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }, 60000); // раз в минуту
    return () => clearInterval(interval);
  }, [user?.id]);

  // Функция для ручного обновления пользователя
  const refetch = async () => {
    if (!telegramUser?.id) return;
    setLoading(true);
    try {
      const { data, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", telegramUser.id)
        .single();
      if (userError) throw userError;
      // Если avatar_url отсутствует или это ссылка Telegram (t.me) – пробуем кешировать
      if (!data.avatar_url || data.avatar_url.includes('t.me')) {
        const cached = await cacheTelegramAvatar(telegramUser.id);
        if (cached) {
          data = { ...data, avatar_url: cached };
        }
      }
      // Если auth_uid отсутствует — записываем текущий uid и перезапрашиваем строку
      if (data && !data.auth_uid) {
        const currentUid = (await supabase.auth.getSession()).data.session?.user.id;
        if (currentUid) {
          await supabase.from('users').update({ auth_uid: currentUid }).eq('id', data.id);
          data = { ...data, auth_uid: currentUid } as any;
        }
      }
      // Поддерживаем старую схему credits_available/credits_locked,
      // но только если поле credits отсутствует или null
      if (data && (data.credits === null || data.credits === undefined) && (data as any).credits_available !== undefined) {
        const ca = Number((data as any).credits_available ?? 0);
        const cl = Number((data as any).credits_locked ?? 0);
        data = { ...data, credits: ca + cl } as any;
      } else if (data && (data.credits === null || data.credits === undefined)) {
        // Гарантируем, что credits никогда не равен null/undefined
        data = { ...data, credits: 0 } as any;
      }
      setUser(prev => ({ ...prev, ...data } as User));
      setError(null);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch user");
      logErrorToTelegram(error, "UserContext: refetch");
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
