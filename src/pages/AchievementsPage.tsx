import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';
import { Trophy, Star, Target, Award, ChevronRight, User, Users, CheckCircle, Gift, Briefcase, MessageCircle, Layers, Sunrise } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../components/ui/ToastProvider';
import Button from '../components/ui/Button';
import { Referral, Review } from '../types/models';

const BADGE_ICONS: Record<string, React.ReactNode> = {
  'Лучший репетитор': <Award size={32} className="text-yellow-500" />,
  'Первые шаги': <Star size={32} className="text-blue-400" />,
  'Пять звёзд': <Star size={32} className="text-yellow-400 fill-yellow-400" />,
  'Постоянный клиент': <Users size={32} className="text-primary-500" />,
  'Пригласил друга': <Gift size={32} className="text-pink-500" />,
  'Профи': <Briefcase size={32} className="text-green-500" />,
  'Отзывчивый': <MessageCircle size={32} className="text-accent-500" />,
  'Портфолио': <Layers size={32} className="text-purple-500" />,
  'Мультискилл': <User size={32} className="text-cyan-500" />,
  'Ранний пташка': <Sunrise size={32} className="text-orange-400" />,
};

const BADGE_CRITERIA: Record<string, { current: (args: any) => number; required: number; label: string }> = {
  'Первые шаги': {
    current: ({ completedTasks }: any) => completedTasks,
    required: 1,
    label: 'Выполните первый заказ',
  },
  'Лучший репетитор': {
    current: ({ reviews }: any) => reviews.filter((r: Review) => r.rating === 5).length,
    required: 10,
    label: 'Получите 10 отличных отзывов',
  },
  'Пять звёзд': {
    current: ({ reviews }: any) => reviews.filter((r: Review) => r.rating === 5).length,
    required: 5,
    label: 'Получите 5 оценок 5★',
  },
  'Постоянный клиент': {
    current: ({ completedTasks }: any) => completedTasks,
    required: 10,
    label: 'Сделайте 10 заказов',
  },
  'Пригласил друга': {
    current: ({ referrals }: any) => referrals.filter((r: Referral) => r.bonus_received).length,
    required: 1,
    label: 'Пригласите друга и он выполнит заказ',
  },
};

const AchievementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tg, user } = useTelegram();
  const { showToast } = useToast();
  const [badges, setBadges] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({
    totalTasks: 0,
    totalCredits: 0,
    level: 'Новичок',
    nextLevelProgress: 0
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    if (tg) {
      tg.setHeaderColor('#0BBBEF');
      tg.BackButton.show();
      tg.BackButton.onClick(() => navigate('/profile'));
      
      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick(() => {});
      };
    }
  }, [tg, navigate]);

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      try {
        // Получаем все достижения
        const { data: allBadges, error: badgesError } = await supabase
          .from('badges')
          .select('*');

        if (badgesError) throw badgesError;

        // Получаем user_badges пользователя
        const { data: userBadgesData, error: userBadgesError } = await supabase
          .from('user_badges')
          .select('badge_id, received_at')
          .eq('user_id', user?.id);

        if (userBadgesError) throw userBadgesError;

        // Получаем прогресс пользователя (если есть таблица user_stats)
        let statsData = {
          completed_tasks: 0,
          total_credits: 0,
          level: 'Новичок',
          next_level_progress: 0,
        };
        try {
          const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user?.id)
            .single();
          if (!error && data) {
            statsData = data;
          }
        } catch {}

        // Получаем отзывы пользователя
        let reviewsData: Review[] = [];
        try {
          const { data: reviewsRaw, error: reviewsError } = await supabase
            .from('reviews')
            .select('*')
            .eq('user_id', user?.id);
          if (!reviewsError && reviewsRaw) {
            reviewsData = reviewsRaw;
          }
        } catch {}
        setReviews(reviewsData);

        // Получаем рефералов пользователя
        let referralsData: Referral[] = [];
        try {
          const { data: referralsRaw, error: referralsError } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_id', user?.id);
          if (!referralsError && referralsRaw) {
            referralsData = referralsRaw;
          }
        } catch {}
        setReferrals(referralsData);

        setBadges(allBadges || []);
        setUserBadges(userBadgesData || []);
        setProgress({
          totalTasks: statsData.completed_tasks,
          totalCredits: statsData.total_credits,
          level: statsData.level,
          nextLevelProgress: statsData.next_level_progress,
        });
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAchievements();
    }
  }, [user?.id]);

  const userBadgeIds = new Set(userBadges.map((b) => b.badge_id));

  const achievementCategories = [
    {
      title: 'Выполненные задания',
      icon: Trophy,
      value: progress.totalTasks,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      title: 'Заработано кредитов',
      icon: Star,
      value: progress.totalCredits,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Текущий уровень',
      icon: Target,
      value: progress.level,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    }
  ];

  return (
    <div className="pb-16 pt-2">
      <div className="px-4">
        <h1 className="text-2xl font-bold mb-4">Достижения</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {achievementCategories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg p-4 shadow-card"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${category.bgColor} ${category.color}`}>
                  <category.icon size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm text-gray-500">{category.title}</h3>
                  <p className="text-xl font-bold">{category.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress to Next Level */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Прогресс уровня</h2>
          <div className="bg-white rounded-lg p-4 shadow-card">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">До следующего уровня</span>
              <span className="text-sm font-medium">{Math.round(progress.nextLevelProgress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.nextLevelProgress * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-primary-500 h-2 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Badges */}
        <h2 className="text-lg font-semibold mb-3">Полученные награды</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 animate-pulse h-20 rounded-lg" />
            ))}
          </div>
        ) : badges.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-3"
          >
            {badges.map((badge, index) => {
              const received = userBadgeIds.has(badge.id);
              const criteria = BADGE_CRITERIA[badge.name];
              let progressValue = 0;
              let progressLabel = '';
              if (criteria) {
                progressValue = Math.min(
                  criteria.current({
                    completedTasks: progress.totalTasks,
                    reviews,
                    referrals,
                  }) / criteria.required,
                  1
                );
                progressLabel = `${Math.min(criteria.current({
                  completedTasks: progress.totalTasks,
                  reviews,
                  referrals,
                }), criteria.required)} / ${criteria.required}`;
              }
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg p-4 shadow-card flex items-center"
                >
                  <div className={`p-2 rounded-lg bg-${badge.color}-100`}>
                    {BADGE_ICONS[badge.name] || <Award size={32} />}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-medium">{badge.name}</h3>
                    <p className="text-sm text-gray-500">{badge.description}</p>
                    {!received && criteria && (
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">Прогресс: {progressLabel}</span>
                          <span className="text-xs text-gray-400">{Math.round(progressValue * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressValue * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="bg-primary-500 h-2 rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mb-2 mr-4">Награда: <span className="font-bold text-accent-500">+{badge.reward_credits} кр.</span></div>
                  {received ? (
                    <div className="flex items-center text-green-600 font-medium mt-2"><CheckCircle size={18} className="mr-1" /> Получено</div>
                  ) : (
                    <div
                      className="flex items-center border border-gray-300 text-gray-400 font-medium mt-2 px-3 py-1 rounded-full bg-gray-50"
                      style={{ width: 'fit-content' }}
                    >
                      <span className="mr-1">⏳</span> Не получено
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-lg font-medium mb-1">Нет достижений</h3>
            <p className="text-gray-500 mb-4 max-w-xs">
              Вы ещё не получили ни одного достижения. Выполняйте задания, получайте отзывы и приглашайте друзей, чтобы зарабатывать бейджи!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPage;