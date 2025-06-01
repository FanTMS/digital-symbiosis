import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';
import { Search, TrendingUp, Award, Gift, Plus, Bell } from 'lucide-react';
import { notificationsApi } from '../lib/api/notifications';
import { supabase } from '../lib/supabase';
import ServiceCard from '../components/ui/ServiceCard';
import type { ServiceWithUser } from '../types/models';
import BalanceTopupBar from '../components/ui/BalanceTopupBar';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tg } = useTelegram();
  const [recommendedServices, setRecommendedServices] = useState<ServiceWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({
    users: 0,
    completedOrders: 0,
    categories: 0,
    avgRating: 0,
  });
  
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*, user:users(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
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
      tg.setHeaderColor('#0BBBEF');
      
      const defaultTitle = document.querySelector('[data-default]');
      if (defaultTitle) {
        document.title = 'Цифровой симбиоз';
      }
    }
  }, [tg]);

  useEffect(() => {
    if (user?.id) {
      notificationsApi.listUserNotifications(user.id).then(list => {
        setUnreadCount(list.filter(n => !n.read).length);
      });
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchStats = async () => {
      // Количество пользователей
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Количество завершённых заказов
      const { count: completedOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Категории услуг (уникальные)
      const { data: categoriesData } = await supabase
        .from('services')
        .select('category');
      const uniqueCategories = Array.from(new Set((categoriesData || []).map((s: any) => s.category)));

      // Средний рейтинг по всем пользователям
      const { data: usersData } = await supabase
        .from('users')
        .select('rating');
      let avgRating = 0;
      if (usersData && usersData.length > 0) {
        const ratings = usersData.map((u: any) => Number(u.rating)).filter((r: number) => !isNaN(r) && r > 0);
        avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
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

  const handleCreateService = () => {
    navigate('/create-service');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="pb-16 pt-2 sm:pb-20 sm:pt-4">
      {/* Header */}
      <div className="px-2 sm:px-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Цифровой симбиоз</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Обмен услугами в один клик</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="relative p-2 bg-gray-100 dark:bg-gray-700 rounded-full"
              onClick={() => navigate('/notifications')}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white" style={{minWidth:16, minHeight:16, padding:'0 4px'}}>{unreadCount}</span>
              )}
            </button>
            <BalanceTopupBar />
          </div>
        </div>
        
        {/* Search bar */}
        <div 
          className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-2 sm:p-3 flex items-center cursor-pointer"
          onClick={() => navigate('/services')}
        >
          <Search size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
          <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Поиск услуг и специалистов...</span>
        </div>
      </div>
      
      {/* Quick actions */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="px-2 sm:px-4 mb-4 sm:mb-6"
      >
        <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Быстрые действия</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <motion.div 
            variants={item}
            whileTap={{ scale: 0.95 }}
            className="bg-primary-50 dark:bg-primary-900/30 p-4 rounded-lg border border-primary-100 dark:border-primary-800"
            onClick={() => navigate('/services')}
          >
            <Search size={24} className="text-primary-500 mb-2" />
            <h3 className="font-medium">Найти услугу</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Выберите из каталога</p>
          </motion.div>
          
          <motion.div 
            variants={item}
            whileTap={{ scale: 0.95 }}
            className="bg-accent-50 dark:bg-accent-900/30 p-4 rounded-lg border border-accent-100 dark:border-accent-800"
            onClick={handleCreateService}
          >
            <Plus size={24} className="text-accent-500 mb-2" />
            <h3 className="font-medium">Предложить услугу</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Поделитесь навыками</p>
          </motion.div>
          
          <motion.div 
            variants={item}
            whileTap={{ scale: 0.95 }}
            className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-100 dark:border-green-800"
            onClick={() => navigate('/referrals')}
          >
            <Gift size={24} className="text-green-500 mb-2" />
            <h3 className="font-medium">Пригласить друга</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">+5 кредитов за каждого</p>
          </motion.div>
          
          <motion.div 
            variants={item}
            whileTap={{ scale: 0.95 }}
            className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-100 dark:border-amber-800"
            onClick={() => navigate('/profile')}
          >
            <Award size={24} className="text-amber-500 mb-2" />
            <h3 className="font-medium">Мои достижения</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Проверьте уровень</p>
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
              <div key={i} className="bg-gray-100 dark:bg-gray-800 animate-pulse h-32 rounded-lg"></div>
            ))}
          </div>
        ) : recommendedServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="text-lg font-medium mb-1">Нет рекомендаций</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
              Пока для вас нет персональных рекомендаций. Попробуйте воспользоваться поиском или создайте свою первую услугу!
            </p>
            <button
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-4 py-2 rounded-lg transition"
              onClick={() => navigate('/create-service')}
            >
              Создать услугу
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
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
              onClick={() => navigate('/services')}
              className="flex justify-center items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-primary-500 font-medium"
            >
              Показать все услуги
            </motion.div>
          </motion.div>
        )}
      </div>
      
      {/* Stats */}
      <div className="px-4">
        <h2 className="text-lg font-semibold mb-3">Статистика платформы</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-4">
          <div className="grid grid-cols-2 gap-4">
            {stats.users === 0 && stats.completedOrders === 0 && stats.categories === 0 && stats.avgRating === 0 ? (
              // Skeleton
              <>
                {[1,2,3,4].map(i => (
                  <div className="text-center" key={i}>
                    <div className="h-8 w-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                    <div className="h-4 w-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                ))}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="contents"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-500">{stats.users}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Активных пользователей</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent-500">{stats.completedOrders}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Завершённых заданий</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.categories}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Категорий услуг</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-500">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Средний рейтинг</div>
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