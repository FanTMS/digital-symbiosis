export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';

if (!API_URL && typeof console !== 'undefined') {
    console.warn('[config] VITE_API_URL не задан, API_URL будет пустым');
} 