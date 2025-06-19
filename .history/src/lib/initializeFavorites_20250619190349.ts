import { supabase } from './supabase';

// Простые функции для работы с избранным через прямой API
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