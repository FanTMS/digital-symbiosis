const TELEGRAM_BOT_TOKEN = 'ТВОЙ_ТОКЕН_БОТА';
const TELEGRAM_CHAT_ID = 'ТВОЙ_CHAT_ID';

export async function logErrorToTelegram(error: any, context: string = '') {
    const message = [
        '🚨 Ошибка в приложении!',
        context && `Контекст: ${context}`,
        `Сообщение: ${error?.message || error}`,
        error?.stack && `Stack: ${error.stack}`,
        `Время: ${new Date().toLocaleString()}`
    ].filter(Boolean).join('\n');

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (e) {
        // Если даже логирование не сработало — просто молчим
    }
} 