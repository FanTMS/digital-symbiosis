import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTelegram } from "./hooks/useTelegram";
import { useUser } from "./contexts/UserContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

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

// Components
import NavigationBar from "./components/ui/NavigationBar";
import LoadingScreen from "./components/ui/LoadingScreen";

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
    return <LoadingScreen data-oid="eirahqq" />;
  }

  // Если есть ошибка Telegram, показываем страницу авторизации
  if (telegramError || !telegramUser) {
    return <AuthPage data-oid="92zn6x8" />;
  }

  return (
    <div className="min-h-screen relative flex flex-col" data-oid="r86i6st">
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
        data-oid="i6tffsf"
      />

      {/* Фоновый градиент с прозрачностью */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-100 via-teal-100 to-blue-100 opacity-15 pointer-events-none z-0"
        data-oid="eee:m-b"
      ></div>
      {/* Контент приложения */}
      <div
        className="relative z-10 flex flex-col min-h-screen text-gray-900"
        data-oid="i5jo:ld"
      >
        <Suspense
          fallback={<LoadingScreen data-oid="-i.69ya" />}
          data-oid="g:n071e"
        >
          <AnimatePresence mode="wait" initial={false} data-oid="2tb-ee9">
            <Routes
              location={location}
              key={location.pathname}
              data-oid="kw__qpf"
            >
              <Route
                path="/auth"
                element={<AuthPage data-oid="k2cl7x1" />}
                data-oid="h32k.d0"
              />

              <Route
                path="/"
                element={
                  <ProtectedRoute data-oid="ryhoop_">
                    <PageWrapper data-oid="ld9-3m-">
                      <HomePage data-oid="jufm1zz" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid=":_0b_2b"
              />

              <Route
                path="/services"
                element={
                  <ProtectedRoute data-oid="ciwsvl.">
                    <PageWrapper data-oid="ktx0owq">
                      <ServicesPage data-oid="ym-kezu" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="7v:t6sk"
              />

              <Route
                path="/services/:id"
                element={
                  <ProtectedRoute data-oid="793_9rn">
                    <PageWrapper data-oid="lq.st9d">
                      <ServiceDetailPage data-oid="5k-zbgd" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="14dpzni"
              />

              <Route
                path="/orders"
                element={
                  <ProtectedRoute data-oid="citqsdm">
                    <PageWrapper data-oid="ygdxouq">
                      <OrdersPage data-oid="yi18pi-" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="1r9aigk"
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute data-oid="xy-9hv2">
                    <PageWrapper data-oid="cei7:0e">
                      <ProfilePage data-oid="_nxg8xv" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="ydq9va6"
              />

              <Route
                path="/referrals"
                element={
                  <ProtectedRoute data-oid="..qt24c">
                    <PageWrapper data-oid="4pdfm0g">
                      <ReferralsPage data-oid="w2qd2np" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="5h8-2f8"
              />

              <Route
                path="/notifications"
                element={
                  <ProtectedRoute data-oid="32sxfsd">
                    <PageWrapper data-oid="jebe47r">
                      <NotificationsPage data-oid="ol-qljh" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="_7ou81b"
              />

              <Route
                path="/create-service"
                element={
                  <ProtectedRoute data-oid="3uzq7j5">
                    <PageWrapper data-oid="8bnx_5n">
                      <CreateServicePage data-oid="kw1vedw" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="0piob1w"
              />

              <Route
                path="/chat/:chatId"
                element={
                  <ProtectedRoute data-oid="drrymdp">
                    <PageWrapper data-oid="s2p_66_">
                      <ChatPage data-oid="919stw5" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="7np0vkw"
              />

              <Route
                path="/chats"
                element={
                  <ProtectedRoute data-oid="9agr_e.">
                    <PageWrapper data-oid="0_ym:ru">
                      <ChatsPage data-oid="b7_4r81" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="2fq83bv"
              />

              <Route
                path="/achievements"
                element={
                  <ProtectedRoute data-oid="u6sdoyh">
                    <PageWrapper data-oid="_g7.qtf">
                      <AchievementsPage data-oid="2do6ngs" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="zifo99v"
              />

              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute data-oid="80wqkx.">
                    <PageWrapper data-oid="nrc7yk:">
                      <AdminDashboardPage data-oid="_rfi:h." />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="d1aw857"
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute data-oid=".0bl0mj">
                    <PageWrapper data-oid="y-1bmpo">
                      <SettingsPage data-oid="kek:h_5" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="-z60vt2"
              />

              <Route
                path="/favorites"
                element={
                  <ProtectedRoute data-oid="ix79rf.">
                    <PageWrapper data-oid="2h9yyf9">
                      <FavoritesPage data-oid="tj_s0lp" />
                    </PageWrapper>
                  </ProtectedRoute>
                }
                data-oid="al2ynmw"
              />

              <Route
                path="*"
                element={
                  <PageWrapper data-oid="hkddyn2">
                    <NotFoundPage data-oid="7_cecta" />
                  </PageWrapper>
                }
                data-oid="gph45x2"
              />
            </Routes>
          </AnimatePresence>
        </Suspense>
        <NavigationBar data-oid="_go-zih" />
      </div>
    </div>
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
      data-oid="dgbi73l"
    >
      {children}
    </motion.div>
  );
}

export default App;
