import { supabase } from './supabase';

const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN;

/**
 * Скачивает аватар пользователя из Telegram и сохраняет его в Supabase Storage,
 * возвращает публичный URL или null, если не удалось.
 */
export async function cacheTelegramAvatar(telegramUserId: number): Promise<string | null> {
    try {
        if (!BOT_TOKEN) {
            console.warn('BOT_TOKEN is not set, cannot cache avatar');
            return null;
        }

        // 1. Получаем file_id самого крупного фото профиля
        const photosRes = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getUserProfilePhotos?user_id=${telegramUserId}&limit=1`,
        );
        const photosJson = await photosRes.json();
        if (!photosJson.ok || photosJson.result.total_count === 0) return null;
        const fileId: string = photosJson.result.photos[0][0].file_id;

        // 2. Получаем file_path
        const fileRes = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`,
        );
        const fileJson = await fileRes.json();
        if (!fileJson.ok) return null;
        const filePath: string = fileJson.result.file_path;

        // 3. Скачиваем сам файл
        const fileDataRes = await fetch(
            `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`,
        );
        const arrayBuffer = await fileDataRes.arrayBuffer();

        // 4. Загружаем в Storage
        const fileName = `avatars/${telegramUserId}.jpg`;
        const { error: uploadError } = await supabase.storage
            .from('public')
            .upload(fileName, arrayBuffer, {
                cacheControl: '31536000',
                contentType: 'image/jpeg',
                upsert: true,
            });
        if (uploadError) {
            console.error('Supabase upload error', uploadError);
            return null;
        }

        const { publicURL } = supabase.storage.from('public').getPublicUrl(fileName);
        // 5. Записываем в таблицу
        await supabase.from('users').update({ avatar_url: publicURL }).eq('id', telegramUserId);
        return publicURL;
    } catch (err) {
        console.error('cacheTelegramAvatar error', err);
        return null;
    }
} 