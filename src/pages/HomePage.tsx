import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTelegram } from "../hooks/useTelegram";
import { Search, TrendingUp, Award, Gift, Plus, Bell } from "lucide-react";
import { notificationsApi } from "../lib/api/notifications";
import { supabase } from "../lib/supabase";
import ServiceCard from "../components/ui/ServiceCard";
import type { ServiceWithUser } from "../types/models";
import BalanceTopupBar from "../components/ui/BalanceTopupBar";
import PromoBanner from "../components/ui/PromoBanner";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tg } = useTelegram();
  const [recommendedServices, setRecommendedServices] = useState<
    ServiceWithUser[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({
    users: 0,
    completedOrders: 0,
    categories: 0,
    avgRating: 0,
  });
  const [promoBanner, setPromoBanner] = useState<any>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("services")
        .select("*, user:users!services_user_id_fkey(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (!error && data) {
        setRecommendedServices(data);
      }
      setLoading(false);
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (tg) {
      tg.MainButton.hide();

      // Set header color and title
      tg.setHeaderColor("#0BBBEF");

      const defaultTitle = document.querySelector("[data-default]");
      if (defaultTitle) {
        document.title = "WL Blend";
      }
    }
  }, [tg]);

  useEffect(() => {
    if (user?.id) {
      notificationsApi.listUserNotifications(user.id).then((list) => {
        setUnreadCount(list.filter((n) => !n.read).length);
      });
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchStats = async () => {
      // Количество пользователей
      const { count: usersCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      // Количество завершённых заказов
      const { count: completedOrdersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      // Категории услуг (уникальные)
      const { data: categoriesData } = await supabase
        .from("services")
        .select("category");
      const uniqueCategories = Array.from(
        new Set((categoriesData || []).map((s: any) => s.category)),
      );

      // Средний рейтинг по всем пользователям
      const { data: usersData } = await supabase.from("users").select("rating");
      let avgRating = 0;
      if (usersData && usersData.length > 0) {
        const ratings = usersData
          .map((u: any) => Number(u.rating))
          .filter((r: number) => !isNaN(r) && r > 0);
        avgRating =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;
      }

      setStats({
        users: usersCount || 0,
        completedOrders: completedOrdersCount || 0,
        categories: uniqueCategories.length,
        avgRating: avgRating || 0,
      });
    };
    fetchStats();
  }, []);

  useEffect(() => {
    // Загружаем промо-баннер
    const fetchPromoBanner = async () => {
      const { data, error } = await supabase
        .from("promo_banners")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      if (!error && data) setPromoBanner(data);
    };
    fetchPromoBanner();
  }, []);

  const handleCreateService = () => {
    navigate("/create-service");
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="pb-16 pt-2 sm:pb-20 sm:pt-4">
      {/* Промо-баннер */}
      <div className="px-2 sm:px-4 mb-4">
        {promoBanner && (
          <>
            <PromoBanner
              title={promoBanner.title}
              text={promoBanner.text}
              image={promoBanner.image_url}
              color={promoBanner.color}
              onClick={() => setShowPromoModal(true)}
            />
            <Modal isOpen={showPromoModal} onClose={() => setShowPromoModal(false)}>
              <div className="p-4" style={{ background: promoBanner.color || undefined }}>
                {promoBanner.image_url && (
                  <img src={promoBanner.image_url} alt={promoBanner.title} className="w-32 h-32 object-cover rounded-xl mx-auto mb-4" />
                )}
                <h2 className="text-2xl font-bold mb-2 text-center">{promoBanner.title}</h2>
                <div className="text-base text-gray-700 mb-4 text-center">{promoBanner.text}</div>
                <Button className="mt-2 mx-auto block" variant="primary" onClick={() => setShowPromoModal(false)}>Закрыть</Button>
              </div>
            </Modal>
          </>
        )}
      </div>

      {/* Header */}
      <div className="px-2 sm:px-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
          <div className="flex items-center gap-3 mb-1">
            <img
              src="/logo.svg"
              alt="WL Blend"
              className="w-10 h-10 hidden sm:block"
            />

            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent drop-shadow-sm tracking-tight animate-fade-in">
              WL Blend
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            <button
              className="relative p-2 bg-gray-100 rounded-full self-end"
              onClick={() => navigate("/notifications")}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ minWidth: 16, minHeight: 16, padding: "0 4px" }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="w-full sm:w-auto">
              <div className="relative flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 border border-cyan-200 min-w-[220px]">
                <img
                  src="/logo.svg"
                  alt="WL Blend"
                  className="w-8 h-8 mr-2 hidden sm:block"
                />

                <div className="flex-1">
                  <div className="text-xs text-gray-500 font-medium mb-0.5">
                    Баланс
                  </div>
                  <div className="text-2xl font-extrabold text-cyan-600 drop-shadow-sm">
                    {user && "credits" in user ? (user as any).credits : 0}{" "}
                    <span className="text-base font-semibold text-gray-500">
                      кредитов
                    </span>
                  </div>
                </div>
                <button
                  className="ml-2 px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-bold shadow hover:from-cyan-500 hover:to-blue-600 transition text-sm"
                  onClick={() => {
                    const btn = document.querySelector(
                      ".balance-topup-bar button",
                    );
                    if (btn && btn instanceof HTMLButtonElement) btn.click();
                  }}
                >
                  Пополнить
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div
          className="relative bg-gray-100 rounded-lg p-2 sm:p-3 flex items-center cursor-pointer"
          onClick={() => navigate("/services")}
        >
          <Search size={18} className="text-gray-500 mr-2" />
          <span className="text-gray-500 text-sm sm:text-base">
            Поиск услуг и специалистов...
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="px-2 sm:px-4 mb-4 sm:mb-6"
      >
        <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
          Быстрые действия
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <motion.div
            variants={item}
            whileTap={{ scale: 0.95 }}
            className="bg-primary-50 p-4 rounded-lg border border-primary-100"
            onClick={() => navigate("/services")}
          >
            <Search size={24} className="text-primary-500 mb-2" />

            <h3 className="font-medium">Найти услугу</h3>
            <p className="text-xs text-gray-500">Выберите из каталога</p>
          </motion.div>

          <motion.div
            variants={item}
            whileTap={{ scale: 0.95 }}
            className="bg-accent-50 p-4 rounded-lg border border-accent-100"
            onClick={handleCreateService}
          >
            <Plus size={24} className="text-accent-500 mb-2" />

            <h3 className="font-medium">Предложить услугу</h3>
            <p className="text-xs text-gray-500">Поделитесь навыками</p>
          </motion.div>

          <motion.div
            variants={item}
            whileTap={{ scale: 0.95 }}
            className="bg-green-50 p-4 rounded-lg border border-green-100"
            onClick={() => navigate("/referrals")}
          >
            <Gift size={24} className="text-green-500 mb-2" />

            <h3 className="font-medium">Пригласить друга</h3>
            <p className="text-xs text-gray-500">+5 кредитов за каждого</p>
          </motion.div>

          <motion.div
            variants={item}
            whileTap={{ scale: 0.95 }}
            className="bg-amber-50 p-4 rounded-lg border border-amber-100"
            onClick={() => navigate("/profile")}
          >
            <Award size={24} className="text-amber-500 mb-2" />

            <h3 className="font-medium">Мои достижения</h3>
            <p className="text-xs text-gray-500">Проверьте уровень</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Recommended services */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Рекомендации для вас</h2>
          <TrendingUp size={18} className="text-primary-500" />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 animate-pulse h-32 rounded-lg"
              ></div>
            ))}
          </div>
        ) : recommendedServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="text-lg font-medium mb-1">Нет рекомендаций</h3>
            <p className="text-gray-500 mb-4 max-w-xs">
              Пока для вас нет персональных рекомендаций. Попробуйте
              воспользоваться поиском или создайте свою первую услугу!
            </p>
            <button
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-4 py-2 rounded-lg transition"
              onClick={() => navigate("/create-service")}
            >
              Создать услугу
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-3"
          >
            {recommendedServices.map((service) => (
              <motion.div key={service.id} variants={item}>
                <ServiceCard service={service} />
              </motion.div>
            ))}
            <motion.div
              variants={item}
              whileHover={{ y: -2 }}
              onClick={() => navigate("/services")}
              className="flex justify-center items-center p-3 bg-gray-50 rounded-lg text-primary-500 font-medium"
            >
              Показать все услуги
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4">
        <h2 className="text-lg font-semibold mb-3">Статистика платформы</h2>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="grid grid-cols-2 gap-4">
            {stats.users === 0 &&
            stats.completedOrders === 0 &&
            stats.categories === 0 &&
            stats.avgRating === 0 ? (
              // Skeleton
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div className="text-center" key={i}>
                    <div className="h-8 w-16 mx-auto bg-gray-200 rounded mb-2 animate-pulse" />

                    <div className="h-4 w-24 mx-auto bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="contents"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-500">
                    {stats.users}
                  </div>
                  <div className="text-sm text-gray-500">
                    Активных пользователей
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-500">
                    {stats.completedOrders}
                  </div>
                  <div className="text-sm text-gray-500">
                    Завершённых заданий
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {stats.categories}
                  </div>
                  <div className="text-sm text-gray-500">Категорий услуг</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">
                    {stats.avgRating}
                  </div>
                  <div className="text-sm text-gray-500">Средний рейтинг</div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
