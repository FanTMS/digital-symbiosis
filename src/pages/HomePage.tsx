import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTelegram } from "../hooks/useTelegram";
import { useUser } from "../contexts/UserContext";
import { Search, TrendingUp, Award, Gift, Plus, Sparkles, ArrowRight, Zap, Users, CheckCircle2, Star, ArrowUpRight } from "lucide-react";
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
  const { tg } = useTelegram();
  const { user } = useUser();
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
        document.title = "БртЦ";
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
    // Загружаем активный промо-баннер с таймаутом для мобильных устройств
    const fetchPromoBanner = async () => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        // Создаем промис с таймаутом
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Timeout')), 10000); // 10 секунд таймаут
        });

        const queryPromise = supabase
          .from("promo_banners")
          .select("*")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1);

        // Ждем либо результат запроса, либо таймаут
        const result = await Promise.race([
          queryPromise.then(result => {
            if (timeoutId) clearTimeout(timeoutId);
            return result;
          }),
          timeoutPromise
        ]);

        const { data, error } = result as any;

        if (error) {
          console.error("Ошибка загрузки промо-баннера:", error);
          setPromoBanner(null);
          return;
        }
        if (data && data.length > 0) {
          // Проверяем валидность данных баннера
          const banner = data[0];
          if (banner && (banner.title || banner.text || banner.image_url)) {
            // Дополнительная проверка URL изображения
            if (banner.image_url) {
              try {
                new URL(banner.image_url);
              } catch {
                // Если URL невалидный, убираем его
                banner.image_url = null;
              }
            }
            setPromoBanner(banner);
          } else {
            setPromoBanner(null);
          }
        } else {
          setPromoBanner(null);
        }
      } catch (e: any) {
        // Очищаем таймаут при ошибке
        if (timeoutId) clearTimeout(timeoutId);
        
        // Тихая обработка ошибок - не показываем alert на мобильных
        // Это может быть ошибка сети, таймаут или другая проблема
        if (e?.message === 'Timeout') {
          console.warn("Таймаут загрузки промо-баннера");
        } else {
          console.error("Ошибка загрузки промо-баннера:", e);
        }
        setPromoBanner(null);
        // Логируем ошибку только в консоль для разработки
        if (process.env.NODE_ENV === 'development') {
          console.warn("Детали ошибки:", e?.message || e);
        }
      }
    };
    
    // Запускаем загрузку с небольшой задержкой, чтобы не блокировать основной рендер
    const initTimeoutId = setTimeout(() => {
      fetchPromoBanner();
    }, 100);

    // Подписка на событие обновления баннера
    const handler = () => {
      clearTimeout(initTimeoutId);
      fetchPromoBanner();
    };
    window.addEventListener('promoBannerUpdated', handler);
    
    return () => {
      clearTimeout(initTimeoutId);
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
    <div className="pb-20 sm:pb-24 pt-2 min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section with Balance */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative px-4 sm:px-6 pt-6 pb-8">
          {/* Промо-баннер */}
          {promoBanner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <PromoBanner
                title={promoBanner.title}
                text={promoBanner.text}
                image={promoBanner.image_url}
                color={promoBanner.color}
                onClick={() => setShowPromoModal(true)}
              />
              <Modal isOpen={showPromoModal} onClose={() => setShowPromoModal(false)}>
<<<<<<< Current (Your changes)
                <div className="p-6 rounded-2xl" style={{ background: promoBanner.color || undefined }}>
                  {promoBanner.image_url && (
                    <img src={promoBanner.image_url} alt={promoBanner.title} className="w-32 h-32 object-cover rounded-xl mx-auto mb-4 shadow-lg" />
                  )}
                  <h2 className="text-2xl font-bold mb-2 text-center">{promoBanner.title}</h2>
                  <div className="text-base text-gray-700 mb-4 text-center">{promoBanner.text}</div>
                  <Button className="mt-2 mx-auto block" variant="primary" onClick={() => setShowPromoModal(false)}>Закрыть</Button>
                </div>
=======
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-3xl"
                  style={{ background: promoBanner.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
                  
                  <div className="relative z-10 p-8">
                    {promoBanner.image_url && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 flex justify-center"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl" />
                          <img
                            src={promoBanner.image_url}
                            alt={promoBanner.title}
                            className="w-40 h-40 object-cover rounded-3xl mx-auto shadow-2xl relative z-10 border-4 border-white/50"
                          />
                        </div>
                      </motion.div>
                    )}
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-3xl font-bold mb-4 text-center text-white drop-shadow-lg"
                    >
                      {promoBanner.title}
                    </motion.h2>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-lg text-white/90 mb-6 text-center leading-relaxed"
                    >
                      {promoBanner.text}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex justify-center"
                    >
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          className="bg-white text-primary-600 hover:bg-white/90 shadow-2xl font-bold px-8 py-3"
                          variant="primary"
                          onClick={() => setShowPromoModal(false)}
                        >
                          Закрыть
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
>>>>>>> Incoming (Background Agent changes)
              </Modal>
            </motion.div>
          )}

          {/* Balance Card - Modern Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl p-6 shadow-2xl overflow-hidden mb-6"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={20} className="text-white/90" />
                  <span className="text-white/80 text-sm font-medium">Ваш баланс</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg">
                    {user ? (user.credits ?? 0) : 0}
                  </span>
                  <span className="text-lg font-semibold text-white/70">кредитов</span>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="md"
                  variant="primary"
                  className="bg-white text-primary-600 hover:bg-white/90 shadow-lg font-bold"
                  onClick={() => {
                    const btn = document.querySelector('.balance-topup-bar button');
                    if (btn && btn instanceof HTMLButtonElement) btn.click();
                  }}
                >
                  <Zap size={18} className="mr-1" />
                  Пополнить
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Search bar - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative bg-white rounded-2xl p-4 shadow-lg border border-gray-100 cursor-pointer group hover:shadow-xl transition-all duration-300"
              onClick={() => navigate("/services")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-xl group-hover:bg-primary-100 transition-colors">
                  <Search size={20} className="text-primary-600" />
                </div>
                <span className="text-gray-500 text-sm sm:text-base flex-1">
                  Поиск услуг и специалистов...
                </span>
                <ArrowRight size={18} className="text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick actions - Redesigned */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="px-4 sm:px-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap size={20} className="text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Быстрые действия</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 shadow-lg cursor-pointer overflow-hidden"
            onClick={() => navigate("/services")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                <Search size={24} className="text-white" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">Найти услугу</h3>
              <p className="text-white/80 text-xs">Выберите из каталога</p>
            </div>
          </motion.div>

          <motion.div
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-5 shadow-lg cursor-pointer overflow-hidden"
            onClick={handleCreateService}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                <Plus size={24} className="text-white" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">Предложить услугу</h3>
              <p className="text-white/80 text-xs">Поделитесь навыками</p>
            </div>
          </motion.div>

          <motion.div
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-gradient-to-br from-success-500 to-success-600 rounded-2xl p-5 shadow-lg cursor-pointer overflow-hidden"
            onClick={() => navigate("/referrals")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                <Gift size={24} className="text-white" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">Пригласить друга</h3>
              <p className="text-white/80 text-xs">+5 кредитов</p>
            </div>
          </motion.div>

          <motion.div
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-gradient-to-br from-warning-500 to-warning-600 rounded-2xl p-5 shadow-lg cursor-pointer overflow-hidden"
            onClick={() => navigate("/profile")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                <Award size={24} className="text-white" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">Достижения</h3>
              <p className="text-white/80 text-xs">Проверьте уровень</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Recommended services - Enhanced */}
      <div className="px-4 sm:px-6 mb-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-xl">
              <TrendingUp size={20} className="text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Рекомендации для вас</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/services')}
            className="text-primary-600 hover:text-primary-700"
          >
            Все услуги
            <ArrowRight size={16} />
          </Button>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-100 animate-pulse h-40 rounded-2xl"
              />
            ))}
          </div>
        ) : recommendedServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 text-center shadow-lg border border-gray-100"
          >
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={40} className="text-primary-500" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Нет рекомендаций</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Пока для вас нет персональных рекомендаций. Попробуйте воспользоваться поиском или создайте свою первую услугу!
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/create-service")}
              className="mx-auto"
            >
              <Plus size={18} className="mr-2" />
              Создать услугу
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {recommendedServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ServiceCard service={service} />
              </motion.div>
            ))}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate('/services')}
                className="font-semibold border-2 border-primary-200 text-primary-600 hover:bg-primary-50"
              >
                Показать все услуги
                <ArrowRight size={18} />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Новости и акции - Redesigned */}
      <div className="px-4 sm:px-6 mb-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-3xl p-6 shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Gift size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Актуальные акции и новости</h2>
            </div>
            <div className="space-y-3">
              <motion.div
                whileHover={{ x: 4 }}
                className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg flex items-start gap-3"
              >
                <div className="text-2xl">🎉</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">Приведи друга — получи 5 кредитов!</div>
                  <div className="text-sm text-gray-600">За каждого приглашённого друга вы получаете бонус.</div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg flex items-start gap-3"
              >
                <div className="text-2xl">🔥</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">Новые категории услуг!</div>
                  <div className="text-sm text-gray-600">Появились новые направления — IT, языки, дизайн и многое другое.</div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg flex items-start gap-3"
              >
                <div className="text-2xl">💡</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">Советы по безопасности</div>
                  <div className="text-sm text-gray-600">Никогда не переводите деньги вне платформы — это безопаснее для всех.</div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats - Enhanced */}
      <div className="px-4 sm:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-4"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-xl">
              <Users size={20} className="text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Статистика платформы</h2>
          </div>
        </motion.div>
        <StatsBlock stats={stats} loading={stats.users === 0 && stats.completedOrders === 0 && stats.categories === 0 && stats.avgRating === 0} />
      </div>

      {/* Hidden BalanceTopupBar */}
      <div className="hidden">
        <BalanceTopupBar />
      </div>
    </div>
  );
};

export default HomePage;
