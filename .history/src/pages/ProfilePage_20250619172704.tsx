import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useTelegram } from "../hooks/useTelegram";
import {
  Award,
  Gift,
  ChevronRight,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  Star,
  MessageCircle,
  Pencil,
  X,
  Edit3,
  Plus,
  Trash2,
  ListChecks,
  MessageSquare,
  Copy,
  Users,
  AlertTriangle,
} from "lucide-react";
import ProfileCard from "../components/ui/ProfileCard";
import Button from "../components/ui/Button";
import { User } from "../types/models";
import { supabase } from "../lib/supabase";
import Modal from "../components/ui/Modal";
import { Avatar } from "../components/ui/Avatar";

const TABS = [
  { id: 'services', label: 'Услуги', icon: FileText },
  { id: 'quizzes', label: 'Квизы', icon: ListChecks },
  { id: 'reviews', label: 'Отзывы', icon: MessageSquare },
  { id: 'orders', label: 'Заказы', icon: FileText },
  { id: 'promo', label: 'Активировать промокод', icon: Gift },
];

// Константы для прогресса уровня
const TASKS_FOR_NEXT_LEVEL = 20;

// Иконки бейджей (упрощённое соответствие)
const BADGE_ICONS: Record<string, React.ReactNode> = {
  "Лучший репетитор": <Award size={18} className="text-yellow-500" />,
  "Первые шаги": <Star size={18} className="text-blue-400" />,
  "Пять звёзд": <Star size={18} className="text-yellow-400 fill-yellow-400" />,
  "Постоянный клиент": <Users size={18} className="text-primary-500" />,
  "Пригласил друга": <Gift size={18} className="text-pink-500" />,
};

const ProfilePage: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tg, user: currentUser } = useTelegram();
  const id = paramId || currentUser?.id;
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwn, setIsOwn] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar_url || "");
  const [editDescription, setEditDescription] = useState(
    user?.description || "",
  );
  const [editSkills, setEditSkills] = useState<string[]>(user?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'quizzes' | 'reviews' | 'orders' | 'promo'>('services');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsTab, setSubsTab] = useState<'followers' | 'following' | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [promoMessage, setPromoMessage] = useState('');
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState<number | null>(null);

  // Вычисляем прогресс для следующего уровня
  const completedTasks = orders.length + services.length;
  const progressToNextLevel = Math.min(completedTasks / TASKS_FOR_NEXT_LEVEL, 1);

  // Меню для владельца профиля
  const menuItems = isOwn ? [
    {
      icon: Award,
      label: "Достижения",
      onClick: () => navigate("/achievements"),
    },
    {
      icon: Gift,
      label: "Рефералы",
      onClick: () => navigate("/referrals"),
    },
    {
      icon: CreditCard,
      label: "Баланс",
      value: `${user?.credits || 0} кр.`,
      onClick: () => { },
    },
    {
      icon: AlertTriangle,
      label: "Мои споры",
      onClick: () => navigate("/disputes/my"),
    },
    {
      icon: Settings,
      label: "Настройки",
      onClick: () => navigate("/settings"),
    },
    {
      icon: LogOut,
      label: "Выйти",
      onClick: () => {
        if (tg) {
          tg.close();
        }
      },
    },
  ] : [];

  useEffect(() => {
    (async () => {
      if (!id) {
        setLoading(false);
        setUser(null);
        return;
      }
      setLoading(true);
      const idNum = Number(id);
      // Получаем пользователя
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", idNum)
        .single();
      setUser(userData);
      // Получаем отзывы (review.user_id = user.id)
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", idNum)
        .order("created_at", { ascending: false });
      setReviews(reviewData || []);
      // Получаем выполненные заказы (provider_id = user.id, status = completed)
      const { data: orderData } = await supabase
        .from("orders")
        .select("*, service:services(*)")
        .eq("provider_id", idNum)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      setOrders(orderData || []);
      // Получаем услуги пользователя
      const { data: serviceData } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", idNum)
        .eq("is_active", true);
      setServices(serviceData || []);
      // Проверяем, свой ли это профиль
      setIsOwn(currentUser?.id === userData?.id);
      setEditName(userData?.name || "");
      setEditAvatar(userData?.avatar_url || "");
      setEditDescription(userData?.description || "");
      setEditSkills(userData?.skills || []);
      setSkillInput("");
      // Загружаем бейджи пользователя
      const { data: badgeRows } = await supabase
        .from("user_badges")
        .select("badge_id, badges:badge_id(id, name)")
        .eq("user_id", idNum);
      const allBadges = badgeRows?.map((b: any) => b.badges) || [];
      setUserBadges(allBadges);
      setSelectedBadgeId(userData?.display_badge_id || null);
      setLoading(false);
    })();
  }, [id, currentUser]);

  useEffect(() => {
    if (tg) {
      tg.setHeaderColor("#0BBBEF");
      tg.MainButton.hide();
    }
  }, [tg]);

  useEffect(() => {
    if (!user?.id) return;
    setQuizLoading(true);
    supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setQuizzes(data || []));
    setQuizLoading(false);
  }, [user?.id]);

  // Получаем подписчиков и подписки
  useEffect(() => {
    if (!user?.id) return;
    setSubsLoading(true);
    (async () => {
      // Подписчики (кто подписан на этого пользователя)
      const { data: followersData } = await supabase
        .from('subscriptions')
        .select('follower_id, users:follower_id(id, name, username, avatar_url)')
        .eq('followed_id', user.id);
      setFollowers(followersData?.map((s: any) => s.users) || []);
      // Подписки (на кого подписан этот пользователь)
      const { data: followingData } = await supabase
        .from('subscriptions')
        .select('followed_id, users:followed_id(id, name, username, avatar_url)')
        .eq('follower_id', user.id);
      setFollowing(followingData?.map((s: any) => s.users) || []);
      setSubsLoading(false);
    })();
  }, [user?.id]);

  // Проверяем, подписан ли текущий пользователь на этот профиль
  useEffect(() => {
    if (!user?.id || !currentUser?.id || user.id === currentUser.id) return;
    (async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('follower_id', currentUser.id)
        .eq('followed_id', user.id)
        .single();
      setIsFollowing(!!data);
    })();
  }, [user?.id, currentUser?.id]);

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setDeletingQuiz(true);
    await supabase.from('quiz_questions').delete().eq('quiz_id', quizToDelete);
    await supabase.from('quizzes').delete().eq('id', quizToDelete);
    setQuizzes(qs => qs.filter(q => q.id !== quizToDelete));
    setDeletingQuiz(false);
    setQuizToDelete(null);
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/profile/${user?.id}`;
    await navigator.clipboard.writeText(url);
    alert('Ссылка скопирована!');
  };

  const handleFollow = async () => {
    if (!currentUser?.id || !user?.id) return;
    await supabase.from('subscriptions').insert({ follower_id: currentUser.id, followed_id: user.id });
    setIsFollowing(true);
    setFollowers((prev) => [...prev, currentUser]);
  };
  const handleUnfollow = async () => {
    if (!currentUser?.id || !user?.id) return;
    await supabase.from('subscriptions').delete().eq('follower_id', currentUser.id).eq('followed_id', user.id);
    setIsFollowing(false);
    setFollowers((prev) => prev.filter((f) => f.id !== currentUser.id));
  };

  const handleActivatePromo = async () => {
    setPromoStatus('loading');
    setPromoMessage('');
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoInput.trim())
        .single();
      if (error || !data) {
        setPromoStatus('error');
        setPromoMessage('Промокод не найден или уже использован');
        return;
      }
      setPromoStatus('success');
      setPromoMessage('Промокод успешно активирован!');
      setPromoInput('');
    } catch (e) {
      setPromoStatus('error');
      setPromoMessage('Ошибка при активации промокода');
    }
  };

  if (loading)
    return (
      <div className="pb-16 pt-2">
        <div className="px-4 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="h-6 w-40 bg-gray-200 rounded mb-2 animate-pulse" />

              <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />

              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="mb-6">
            <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse" />

            <div className="w-full bg-gray-200 rounded-full h-2.5 animate-pulse" />
          </div>
          <div className="bg-white rounded-lg shadow-card overflow-hidden mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-gray-200 rounded mr-3 animate-pulse" />

                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 grid md:grid-cols-2 gap-6">
          <div>
            <div className="h-5 w-32 bg-gray-200 rounded mb-3 animate-pulse" />

            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 rounded-lg mb-2 animate-pulse"
              />
            ))}
          </div>
          <div>
            <div className="h-5 w-32 bg-gray-200 rounded mb-3 animate-pulse" />

            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 rounded-lg mb-2 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="p-8 text-center text-red-500">Пользователь не найден</div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pb-16 pt-2"
    >
      {/* Мобильный заголовок и кнопки */}
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-bold mb-3">Профиль</h1>

        {/* Кнопки действий - адаптивно под мобильные */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium shadow-sm transition touch-manipulation"
            onClick={handleShareProfile}
            title="Скопировать ссылку на профиль"
          >
            <Copy size={16} /> Поделиться
          </button>

          {/* Кнопка подписки/отписки */}
          {!isOwn && (
            <button
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition touch-manipulation ${isFollowing ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              onClick={isFollowing ? handleUnfollow : handleFollow}
            >
              <Users size={16} /> {isFollowing ? 'Отписаться' : 'Подписаться'}
            </button>
          )}
        </div>
      </div>
      {/* Кол-во подписчиков и подписок */}
      <div className="px-4 mb-4 flex gap-4">
        <button className="text-sm text-blue-700 hover:underline" onClick={() => setSubsTab('followers')}>
          Подписчики: <b>{followers.length}</b>
        </button>
        <button className="text-sm text-blue-700 hover:underline" onClick={() => setSubsTab('following')}>
          Подписки: <b>{following.length}</b>
        </button>
      </div>
      {/* Модалка подписчиков/подписок */}
      {subsTab && (
        <Modal isOpen={!!subsTab} onClose={() => setSubsTab(null)}>
          <div className="p-4 w-80">
            <h2 className="text-xl font-bold mb-4">{subsTab === 'followers' ? 'Подписчики' : 'Подписки'}</h2>
            {subsLoading ? (
              <div className="text-gray-400">Загрузка...</div>
            ) : (
              <div className="flex flex-col gap-3">
                {(subsTab === 'followers' ? followers : following).length === 0 ? (
                  <div className="text-gray-400 text-center">Нет данных</div>
                ) : (
                  (subsTab === 'followers' ? followers : following).map((u) => (
                    <div key={u.id} className="flex items-center gap-3 p-2 rounded hover:bg-blue-50 cursor-pointer" onClick={() => { setSubsTab(null); navigate(`/profile/${u.id}`); }}>
                      <Avatar src={u.avatar_url} name={u.name} size={36} />
                      <div>
                        <div className="font-medium text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-500">@{u.username}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
      <div className="px-4 mb-6">
        {/* Адаптивная карточка пользователя */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative">
              <Avatar src={user.avatar_url} name={user.name} size={80} className="cursor-pointer border-2 border-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-xl sm:text-2xl font-bold truncate">
                    {user.name}
                  </span>
                  <span className="text-gray-400 text-sm sm:text-base">
                    @{user.username}
                  </span>
                </div>
                {(user as any).display_badge_id && (
                  (() => {
                    const badge = userBadges.find(b => b.id === (user as any).display_badge_id);
                    return badge ? (
                      <span title={badge.name} className="ml-1">
                        {BADGE_ICONS[badge.name] || "🏅"}
                      </span>
                    ) : null;
                  })()
                )}
                {isOwn && (
                  <button
                    className="ml-2 p-1.5 rounded-full hover:bg-gray-100 touch-manipulation"
                    onClick={() => setShowEditModal(true)}
                    title="Редактировать профиль"
                  >
                    <Pencil size={18} />
                  </button>
                )}
              </div>

              {/* Рейтинг и статистика - адаптивно */}
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-medium">
                    {user.rating?.toFixed(1) ?? "—"}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">
                    Уровень: {user.level ?? "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">
                    Кредиты: {user.credits ?? 0}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">
                    Активность: {(user as any).challenge_points ?? 0}
                  </span>
                </div>
              </div>

              {/* Награды */}
              {(user as any).challenge_awards?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(user as any).challenge_awards?.map((award: any) => (
                    <span key={award.id} className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs gap-1">
                      🏆 {award.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Кнопка сообщения - адаптивная */}
          {!isOwn && (
            <div className="w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto"
                leftIcon={<MessageCircle size={18} />}
                onClick={() => navigate(`/chat/${user.id}`)}
                size="sm"
              >
                <span className="sm:inline">Написать сообщение</span>
                <span className="sm:hidden">Сообщение</span>
              </Button>
            </div>
          )}
        </div>

        {!loading && (
          <>
            {/* Level progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-medium text-gray-700">
                  Прогресс уровня
                </h2>
                <span className="text-xs text-gray-500">
                  {completedTasks}/{TASKS_FOR_NEXT_LEVEL} заданий до "
                  {user!.level === "Новичок"
                    ? "Специалист"
                    : user!.level === "Специалист"
                      ? "Эксперт"
                      : "Мастер"}
                  "
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNextLevel * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-primary-500 h-2.5 rounded-full"
                ></motion.div>
              </div>
            </div>

            {/* Menu */}
            {isOwn && (
              <div className="bg-white rounded-lg shadow-card overflow-hidden mb-6">
                {menuItems.map((item, idx) => (
                  <button
                    key={item.label}
                    className="flex items-center w-full px-4 py-4 gap-3 text-lg font-medium text-gray-800 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition group"
                    onClick={item.onClick}
                  >
                    <span className="text-primary-500"><item.icon size={22} /></span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.value !== undefined && (
                      <span className="text-primary-500 font-bold">{item.value}</span>
                    )}
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-400 transition" />
                  </button>
                ))}
              </div>
            )}

            {/* Вкладки - адаптивные */}
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap touch-manipulation min-w-max ${activeTab === tab.id ? 'bg-blue-100 text-blue-900 shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Контент вкладок */}
            {activeTab === 'services' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Отзывы */}
                <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-3">Отзывы</h3>
                  {reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                      <div className="text-3xl mb-2">💬</div>
                      <div className="font-medium mb-1">Нет отзывов</div>
                      <div className="text-xs mb-2">
                        Пользователь ещё не получил ни одного отзыва
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reviews.map((r) => (
                        <div key={r.id} className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i <= r.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }
                              />
                            ))}
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(r.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm">
                            {r.comment || (
                              <span className="text-gray-400">
                                Без комментария
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Выполненные заказы */}
                <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-3">
                    Выполненные заказы
                  </h3>
                  {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                      <div className="text-3xl mb-2">📦</div>
                      <div className="font-medium mb-1">
                        Нет выполненных заказов
                      </div>
                      <div className="text-xs mb-2">
                        Пользователь ещё не выполнил ни одного заказа
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {orders.map((o) => (
                        <div key={o.id} className="bg-gray-100 rounded-lg p-3">
                          <div className="font-medium">
                            {o.service?.title || "Без названия"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(o.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Услуги пользователя */}
                <div className="lg:col-span-2">
                  <h3 className="font-semibold text-base sm:text-lg mb-3">
                    Услуги пользователя
                  </h3>
                  {services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                      <div className="text-3xl mb-2">🛠️</div>
                      <div className="font-medium mb-1">Нет активных услуг</div>
                      <div className="text-xs mb-3">
                        {isOwn
                          ? "Вы ещё не добавили ни одной услуги"
                          : "Пользователь ещё не добавил ни одной услуги"}
                      </div>
                      {isOwn && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => navigate("/create-service")}
                          className="touch-manipulation"
                        >
                          Добавить услугу
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {services.map((s) => (
                        <div
                          key={s.id}
                          className="bg-white rounded-lg shadow-sm border p-3 flex flex-col"
                        >
                          <div className="font-medium mb-1 text-sm sm:text-base truncate">{s.title}</div>
                          <div className="text-xs text-gray-500 mb-1">
                            {s.category}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {s.price} кр.
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/services/${s.id}`)}
                            className="mt-auto touch-manipulation"
                          >
                            Подробнее
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'quizzes' && (
              <div className="bg-white rounded-lg shadow-card p-4 w-full max-w-2xl mx-auto">
                <h3 className="font-semibold text-lg mb-2">Мои квизы</h3>
                <div className="mb-4 flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="primary"
                    className="w-full sm:w-auto"
                    onClick={() => navigate('/quizzes/new')}
                  >
                    <Plus size={18} /> Создать квиз
                  </Button>
                </div>
                {quizLoading ? (
                  <div className="flex items-center justify-center py-6 text-center text-gray-400">Загрузка...</div>
                ) : quizzes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                    <div className="text-3xl mb-2">📝</div>
                    <div className="font-medium mb-1">Нет квизов</div>
                    <div className="text-xs mb-2">Создайте первый квиз, чтобы начать!</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quizzes.map(quiz => (
                      <div key={quiz.id} className="bg-gray-100 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-base truncate mb-1">{quiz.title}</div>
                          <div className="text-gray-500 text-sm truncate">{quiz.description}</div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}>
                            <Edit3 size={16} /> <span className="hidden xs:inline">Редактировать</span>
                          </Button>
                          <Button size="sm" variant="danger" className="w-full sm:w-auto" onClick={() => setQuizToDelete(quiz.id)}>
                            <Trash2 size={16} /> <span className="hidden xs:inline">Удалить</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Modal isOpen={!!quizToDelete} onClose={() => setQuizToDelete(null)}>
                  <div className="p-2">
                    <h2 className="text-lg font-bold mb-2">Удалить квиз?</h2>
                    <p className="mb-4 text-gray-600">Это действие необратимо. Все вопросы квиза также будут удалены.</p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setQuizToDelete(null)} disabled={deletingQuiz}>Отмена</Button>
                      <Button
                        variant="danger"
                        onClick={handleDeleteQuiz}
                        isLoading={deletingQuiz}
                        disabled={deletingQuiz}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                </Modal>
                <div className="mt-8 flex flex-col items-center">
                  <input
                    type="text"
                    placeholder="Введите промокод"
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value)}
                    className="mb-2 px-4 py-2 rounded border w-full max-w-xs"
                    disabled={promoStatus === 'loading'}
                  />
                  <Button
                    onClick={handleActivatePromo}
                    disabled={promoStatus === 'loading' || !promoInput.trim()}
                    className="w-full max-w-xs"
                  >
                    Активировать
                  </Button>
                  {promoMessage && (
                    <div className={`mt-2 text-sm ${promoStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {promoMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Отзывы</h3>
                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                    <div className="text-3xl mb-2">💬</div>
                    <div className="font-medium mb-1">Нет отзывов</div>
                    <div className="text-xs mb-2">
                      Пользователь ещё не получил ни одного отзыва
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reviews.map((r) => (
                      <div key={r.id} className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={14}
                              className={
                                i <= r.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          {r.comment || (
                            <span className="text-gray-400">
                              Без комментария
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'orders' && (
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Выполненные заказы
                </h3>
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                    <div className="text-3xl mb-2">📦</div>
                    <div className="font-medium mb-1">
                      Нет выполненных заказов
                    </div>
                    <div className="text-xs mb-2">
                      Пользователь ещё не выполнил ни одного заказа
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <div key={o.id} className="bg-gray-100 rounded-lg p-3">
                        <div className="font-medium">
                          {o.service?.title || "Без названия"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(o.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'promo' && (
              <div className="bg-white rounded-lg shadow-card p-4 w-full max-w-md mx-auto flex flex-col items-center">
                <h3 className="font-semibold text-lg mb-4">Активация промокода</h3>
                <input
                  type="text"
                  placeholder="Введите промокод"
                  value={promoInput}
                  onChange={e => setPromoInput(e.target.value)}
                  className="mb-2 px-4 py-2 rounded border w-full max-w-xs"
                  disabled={promoStatus === 'loading'}
                />
                <Button
                  onClick={handleActivatePromo}
                  disabled={promoStatus === 'loading' || !promoInput.trim()}
                  className="w-full max-w-xs"
                >
                  Активировать
                </Button>
                {promoMessage && (
                  <div className={`mt-2 text-sm ${promoStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {promoMessage}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {/* Модальное окно для редактирования профиля */}
      {showEditModal && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <div className="p-4 w-80">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Редактировать профиль</h2>
              <button onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center mb-4">
              <label className="relative cursor-pointer group">
                <Avatar src={editAvatar || user.avatar_url} name={user.name} size={96} className="border-2 border-primary-500" />
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        setEditAvatar(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <span className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow group-hover:bg-primary-100">
                  <Pencil size={16} />
                </span>
              </label>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Имя</label>
              <input
                type="text"
                className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea
                className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50 resize-none"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Навыки</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editSkills.length > 0 ? (
                  editSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs"
                    >
                      {skill}
                      <button
                        type="button"
                        className="ml-1 text-gray-400 hover:text-red-500 focus:outline-none"
                        aria-label={`Удалить навык ${skill}`}
                        onClick={() =>
                          setEditSkills(editSkills.filter((_, i) => i !== idx))
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">
                    Навыки не указаны
                  </span>
                )}
              </div>
              <input
                type="text"
                className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const newSkill = skillInput.trim();
                    if (
                      newSkill &&
                      newSkill.length <= 30 &&
                      !editSkills.includes(newSkill) &&
                      editSkills.length < 10
                    ) {
                      setEditSkills([...editSkills, newSkill]);
                    }
                    setSkillInput("");
                  }
                }}
                placeholder="Введите навык и нажмите Enter или запятую"
                maxLength={30}
                disabled={editSkills.length >= 10}
              />

              <div className="text-xs text-gray-400 mt-1">
                Максимум 10 навыков, каждый до 30 символов
              </div>
            </div>
            {/* Выбор титульного бейджа */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Титул (бейдж)</label>
              {userBadges.length === 0 ? (
                <div className="text-gray-400 text-xs">У вас пока нет наград</div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {userBadges.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs ${selectedBadgeId === b.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                      onClick={() => setSelectedBadgeId(selectedBadgeId === b.id ? null : b.id)}
                    >
                      {BADGE_ICONS[b.name] || '🏅'}
                      <span className="mt-1 truncate max-w-[60px]">{b.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="w-full bg-primary-500 text-white rounded py-2 font-medium disabled:opacity-60"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                await supabase
                  .from("users")
                  .update({
                    name: editName,
                    avatar_url: editAvatar,
                    description: editDescription,
                    skills: editSkills,
                    display_badge_id: selectedBadgeId as any,
                  })
                  .eq("id", user.id);
                setShowEditModal(false);
                setSaving(false);
                window.location.reload();
              }}
              variant="primary"
              isLoading={saving}
            >
              Сохранить
            </Button>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default ProfilePage;
