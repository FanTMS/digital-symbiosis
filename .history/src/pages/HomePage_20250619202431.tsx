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
      <div className="px-2 sm:px-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
          <div className="w-full sm:w-auto">
            <div className="relative flex items-center gap-3 px-5 py-3 rounded-xl shadow-card bg-gray-light min-w-[220px]">
              <img
                src="/logo.svg"
                alt="БртЦ"
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
              <Button
                size="sm"
                onClick={() => {
                  const btn = document.querySelector('.balance-topup-bar button');
                  if (btn && btn instanceof HTMLButtonElement) btn.click();
                }}
              >
                Пополнить
              </Button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <motion.div
            variants={item}
            whileTap={{ scale: 0.97 }}
            className="group bg-primary-500/95 p-5 rounded-xl shadow-card cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform duration-200 relative overflow-hidden text-white"
            onClick={() => navigate("/services")}
          >
            <div className="absolute right-4 top-4 opacity-10 text-black text-6xl pointer-events-none select-none">
              <Search size={64} />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Search size={28} className="text-black" />
              <h3 className="font-bold text-gray-800 text-lg">Найти услугу</h3>
            </div>
            <p className="text-gray-500 text-sm">Выберите из каталога</p>
          </motion.div>
          <motion.div
            variants={item}
            whileTap={{ scale: 0.97 }}
            className="group bg-accent-500/95 p-5 rounded-xl shadow-card cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform duration-200 relative overflow-hidden text-white"
            onClick={handleCreateService}
          >
            <div className="absolute right-4 top-4 opacity-10 text-black text-6xl pointer-events-none select-none">
              <Plus size={64} />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Plus size={28} className="text-black" />
              <h3 className="font-bold text-gray-800 text-lg">Предложить услугу</h3>
            </div>
            <p className="text-gray-500 text-sm">Поделитесь своими навыками</p>
          </motion.div>
          <motion.div
            variants={item}
            whileTap={{ scale: 0.97 }}
            className="group bg-success-500/95 p-5 rounded-xl shadow-card cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform duration-200 relative overflow-hidden text-white"
            onClick={() => navigate("/referrals")}
          >
            <div className="absolute right-4 top-4 opacity-10 text-black text-6xl pointer-events-none select-none">
              <Gift size={64} />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Gift size={28} className="text-black" />
              <h3 className="font-bold text-gray-800 text-lg">Пригласить друга</h3>
            </div>
            <p className="text-gray-500 text-sm">+5 кредитов за каждого</p>
          </motion.div>
          <motion.div
            variants={item}
            whileTap={{ scale: 0.97 }}
            className="group bg-warning-500/90 p-5 rounded-xl shadow-card cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform duration-200 relative overflow-hidden text-white"
            onClick={() => navigate("/profile")}
          >
            <div className="absolute right-4 top-4 opacity-10 text-black text-6xl pointer-events-none select-none">
              <Award size={64} />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Award size={28} className="text-black" />
              <h3 className="font-bold text-gray-800 text-lg">Мои достижения</h3>
            </div>
            <p className="text-gray-500 text-sm">Проверьте уровень</p>
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
            <motion.div variants={item} whileHover={{ y: -2 }}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate('/services')}
                className="font-medium"
              >
                Показать все услуги
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Новости и акции */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-cyan-100 via-blue-50 to-pink-100 rounded-2xl shadow-card p-6">
          <h2 className="text-lg font-bold mb-4 text-blue-900 flex items-center gap-2">
            <Gift size={22} className="text-pink-400" /> Актуальные акции и новости
          </h2>
          <ul className="space-y-3">
            <li className="bg-white/80 rounded-xl p-4 shadow flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-semibold text-blue-700">🎉 Приведи друга — получи 5 кредитов!</span>
              <span className="text-gray-500 text-sm">За каждого приглашённого друга вы получаете бонус.</span>
            </li>
            <li className="bg-white/80 rounded-xl p-4 shadow flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-semibold text-pink-600">🔥 Новые категории услуг!</span>
              <span className="text-gray-500 text-sm">Появились новые направления — IT, языки, дизайн и многое другое.</span>
            </li>
            <li className="bg-white/80 rounded-xl p-4 shadow flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-semibold text-green-600">💡 Советы по безопасности</span>
              <span className="text-gray-500 text-sm">Никогда не переводите деньги вне платформы — это безопаснее для всех.</span>
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
