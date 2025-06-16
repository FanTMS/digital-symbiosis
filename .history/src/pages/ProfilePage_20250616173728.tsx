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
];

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
  const [activeTab, setActiveTab] = useState<'services' | 'quizzes' | 'reviews' | 'orders'>('services');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState(false);

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
      .then(({ data }) => setQuizzes(data || []))
      .finally(() => setQuizLoading(false));
  }, [user?.id]);

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setDeletingQuiz(true);
    await supabase.from('quiz_questions').delete().eq('quiz_id', quizToDelete);
    await supabase.from('quizzes').delete().eq('id', quizToDelete);
    setQuizzes(qs => qs.filter(q => q.id !== quizToDelete));
    setDeletingQuiz(false);
    setQuizToDelete(null);
  };

  const menuItems = [
    {
      icon: CreditCard,
      label: "Мои кредиты",
      value: user?.credits,
      onClick: () => alert("Кредиты: " + user?.credits),
    },
    {
      icon: FileText,
      label: "Мои услуги",
      onClick: () => navigate("/services"),
    },
    {
      icon: Award,
      label: "Достижения",
      badge: Array.isArray((user as any)?.badges)
        ? (user as any).badges.length
        : undefined,
      onClick: () => navigate("/achievements"),
    },
    {
      icon: Gift,
      label: "Пригласить друзей",
      onClick: () => navigate("/referrals"),
    },
    {
      icon: Settings,
      label: "Настройки",
      onClick: () => navigate("/settings"),
    },
    {
      icon: ListChecks,
      label: "Мои квизы",
      onClick: () => setActiveTab('quizzes'),
    },
  ];

  // Реальный прогресс до следующего уровня
  const TASKS_FOR_NEXT_LEVEL = 20;
  const completedTasks = user?.completed_tasks || 0;
  const progressToNextLevel = Math.min(
    completedTasks / TASKS_FOR_NEXT_LEVEL,
    1,
  );

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
      <div className="px-4 mb-6">
        <h1 className="text-2xl font-bold mb-4">Профиль</h1>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar src={user.avatar_url} name={user.name} size={80} className="cursor-pointer border-2 border-primary-500" onClick={() => setShowEditModal(true)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {user.name}{" "}
                <span className="text-gray-400 text-base">
                  @{user.username}
                </span>
              </span>
              {isOwn && (
                <button
                  className="ml-2 p-1 rounded-full hover:bg-gray-100"
                  onClick={() => setShowEditModal(true)}
                  title="Редактировать профиль"
                >
                  <Pencil size={18} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Star size={18} className="text-yellow-400 fill-yellow-400" />

              <span className="font-medium">
                {user.rating?.toFixed(1) ?? "—"}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">
                Уровень: {user.level ?? "-"}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">
                Кредиты: {user.credits ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {/* Бейджи */}
              {Array.isArray((user as any).badges) &&
                (user as any).badges.length > 0 ? (
                (user as any).badges.map((b: any) => (
                  <span
                    key={b.badge_id}
                    title={b.badge?.name}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs gap-1"
                  >
                    <Award size={14} />
                    {b.badge?.name}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-xs">Бейджей нет</span>
              )}
            </div>
          </div>
          {!isOwn && (
            <Button
              className="ml-auto"
              leftIcon={<MessageCircle size={18} />}
              onClick={() => navigate(`/chat/${user.id}`)}
            >
              Написать сообщение
            </Button>
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
                    {item.badge !== undefined && (
                      <span className="ml-2 bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-bold">{item.badge}</span>
                    )}
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-400 transition" />
                  </button>
                ))}
              </div>
            )}

            {/* Вкладки */}
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-100 text-blue-900 shadow' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  <tab.icon size={18} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Контент вкладок */}
            {activeTab === 'services' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Отзывы */}
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
                {/* Выполненные заказы */}
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
                {/* Услуги пользователя */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-lg mb-2">
                    Услуги пользователя
                  </h3>
                  {services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                      <div className="text-3xl mb-2">🛠️</div>
                      <div className="font-medium mb-1">Нет активных услуг</div>
                      <div className="text-xs mb-2">
                        {isOwn
                          ? "Вы ещё не добавили ни одной услуги"
                          : "Пользователь ещё не добавил ни одной услуги"}
                      </div>
                      {isOwn && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => navigate("/create-service")}
                        >
                          Добавить услугу
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {services.map((s) => (
                        <div
                          key={s.id}
                          className="bg-white rounded-lg shadow p-3 flex flex-col"
                        >
                          <div className="font-medium mb-1">{s.title}</div>
                          <div className="text-xs text-gray-500 mb-1">
                            {s.category}
                          </div>
                          <div className="text-xs text-gray-500 mb-1">
                            {s.price} кр.
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/services/${s.id}`)}
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
              <div className="max-w-xl w-full mx-auto p-2 sm:p-6 bg-white rounded-xl shadow min-h-[60vh] flex flex-col">
                <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-blue-900 text-center">Мои квизы</h2>
                <Button variant="primary" className="mb-6 w-full py-3 text-base rounded-xl flex items-center justify-center gap-2" onClick={() => navigate('/quizzes/new')}>
                  <Plus size={20} /> <span>Создать квиз</span>
                </Button>
                {quizLoading ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400">Загрузка...</div>
                ) : quizzes.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">У вас пока нет квизов.</div>
                ) : (
                  <div className="flex flex-col gap-4 w-full">
                    {quizzes.map(quiz => (
                      <div
                        key={quiz.id}
                        className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-3xl shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all duration-300 hover:shadow-2xl hover:scale-[1.025] active:scale-95 group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-lg sm:text-xl text-blue-900 truncate mb-1 group-hover:underline transition-all">{quiz.title}</div>
                          <div className="text-gray-500 text-sm truncate">{quiz.description}</div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button size="lg" variant="outline" className="w-full sm:w-auto flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 rounded-2xl" onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}>
                            <Edit3 size={18} /> <span className="hidden xs:inline">Редактировать</span>
                          </Button>
                          <Button size="lg" variant="danger" className="w-full sm:w-auto flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 rounded-2xl" onClick={() => setQuizToDelete(quiz.id)}>
                            <Trash2 size={18} /> <span className="hidden xs:inline">Удалить</span>
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
                      <Button variant="danger" onClick={handleDeleteQuiz} loading={deletingQuiz} disabled={deletingQuiz}>Удалить</Button>
                    </div>
                  </div>
                </Modal>
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
      {isOwn && (
        <PromoCodeActivation user={user} />
      )}
    </motion.div>
  );
};

function PromoCodeActivation({ user }: { user: any }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    if (!code.trim()) {
      setError("Введите промокод");
      setLoading(false);
      return;
    }
    // Проверяем промокод
    const { data: promo, error: promoError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code.trim())
      .single();
    if (promoError || !promo) {
      setError("Промокод не найден");
      setLoading(false);
      return;
    }
    if (!promo.is_active) {
      setError("Промокод неактивен");
      setLoading(false);
      return;
    }
    if (promo.activated_by) {
      setError("Промокод уже был использован");
      setLoading(false);
      return;
    }
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      setError("Срок действия промокода истёк");
      setLoading(false);
      return;
    }
    // Всё ок — начисляем кредиты и отмечаем промокод как использованный
    await supabase.from("users").update({ credits: (user.credits || 0) + promo.amount }).eq("id", user.id);
    await supabase.from("promo_codes").update({ is_active: false, activated_by: user.id, activated_at: new Date().toISOString() }).eq("id", promo.id);
    setSuccess(`Промокод активирован! На ваш баланс начислено ${promo.amount} кредитов.`);
    setCode("");
    setLoading(false);
    setTimeout(() => window.location.reload(), 1500);
  };
  return (
    <form onSubmit={handleActivate} className="mb-6 bg-white rounded-lg shadow-card p-4 flex flex-col sm:flex-row items-center gap-3">
      <input
        type="text"
        className="border rounded px-3 py-2 flex-1"
        placeholder="Введите промокод"
        value={code}
        onChange={e => setCode(e.target.value)}
        disabled={loading}
      />
      <Button type="submit" variant="primary" size="md" disabled={loading}>
        {loading ? "Проверка..." : "Активировать"}
      </Button>
      {error && <div className="text-red-600 text-sm mt-2 w-full">{error}</div>}
      {success && <div className="text-green-600 text-sm mt-2 w-full">{success}</div>}
    </form>
  );
}

export default ProfilePage;
