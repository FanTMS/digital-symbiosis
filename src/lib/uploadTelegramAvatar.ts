import { supabase } from './supabase';

export async function uploadTelegramAvatar(telegramPhotoUrl: string, userId: number) {
    // Скачиваем файл с Telegram CDN
    const response = await fetch(telegramPhotoUrl);
    if (!response.ok) throw new Error('Не удалось скачать аватар с Telegram');
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