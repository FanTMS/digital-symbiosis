import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTelegram } from "./hooks/useTelegram";
import { useUser } from "./contexts/UserContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { logErrorToTelegram } from './utils/logError';

// Pages (ленивый импорт)
const HomePage = lazy(() => import("./pages/HomePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ServiceDetailPage = lazy(() => import("./pages/ServiceDetailPage"));
const CreateServicePage = lazy(() => import("./pages/CreateServicePage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const ReferralsPage = lazy(() => import("./pages/ReferralsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const ChatsPage = lazy(() => import("./pages/ChatsPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const EditOrderPage = lazy(() => import("./pages/EditOrderPage"));
const QuizzesPage = lazy(() => import('./pages/QuizzesPage'));
const QuizCreatePage = lazy(() => import('./pages/QuizCreatePage'));
const QuizEditPage = lazy(() => import('./pages/QuizEditPage'));
const EditServicePage = lazy(() => import('./pages/EditServicePage'));

// Components
import NavigationBar from "./components/ui/NavigationBar";
import LoadingScreen from "./components/ui/LoadingScreen";

class ErrorBoundary extends React.Component<any, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    logErrorToTelegram(error, 'ErrorBoundary');
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: 20 }}>
          <h1>Произошла ошибка!</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { tg, user: telegramUser, error: telegramError } = useTelegram();
  const { loading: userLoading } = useUser();
  const location = useLocation();

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, [tg]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
    // Отключаем prefers-color-scheme: dark
    const style = document.createElement("style");
    style.innerHTML = `@media (prefers-color-scheme: dark) { html, body { background: #fff !important; color: #111 !important; } }`;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
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
    <ErrorBoundary>
      <div className="min-h-screen relative flex flex-col">
        {/* Страховочный белый overlay */}
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            background: "#fff",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* Фоновый градиент с прозрачностью */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 via-teal-100 to-blue-100 opacity-15 pointer-events-none z-0"></div>
        {/* Контент приложения */}
        <div className="relative z-10 flex flex-col min-h-screen text-gray-900">
          <Suspense fallback={<LoadingScreen />}>
            <AnimatePresence mode="wait" initial={false}>
              <Routes location={location} key={location.pathname}>
                <Route path="/auth" element={<AuthPage />} />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <HomePage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/services"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <ServicesPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/services/:id"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <ServiceDetailPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/services/:id/edit"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <EditServicePage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <OrdersPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <ProfilePage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/referrals"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <ReferralsPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <NotificationsPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/create-service"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <CreateServicePage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/chat/:chatId"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <ChatPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/chats"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <ChatsPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/achievements"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <AchievementsPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <AdminDashboardPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <SettingsPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <FavoritesPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/edit-order/:orderId"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <EditOrderPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/quizzes"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <QuizzesPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/quizzes/new"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <QuizCreatePage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/quizzes/:quizId/edit"
                  element={
                    <ProtectedRoute>
                      <PageWrapper>
                        <QuizEditPage />
                      </PageWrapper>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="*"
                  element={
                    <PageWrapper>
                      <NotFoundPage />
                    </PageWrapper>
                  }
                />
              </Routes>
            </AnimatePresence>
          </Suspense>
          <NavigationBar />
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Обёртка для анимации появления/ухода страниц
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-[calc(100vh-72px)]"
    >
      {children}
    </motion.div>
  );
}

export default App;
