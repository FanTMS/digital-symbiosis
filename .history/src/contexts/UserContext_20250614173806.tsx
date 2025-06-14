import React, { createContext, useContext, useEffect, useState } from "react";
import { useTelegram } from "../hooks/useTelegram";
import { supabase } from "../lib/supabase";
import type { User } from "../types/models";

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

  // Функция для загрузки Telegram-аватарки в Supabase Storage
  const uploadTelegramAvatarToSupabase = async (photoUrl: string, userId: number): Promise<string | null> => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const fileExt = photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `avatars/${userId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return publicUrlData?.publicUrl || null;
    } catch (err) {
      console.error('Ошибка загрузки аватарки:', err);
      return null;
    }
  };

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
            let avatarUrl = telegramUser.photo_url || null;
            // Если есть фото Telegram, загружаем в Supabase Storage
            if (telegramUser.photo_url) {
              const uploadedUrl = await uploadTelegramAvatarToSupabase(telegramUser.photo_url, telegramUser.id);
              if (uploadedUrl) avatarUrl = uploadedUrl;
            }
            const { error: createError } = await supabase.from("users").insert({
              id: telegramUser.id,
              name: [telegramUser.first_name, telegramUser.last_name]
                .filter(Boolean)
                .join(" "),
              username: telegramUser.username || `user_${telegramUser.id}`,
              joined_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              avatar_url: avatarUrl,
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
            setUser(createdUser);
            setError(null);
            return;
          }

          if (userError) throw userError;
          if (!data) throw new Error("User not found");

          // Если у пользователя есть Telegram photo_url, а avatar_url отсутствует или это ссылка на Telegram
          if (telegramUser.photo_url && (!data.avatar_url || data.avatar_url.includes('t.me/i/userpic'))) {
            const uploadedUrl = await uploadTelegramAvatarToSupabase(telegramUser.photo_url, telegramUser.id);
            if (uploadedUrl && uploadedUrl !== data.avatar_url) {
              // Обновляем профиль пользователя
              await supabase.from('users').update({ avatar_url: uploadedUrl }).eq('id', telegramUser.id);
              data.avatar_url = uploadedUrl;
            }
          }

          setUser(data);
          setError(null);
        } catch (err) {
          const error =
            err instanceof Error ? err : new Error("Failed to fetch user");
          console.error("Error fetching user:", error);
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
              setUser(payload.new as User);
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
      setUser(data);
      setError(null);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch user");
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
