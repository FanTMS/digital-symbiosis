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
import StatsBlock from '../components/ui/StatsBlock';

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
    // Загружаем активный промо-баннер
    const fetchPromoBanner = async () => {
      try {
        const { data, error } = await supabase
          .from("promo_banners")
          .select("*")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1);
        if (error) throw error;
        if (data && data.length > 0) setPromoBanner(data[0]);
        else setPromoBanner(null);
      } catch (e) {
        alert("Ошибка загрузки промо-баннера: " + (e.message || e));
      }
    };
    fetchPromoBanner();
    // Подписка на событие обновления баннера
    const handler = () => fetchPromoBanner();
    window.addEventListener('promoBannerUpdated', handler);
    return () => {
      window.removeEventListener('promoBannerUpdated', handler);
    };
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
    <div className="pb-20 sm:pb-24 pt-2">
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
      <div className="px-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="WL Blend"
              className="w-10 h-10"
            />
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              WL Blend
            </h1>
          </div>
          <div className="flex flex-col items-stretch gap-3 w-full sm:w-auto">
            <button
              className="relative p-2.5 bg-white rounded-xl shadow-card self-end hover:shadow-card-hover transition-shadow duration-200"
              onClick={() => navigate("/notifications")}
            >
              <Bell size={20} className="text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-accent-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="w-full sm:w-auto">
              <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl shadow-card bg-white border border-gray-200">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 font-medium">
                    Баланс
                  </div>
                  <div className="text-2xl font-bold text-primary-600">
                    {user && "credits" in user ? (user as any).credits : 0}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      кредитов
                    </span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const btn = document.querySelector(
                      ".balance-topup-bar button",
                    );
                    if (btn && btn instanceof HTMLButtonElement) btn.click();
                  }}
                >
                  Пополнить
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative bg-white rounded-xl shadow-card p-3 flex items-center cursor-pointer hover:shadow-card-hover transition-all duration-200"
          onClick={() => navigate("/services")}
        >
          <Search size={20} className="text-gray-500 mr-3" />
          <span className="text-gray-500">
            Поиск услуг и специалистов...
          </span>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="px-4 mb-6"
      >
        <h2 className="text-lg font-semibold mb-3">
          Быстрые действия
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            variants={item}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            className="group bg-gradient-to-br from-primary-400 to-primary-600 p-4 sm:p-5 rounded-xl shadow-card cursor-pointer transition-all duration-200 relative overflow-hidden"
            onClick={() => navigate("/services")}
          >
            <div className="absolute right-2 top-2 opacity-20 text-white">
              <Search size={48} className="sm:w-16 sm:h-16" />
            </div>
            <div className="relative z-10">
              <Search size={24} className="text-white mb-2" />
              <h3 className="font-bold text-white text-sm sm:text-base">Найти услугу</h3>
              <p className="text-white/80 text-xs mt-1 hidden sm:block">Выберите из каталога</p>
            </div>
          </motion.div>
          <motion.div
            variants={item}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            className="group bg-gradient-to-br from-accent-400 to-accent-600 p-4 sm:p-5 rounded-xl shadow-card cursor-pointer transition-all duration-200 relative overflow-hidden"
            onClick={handleCreateService}
          >
            <div className="absolute right-2 top-2 opacity-20 text-white">
              <Plus size={48} className="sm:w-16 sm:h-16" />
            </div>
            <div className="relative z-10">
              <Plus size={24} className="text-white mb-2" />
              <h3 className="font-bold text-white text-sm sm:text-base">Предложить услугу</h3>
              <p className="text-white/80 text-xs mt-1 hidden sm:block">Поделитесь навыками</p>
            </div>
          </motion.div>
          <motion.div
            variants={item}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            className="group bg-gradient-to-br from-success-400 to-success-600 p-4 sm:p-5 rounded-xl shadow-card cursor-pointer transition-all duration-200 relative overflow-hidden"
            onClick={() => navigate("/referrals")}
          >
            <div className="absolute right-2 top-2 opacity-20 text-white">
              <Gift size={48} className="sm:w-16 sm:h-16" />
            </div>
            <div className="relative z-10">
              <Gift size={24} className="text-white mb-2" />
              <h3 className="font-bold text-white text-sm sm:text-base">Пригласить друга</h3>
              <p className="text-white/80 text-xs mt-1 hidden sm:block">+5 кредитов за каждого</p>
            </div>
          </motion.div>
          <motion.div
            variants={item}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            className="group bg-gradient-to-br from-warning-400 to-warning-600 p-4 sm:p-5 rounded-xl shadow-card cursor-pointer transition-all duration-200 relative overflow-hidden"
            onClick={() => navigate("/profile")}
          >
            <div className="absolute right-2 top-2 opacity-20 text-white">
              <Award size={48} className="sm:w-16 sm:h-16" />
            </div>
            <div className="relative z-10">
              <Award size={24} className="text-white mb-2" />
              <h3 className="font-bold text-white text-sm sm:text-base">Мои достижения</h3>
              <p className="text-white/80 text-xs mt-1 hidden sm:block">Проверьте уровень</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Recommended services */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Рекомендации для вас</h2>
          <TrendingUp size={20} className="text-primary-500" />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 animate-pulse h-32 rounded-xl"
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
            <Button
              variant="primary"
              onClick={() => navigate("/create-service")}
            >
              Создать услугу
            </Button>
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
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate("/services")}
              className="mt-3"
            >
              Показать все услуги
            </Button>
          </motion.div>
        )}
      </div>

      {/* Новости и акции */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-xl shadow-card p-4 sm:p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
            <Gift size={22} className="text-accent-500" /> Актуальные акции и новости
          </h2>
          <ul className="space-y-3">
            <li className="bg-gray-50 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-semibold text-primary-600">🎉 Приведи друга — получи 5 кредитов!</span>
                <span className="text-gray-600 text-sm">За каждого приглашённого друга вы получаете бонус.</span>
              </div>
            </li>
            <li className="bg-gray-50 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-semibold text-accent-600">🔥 Новые категории услуг!</span>
                <span className="text-gray-600 text-sm">Появились новые направления — IT, языки, дизайн и многое другое.</span>
              </div>
            </li>
            <li className="bg-gray-50 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-semibold text-success-600">💡 Советы по безопасности</span>
                <span className="text-gray-600 text-sm">Никогда не переводите деньги вне платформы — это безопаснее для всех.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-8">
        <h2 className="text-lg font-semibold mb-3">Статистика платформы</h2>
        <StatsBlock stats={stats} loading={stats.users === 0 && stats.completedOrders === 0 && stats.categories === 0 && stats.avgRating === 0} />
      </div>
    </div>
  );
};

export default HomePage;
