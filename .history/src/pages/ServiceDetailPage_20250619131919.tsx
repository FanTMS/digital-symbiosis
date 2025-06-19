import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTelegram } from "../hooks/useTelegram";
import {
  Star,
  User,
  Clock,
  MessageCircle,
  Award,
  ChevronLeft,
  X,
  Loader2,
} from "lucide-react";
import Button from "../components/ui/Button";
import { servicesApi } from "../lib/api/services";
import { supabase } from "../lib/supabase";
import { ordersApi } from "../lib/api/orders";
import { chatApi } from "../lib/api/chat";
import { useUser } from "../contexts/UserContext";
import {
  useServices,
  useUpdateService,
  useDeleteService,
} from "../hooks/useServices";
import { Star as StarIcon, StarOff } from "lucide-react";
import { formatDate } from "../utils/formatters";
import QuizRunner from '../components/QuizRunner';
import { Avatar } from "../components/ui/Avatar";
import type { QuizQuestion, QuizAnswers } from '../types/models';
import Modal from '../components/ui/Modal';
import { useCreatePriceProposal } from '../hooks/usePriceProposals';

const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const { user } = useUser();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const [actionLoading, setActionLoading] = useState(false);

  const [service, setService] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [hasLeftReview, setHasLeftReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [showQuizPreview, setShowQuizPreview] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const createProposal = useCreatePriceProposal();

  // --- deadline modal ---
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState('');
  const [deadlineError, setDeadlineError] = useState<string | null>(null);

  useEffect(() => {
    if (tg) {
      tg.setHeaderColor("#0BBBEF");
      tg.BackButton.show();
      const handleBack = () => navigate("/services");
      tg.BackButton.onClick(handleBack);

      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick(handleBack);
      };
    }
  }, [tg, navigate]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    servicesApi
      .getService(id)
      .then((data) => {
        setService(data);
        setProvider(data?.user || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!service?.id || !user?.id) return;
    (async () => {
      // Проверяем завершённые заказы пользователя по этой услуге
      const { data: completedOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("service_id", service.id)
        .eq("client_id", user.id)
        .eq("status", "completed");
      setCanReview(!!completedOrders && completedOrders.length > 0);
      // Получаем отзывы по услуге через JOIN с orders
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*, order:orders!reviews_order_id_fkey(service_id, client_id, provider_id)")
        .eq("order.service_id", service.id);
      setReviews(reviewsData || []);
      if (user?.id && reviewsData?.some((r: any) => r.user_id === user.id))
        setHasLeftReview(true);
    })();
  }, [service?.id, user?.id]);

  useEffect(() => {
    if (!user?.id || !service?.id) return;
    (async () => {
      const { data } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .eq("service_id", service.id)
        .single();
      setIsFavorite(!!data);
    })();
  }, [user?.id, service?.id]);

  useEffect(() => {
    if (service?.quiz_id) {
      setQuizLoading(true);
      // getQuizQuestions(service.quiz_id)
      //   .then((qs: QuizQuestion[]) => setQuizQuestions(qs))
      //   .catch(() => setQuizError('Ошибка загрузки квиза'))
      //   .finally(() => setQuizLoading(false));
    } else {
      setQuizQuestions(null);
    }
  }, [service?.quiz_id]);

  const handleCreateOrder = async (deadlineIso: string) => {
    if (service && provider?.id && user?.id) {
      if (user.id === provider.id) {
        alert("Вы не можете заказать свою собственную услугу");
        return;
      }
      if ((user.credits || 0) < service.price) {
        alert("Недостаточно кредитов для заказа услуги. Пожалуйста, пополните баланс.");
        return;
      }
      // Проверка на повторный заказ
      const { data: existingOrders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("service_id", service.id)
        .eq("client_id", user.id)
        .in("status", ["pending", "accepted", "in_progress"]);
      if (existingOrders && existingOrders.length > 0) {
        alert("Вы уже заказали эту услугу и она ещё не завершена");
        return;
      }

      // 1. Создаём заказ с удержанием средств
      const order = await ordersApi.createOrder({
        service_id: service.id,
        client_id: user.id,
        provider_id: provider.id,
        status: "pending",
        price: service.price,
        deadline_at: deadlineIso,
      });

      // Создаём или находим чат
      const chat = await chatApi.getOrCreateChat(user.id, provider.id);

      // 3. Системное сообщение покупателю
      await chatApi.sendMessage(
        chat.id,
        user.id, // теперь sender_id = user.id
        `Здравствуйте! Вы только что заказали услугу: "${service.title}", стоимость: ${service.price} кр., ожидает подтверждения у исполнителя.`,
        { type: "system", orderId: order.id, role: "client" },
      );

      // 4. Системное сообщение исполнителю с action-кнопками
      await chatApi.sendMessage(
        chat.id,
        provider.id, // теперь sender_id = provider.id
        `Здравствуйте, пользователь: ${user.name} приобрёл вашу услугу за ${service.price} кредитов.\nВам необходимо принять или отклонить.`,
        {
          type: "system_action",
          orderId: order.id,
          role: "provider",
          clientName: user.name,
          serviceTitle: service.title,
          price: service.price,
          providerId: provider.id,
        },
      );

      // Перенаправляем пользователя в чат
      navigate(`/chat/${chat.id}`);
    }
  };

  const handleContactProvider = async () => {
    if (provider?.id && user?.id) {
      const chat = await chatApi.getOrCreateChat(user.id, provider.id);
      console.log("chat:", chat);
      console.log("chat.id:", chat?.id);
      navigate(`/chat/${chat.id}`);
    } else {
      alert("Пользователь не найден");
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "education":
        return "Образование";
      case "design":
        return "Дизайн";
      case "it":
        return "IT и разработка";
      case "languages":
        return "Языки";
      case "business":
        return "Бизнес";
      case "lifestyle":
        return "Лайфстайл";
      case "writing":
        return "Копирайтинг";
      case "music":
        return "Музыка";
      default:
        return "Другое";
    }
  };

  const handleToggleFavorite = async () => {
    if (!user?.id || !service?.id) return;
    setFavoriteLoading(true);
    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("service_id", service.id);
      setIsFavorite(false);
      alert("Услуга удалена из избранного");
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: user.id, service_id: service.id });
      setIsFavorite(true);
      alert("Услуга добавлена в избранное");
    }
    setFavoriteLoading(false);
  };

  const handleOrderWithQuiz = async (answers: QuizAnswers) => {
    setQuizAnswers(answers);
    setShowQuiz(false);
    // Запрашиваем дедлайн у пользователя (простой prompt)
    const dlInput = window.prompt('Введите дедлайн в формате ГГГГ-ММ-ДД ЧЧ:ММ', '');
    const dlIso = dlInput ? new Date(dlInput).toISOString() : undefined;

    // 1. Создаём заказ с quiz_answers и дедлайном
    if (service && provider?.id && user?.id) {
      if (user.id === provider.id) {
        alert('Вы не можете заказать свою собственную услугу');
        return;
      }
      if ((user.credits || 0) < service.price) {
        alert('Недостаточно кредитов для заказа услуги. Пожалуйста, пополните баланс.');
        return;
      }
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('service_id', service.id)
        .eq('client_id', user.id)
        .in('status', ['pending', 'accepted', 'in_progress']);
      if (existingOrders && existingOrders.length > 0) {
        alert('Вы уже заказали эту услугу и она ещё не завершена');
        return;
      }
      // 1. Создаём заказ с quiz_answers и дедлайном
      const order = await ordersApi.createOrder({
        service_id: service.id,
        client_id: user.id,
        provider_id: provider.id,
        status: 'pending',
        price: service.price,
        quiz_answers: answers,
        deadline_at: dlIso,
      });
      const chat = await chatApi.getOrCreateChat(user.id, provider.id);
      await chatApi.sendMessage(
        chat.id,
        user.id,
        `Здравствуйте! Вы только что заказали услугу: "${service.title}", стоимость: ${service.price} кр., ожидает подтверждения у исполнителя.`,
        { type: 'system', orderId: order.id, role: 'client' },
      );
      await chatApi.sendMessage(
        chat.id,
        provider.id,
        `Здравствуйте, пользователь: ${user.name} приобрёл вашу услугу за ${service.price} кредитов.\nВам необходимо принять или отклонить.`,
        {
          type: 'system_action',
          orderId: order.id,
          role: 'provider',
          clientName: user.name,
          serviceTitle: service.title,
          price: service.price,
          providerId: provider.id,
        },
      );
      navigate(`/chat/${chat.id}`);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 min-h-screen">
        <div className="flex items-center mb-4">
          <ChevronLeft
            size={20}
            onClick={() => navigate("/services")}
            className="mr-2"
          />
          <div className="bg-gray-200 h-6 w-48 rounded animate-pulse"></div>
        </div>
        <div className="bg-gray-200 h-40 w-full rounded animate-pulse mb-4"></div>
        <div className="bg-gray-200 h-20 w-full rounded animate-pulse mb-4"></div>
        <div className="bg-gray-200 h-40 w-full rounded animate-pulse"></div>
      </div>
    );
  }

  if (!service || !provider) {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-semibold mb-2">Услуга не найдена</h2>
        <p className="text-gray-600 mb-4 text-center">
          Запрашиваемая услуга не существует или была удалена
        </p>
        <Button onClick={() => navigate("/services")}>Вернуться к списку услуг</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white flex justify-center items-start pb-20"
    >
      <div className="w-full max-w-md mx-auto px-2 sm:px-0 mt-2">
        {/* Фото услуги */}
        {service.image_url && (
          <div className="mb-4 rounded-2xl overflow-hidden shadow-lg">
            <img
              src={service.image_url}
              alt={service.title}
              className="w-full h-56 object-cover"
              style={{ borderRadius: 18 }}
            />
          </div>
        )}
        {/* Категория, рейтинг, избранное */}
        <div className="flex items-center mb-3">
          <span className="inline-flex items-center text-xs font-semibold bg-blue-100 text-blue-800 py-1 px-3 rounded-full shadow-sm">
            <Award size={14} className="mr-1" />
            {getCategoryName(service.category)}
          </span>
          <div className="ml-auto flex items-center">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <span className="ml-1 text-sm font-medium">
              {service.rating?.toFixed(1) || "—"}
            </span>
            {service.reviews_count && (
              <span className="ml-1 text-sm text-gray-500">
                ({service.reviews_count})
              </span>
            )}
            {user && user.id !== provider.id && (
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className={`ml-3 p-1 rounded-full hover:bg-yellow-100 transition ${isFavorite ? "text-yellow-400" : "text-gray-300"}`}
                aria-label={
                  isFavorite ? "Удалить из избранного" : "Добавить в избранное"
                }
              >
                <StarIcon fill={isFavorite ? "#facc15" : "none"} />
              </button>
            )}
          </div>
        </div>
        {/* Название услуги */}
        <h1 className="text-2xl font-extrabold mb-2 flex items-center gap-2 text-blue-900">
          {service.title}
        </h1>
        {user && provider && user.id === provider.id && (
          <div className="flex flex-col xs:flex-row gap-2 mb-4 w-full max-w-xs">
            <Button variant="outline" size="sm" className="flex-1 min-w-0" onClick={() => navigate(`/services/${service.id}/edit`)}>
              Редактировать
            </Button>
            {service.quiz_id && quizQuestions && (
              <Button variant="outline" size="sm" className="flex-1 min-w-0" onClick={() => setShowQuizPreview(true)}>
                Предпросмотр квиза
              </Button>
            )}
          </div>
        )}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Clock size={14} className="mr-1" />
          <span>Опубликовано {formatDate(new Date(service.created_at))}</span>
        </div>
        {/* Провайдер */}
        <div className="bg-white p-4 rounded-3xl shadow-lg flex items-center gap-4 mb-5 transition-all duration-300 hover:shadow-2xl hover:scale-[1.015] cursor-pointer" onClick={() => navigate(`/profile/${provider.id}`)}>
          <Avatar src={provider.avatar_url} name={provider.name} size={56} className="border-2 border-blue-200 shadow" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-base text-gray-900">{provider.name}</span>
              {provider.role === "admin" && (
                <span className="ml-1 text-xs bg-yellow-100 px-2 py-0.5 rounded-full">админ</span>
              )}
              {provider.completed_tasks > 30 && provider.rating > 4.8 && (
                <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Проверенный пользователь</span>
              )}
            </div>
            <div className="flex items-center text-xs text-gray-500 gap-2">
              <Star size={13} className="text-yellow-400 fill-yellow-400" />
              <span>{provider.rating !== null ? provider.rating.toFixed(1) : "—"}</span>
              <span className="mx-1">•</span>
              <span>{provider.completed_tasks ?? 0} заказов</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<MessageCircle size={14} />}
            onClick={(e) => { e.stopPropagation(); handleContactProvider(); }}
          >
            Связаться
          </Button>
        </div>
        {/* Описание и навыки */}
        <div className="mb-5 bg-white p-4 rounded-3xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
          <h2 className="text-lg font-semibold mb-2 text-blue-800">Описание услуги</h2>
          <p className="text-gray-700 leading-relaxed mb-4 text-base">
            {service.description}
          </p>
          <div className="mb-2">
            <h3 className="font-medium mb-2">Навыки</h3>
            <div className="flex flex-wrap gap-2">
              {(service.skills ?? []).map((skill: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm gap-1"
                >
                  <Award size={12} /> {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Стоимость и заказы */}
        <div className="bg-white p-4 shadow-2xl border-t border-gray-200 rounded-3xl mb-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm text-gray-500">Стоимость</span>
              <div className="flex items-center gap-2 text-2xl font-extrabold text-orange-500">
                <span>{service.price}</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#FDBA74" />
                  <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">₽</text>
                </svg>
                <span className="text-base font-bold text-gray-500 ml-1">кредитов</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500">Выполнено заказов</span>
              <div className="text-xl font-bold">{provider.completed_tasks ?? 0}</div>
            </div>
          </div>
          {service.quiz_id && quizQuestions && showQuiz && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="relative w-full max-w-lg mx-auto">
                <QuizRunner
                  questions={quizQuestions}
                  onSubmit={handleOrderWithQuiz}
                  onCancel={() => setShowQuiz(false)}
                />
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                  onClick={() => setShowQuiz(false)}
                  aria-label="Закрыть квиз"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          )}
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => service.quiz_id ? setShowQuiz(true) : setShowDeadlineModal(true)}
            disabled={showQuiz || quizLoading}
          >
            {service.quiz_id ? 'Пройти квиз для заказа' : 'Заказать услугу'}
          </Button>
        </div>
        {user && provider && user.id !== provider.id && (
          <Button
            variant="outline"
            fullWidth
            size="lg"
            className="text-lg py-3 rounded-xl shadow-md mt-2"
            onClick={() => setShowPriceModal(true)}
          >
            Предложить свою цену
          </Button>
        )}
        {/* Оставить отзыв */}
        {user && user.id !== provider.id && canReview && !hasLeftReview && (
          <div className="bg-white rounded-2xl shadow-card p-4 mb-6 mt-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
            <h3 className="font-semibold mb-2">Оставить отзыв</h3>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`text-2xl ${reviewRating >= i ? "text-yellow-400" : "text-gray-300"}`}
                  onClick={() => setReviewRating(i)}
                  aria-label={`Поставить ${i} звёзд`}
                >
                  <StarIcon fill={reviewRating >= i ? "#facc15" : "none"} />
                </button>
              ))}
            </div>
            <textarea
              className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50 mb-2"
              rows={3}
              placeholder="Ваш отзыв..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={300}
            />
            <Button
              variant="primary"
              disabled={
                reviewSubmitting ||
                reviewRating === 0 ||
                reviewText.trim().length < 3
              }
              onClick={async () => {
                setReviewSubmitting(true);
                // Найти order_id для этого пользователя и услуги
                const { data: order } = await supabase
                  .from("orders")
                  .select("id")
                  .eq("service_id", service.id)
                  .eq("client_id", user.id)
                  .eq("status", "completed")
                  .limit(1);
                const orderId = order && order.length > 0 ? order[0].id : null;
                if (!orderId) {
                  setReviewSubmitting(false);
                  alert("Не найден завершённый заказ для этой услуги");
                  return;
                }
                const { error } = await supabase.from("reviews").insert({
                  order_id: orderId,
                  user_id: user.id,
                  rating: reviewRating,
                  comment: reviewText.trim(),
                });
                setReviewSubmitting(false);
                if (!error) {
                  setHasLeftReview(true);
                  setReviews([
                    ...reviews,
                    {
                      order_id: orderId,
                      user_id: user.id,
                      rating: reviewRating,
                      comment: reviewText.trim(),
                      order: { service_id: service.id },
                    },
                  ]);
                  setReviewText("");
                  setReviewRating(0);
                  alert("Спасибо за отзыв!");
                } else {
                  alert("Ошибка при отправке отзыва");
                }
              }}
            >
              Оставить отзыв
            </Button>
          </div>
        )}
        {/* Блок отзывов */}
        {reviews && reviews.length > 0 && (
          <div className="bg-white rounded-3xl shadow p-4 mb-6">
            <h3 className="text-lg font-bold mb-4 text-blue-800">Отзывы об услуге</h3>
            <div className="flex flex-col gap-4">
              {reviews.map((review, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-blue-50/40 rounded-2xl p-3 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                  <span
                    className="flex items-center gap-2 cursor-pointer group/avatar"
                    onClick={() => navigate(`/profile/${review.user_id}`)}
                    title={`Открыть профиль пользователя ${review.user_name}`}
                  >
                    <Avatar src={review.user_avatar_url} name={review.user_name} size={40} className="border group-hover/avatar:ring-2 group-hover/avatar:ring-blue-400 transition" />
                    <span className="font-semibold text-gray-900 text-sm group-hover/avatar:underline group-hover/avatar:text-blue-600 transition">{review.user_name || 'Пользователь'}</span>
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <StarIcon key={i} size={14} className={review.rating >= i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} fill={review.rating >= i ? '#facc15' : 'none'} />
                        ))}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">{review.created_at ? formatDate(new Date(review.created_at)) : ''}</span>
                    </div>
                    <div className="text-gray-700 text-sm leading-snug">{review.comment}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {showQuizPreview && service.quiz_id && quizQuestions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="relative w-full max-w-lg mx-auto">
              <QuizRunner
                questions={quizQuestions}
                onSubmit={() => setShowQuizPreview(false)}
                onCancel={() => setShowQuizPreview(false)}
              />
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                onClick={() => setShowQuizPreview(false)}
                aria-label="Закрыть предпросмотр"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        )}
        {/* Модалка для предложения цены */}
        <Modal isOpen={showPriceModal} onClose={() => { setShowPriceModal(false); setPriceError(null); }}>
          <h2 className="text-xl font-bold mb-3">Предложить свою цену</h2>
          <div className="mb-2 text-gray-600 text-sm">
            Минимальная цена исполнителя: <b>{service.min_price ?? service.price} кр.</b>
          </div>
          <input
            type="number"
            className="w-full border rounded px-3 py-2 mb-2"
            placeholder="Введите вашу цену"
            value={proposedPrice}
            min={service.min_price ?? service.price}
            onChange={e => setProposedPrice(e.target.value)}
          />
          {priceError && <div className="text-red-500 text-sm mb-2">{priceError}</div>}
          <Button
            variant="primary"
            fullWidth
            disabled={createProposal.isLoading}
            onClick={async () => {
              setPriceError(null);
              const priceNum = Number(proposedPrice);
              if (!priceNum || priceNum < (service.min_price ?? service.price)) {
                setPriceError(`Цена не может быть ниже ${service.min_price ?? service.price} кр.`);
                return;
              }
              try {
                await createProposal.mutateAsync({
                  order_id: '', // будет подставляться при торге по заказу, здесь пока ''
                  from_user_id: user.id,
                  to_user_id: provider.id,
                  proposed_price: priceNum,
                });
                setShowPriceModal(false);
                setProposedPrice('');
                setSuccessMsg('Ваше предложение отправлено исполнителю!');
              } catch (e: any) {
                setPriceError(e.message || 'Ошибка отправки предложения');
              }
            }}
          >
            Отправить предложение
          </Button>
        </Modal>
        {/* Уведомление об успехе */}
        {successMsg && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-100 text-green-800 px-4 py-2 rounded-xl shadow-lg z-50">
            {successMsg}
            <button className="ml-2 text-green-700 font-bold" onClick={() => setSuccessMsg(null)}>×</button>
          </div>
        )}
        {/* Модалка выбора дедлайна */}
        <Modal isOpen={showDeadlineModal} onClose={() => { setShowDeadlineModal(false); setDeadlineError(null); }}>
          <h2 className="text-xl font-bold mb-3">Укажите срок выполнения</h2>
          <input
            type="datetime-local"
            value={deadlineValue}
            onChange={e => setDeadlineValue(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-2"
          />
          {deadlineError && <div className="text-red-500 text-sm mb-2">{deadlineError}</div>}
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              if (!deadlineValue) {
                setDeadlineError('Пожалуйста, выберите дедлайн');
                return;
              }
              const deadlineIso = new Date(deadlineValue).toISOString();
              setShowDeadlineModal(false);
              handleCreateOrder(deadlineIso);
            }}
          >
            Подтвердить заказ
          </Button>
        </Modal>
      </div>
    </motion.div>
  );
};

export default ServiceDetailPage;
