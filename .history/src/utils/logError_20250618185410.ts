let isLogging = false;

export async function logErrorToTelegram(error: any, context: string = '') {
    // Предотвращаем бесконечную рекурсию, если логирование само кидает ошибку
    if (isLogging) return;
    isLogging = true;

    const message = [
        '🚨 Ошибка в приложении!',
        context && `Контекст: ${context}`,
        `Сообщение: ${error?.message || error}`,
        error?.stack && `Stack: ${error.stack}`,
        `User-Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'server'}`,
        `Время: ${new Date().toLocaleString('ru-RU')}`
    ].filter(Boolean).join('\n');

    try {
        await fetch('/api/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
    } catch (_) {
        // глушим
    } finally {
        isLogging = false;
    }
} 