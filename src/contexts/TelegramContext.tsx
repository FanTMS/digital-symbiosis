import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { WebApp } from '@twa-dev/sdk';

interface TelegramContextType {
  tg: WebApp | null;
  user: any | null;
  ready: boolean;
}

export const TelegramContext = createContext<TelegramContextType>({
  tg: null,
  user: null,
  ready: false,
});

interface TelegramProviderProps {
  children: ReactNode;
}

export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const [tg, setTg] = useState<WebApp | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    // Access the Telegram WebApp object
    const webApp = window.Telegram?.WebApp;

    if (webApp) {
      setTg(webApp);
      
      // Get user data if available
      if (webApp.initDataUnsafe?.user) {
        setUser(webApp.initDataUnsafe.user);
      }
      
      setReady(true);
    } else {
      // For development without Telegram
      console.warn('Telegram WebApp is not available. Running in development mode.');
      setUser({
        id: 12345678,
        first_name: 'Development',
        last_name: 'User',
        username: 'dev_user',
        language_code: 'en',
      });
      setReady(true);
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ tg, user, ready }}>
      {children}
    </TelegramContext.Provider>
  );
};