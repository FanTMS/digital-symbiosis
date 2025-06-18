import { logErrorToTelegram } from './logError';

// Патчим глобальный fetch, чтобы логировать все сетевые ошибки и неуспешные ответы
(function setupNetworkLogger() {
  if (typeof window === 'undefined' || !window.fetch) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const [input] = args;
    const url = typeof input === 'string' ? input : input.url;
    try {
      const response = await originalFetch(...args);
      if (!response.ok) {
        // Логируем статус, отличный от 2xx
        const message = [
          '❗️ Сбой сетевого запроса',
          `URL: ${url}`,
          `Статус: ${response.status}`,
          `User-Agent: ${navigator.userAgent}`,
          `Время: ${new Date().toLocaleString('ru-RU')}`,
        ].join('\n');
        logErrorToTelegram(message, 'fetch response not ok');
      }
      return response;
    } catch (err: any) {
      // Логируем полный отказ сети / CORS / блокировку
      const message = [
        '❗️ Ошибка выполнения fetch',
        `URL: ${url}`,
        `Сообщение: ${err?.message || err}`,
        `User-Agent: ${navigator.userAgent}`,
        `Время: ${new Date().toLocaleString('ru-RU')}`,
      ].join('\n');
      logErrorToTelegram(message, 'fetch exception');
      throw err;
    }
  };
})(); 