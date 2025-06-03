import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useTelegram } from './hooks/useTelegram';
import { useUser } from './contexts/UserContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import CreateServicePage from './pages/CreateServicePage';
import OrdersPage from './pages/OrdersPage';
import ReferralsPage from './pages/ReferralsPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthPage from './pages/AuthPage';
import NotificationsPage from './pages/NotificationsPage';
import ChatPage from './pages/ChatPage';
import ChatsPage from './pages/ChatsPage';
import AchievementsPage from './pages/AchievementsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SettingsPage from './pages/SettingsPage';
import FavoritesPage from './pages/FavoritesPage';

// Components
import NavigationBar from './components/ui/NavigationBar';
import LoadingScreen from './components/ui/LoadingScreen';

function App() {
  const { tg, user: telegramUser, error: telegramError } = useTelegram();
  const { loading: userLoading } = useUser();

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, [tg]);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    // Отключаем prefers-color-scheme: dark
    const style = document.createElement('style');
    style.innerHTML = `@media (prefers-color-scheme: dark) { html, body { background: #fff !important; color: #111 !important; } }`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Показываем загрузку, пока не получим данные пользователя
  if (userLoading) {
    return <LoadingScreen />;
  }

  // Если есть ошибка Telegram, показываем страницу авторизации
  if (telegramError || !telegramUser) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Страховочный белый overlay */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          background: '#fff',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      {/* Фоновый градиент с прозрачностью */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 via-teal-100 to-blue-100 opacity-15 pointer-events-none z-0"></div>
      {/* Контент приложения */}
      <div className="relative z-10 flex flex-col min-h-screen text-gray-900">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            
            <Route path="/services" element={
              <ProtectedRoute>
                <ServicesPage />
              </ProtectedRoute>
            } />
            
            <Route path="/services/:id" element={
              <ProtectedRoute>
                <ServiceDetailPage />
              </ProtectedRoute>
            } />
            
            <Route path="/orders" element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            <Route path="/referrals" element={
              <ProtectedRoute>
                <ReferralsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/create-service" element={
              <ProtectedRoute>
                <CreateServicePage />
              </ProtectedRoute>
            } />
            
            <Route path="/chat/:chatId" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />
            
            <Route path="/chats" element={
              <ProtectedRoute>
                <ChatsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/achievements" element={
              <ProtectedRoute>
                <AchievementsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/admin-dashboard" element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/favorites" element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
        <NavigationBar />
      </div>
    </div>
  );
}

export default App;