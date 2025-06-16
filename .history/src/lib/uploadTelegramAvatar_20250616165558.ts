import { supabase } from './supabase';

export async function uploadTelegramAvatar(telegramPhotoUrl: string, userId: number) {
    // Скачиваем файл через серверный прокси (обход CORS)
    const proxyUrl = `https://digital-symbiosis.onrender.com/api/proxy-telegram-avatar?url=${encodeURIComponent(telegramPhotoUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Не удалось скачать аватар через прокси');
    const blob = await response.blob();

    // Загружаем в Supabase Storage
    const filePath = `user_${userId}/avatar.jpg`;
    const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true });
    if (error) throw error;

    // Получаем публичную ссылку
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
} 