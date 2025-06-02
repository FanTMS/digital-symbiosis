import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';
import { Star, User, Clock, MessageCircle, Award, ChevronLeft, X } from 'lucide-react';
import Button from '../components/ui/Button';
import { servicesApi } from '../lib/api/services';
import type { Database } from '../types/supabase';
import { ordersApi } from '../lib/api/orders';
import { supabase } from '../lib/supabase';
import { chatApi } from '../lib/api/chat';
import { useToast } from '../components/ui/ToastProvider';
import { useUser } from '../contexts/UserContext';
import { useServices, useUpdateService, useDeleteService } from '../hooks/useServices';
import { Star as StarIcon, StarOff } from 'lucide-react';
type Service = Database['public']['Tables']['services']['Row'];
type UserType = Database['public']['Tables']['users']['Row'];
import { formatDate } from '../utils/formatters';

const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const { showToast } = useToast();
  const { user } = useUser();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const [actionLoading, setActionLoading] = useState(false);
  
  const [service, setService] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [hasLeftReview, setHasLeftReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  useEffect(() => {
    if (tg) {
      tg.setHeaderColor('#0BBBEF');
      tg.BackButton.show();
      const handleBack = () => navigate('/services');
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
    servicesApi.getService(id)
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
        .from('orders')
        .select('*')
        .eq('service_id', service.id)
        .eq('client_id', user.id)
        .eq('status', 'completed');
      setCanReview(!!completedOrders && completedOrders.length > 0);
      // Получаем отзывы
      const { data } = await supabase.from('reviews').select('*').eq('service_id', service.id);
      setReviews(data || []);
      if (user?.id && data?.some((r: any) => r.user_id === user.id)) setHasLeftReview(true);
    })();
  }, [service?.id, user?.id]);
  
  useEffect(() => {
    if (!user?.id || !service?.id) return;
    (async () => {
      const { data } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_id', service.id)
        .single();
      setIsFavorite(!!data);
    })();
  }, [user?.id, service?.id]);
  
  const handleOrder = async () => {
    if (service && provider?.id && user?.id) {
      if (user.id === provider.id) {
        showToast('Вы не можете заказать свою собственную услугу', 'error');
        return;
      }
      // Проверка на повторный заказ
      const { data: existingOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('service_id', service.id)
        .eq('client_id', user.id)
        .in('status', ['pending', 'accepted', 'in_progress']);
      if (existingOrders && existingOrders.length > 0) {
        showToast('Вы уже заказали эту услугу и она ещё не завершена', 'error');
        return;
      }

      // 1. Создаём заказ
      const order = await ordersApi.createOrder({
        service_id: service.id,
        client_id: user.id,
        provider_id: provider.id,
        status: 'pending',
        price: service.price,
      });

      // 2. Списываем кредиты у пользователя
      await supabase
        .from('users')
        .update({ credits: (user.credits || 0) - service.price })
        .eq('id', user.id);

      // Создаём или находим чат
      const chat = await chatApi.getOrCreateChat(user.id, provider.id);

      // 3. Системное сообщение покупателю
      await chatApi.sendMessage(
        chat.id,
        user.id, // теперь sender_id = user.id
        `Здравствуйте! Вы только что заказали услугу: "${service.title}", стоимость: ${service.price} кр., ожидает подтверждения у исполнителя.`,
        { type: 'system', orderId: order.id, role: 'client' }
      );

      // 4. Системное сообщение исполнителю с action-кнопками
      await chatApi.sendMessage(
        chat.id,
        provider.id, // теперь sender_id = provider.id
        `Здравствуйте, пользователь: ${user.name} приобрёл вашу услугу за ${service.price} кредитов.\nВам необходимо принять или отклонить.`,
        { type: 'system_action', orderId: order.id, role: 'provider', clientName: user.name, serviceTitle: service.title, price: service.price }
      );

      // Перенаправляем пользователя в чат
      navigate(`/chat/${chat.id}`);
    }
  };
  
  const handleContactProvider = async () => {
    if (provider?.id && user?.id) {
      const chat = await chatApi.getOrCreateChat(user.id, provider.id);
      console.log('chat:', chat);
      console.log('chat.id:', chat?.id);
      navigate(`/chat/${chat.id}`);
    } else {
      alert('Пользователь не найден');
    }
  };
  
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'education':
        return 'Образование';
      case 'design':
        return 'Дизайн';
      case 'it':
        return 'IT и разработка';
      case 'languages':
        return 'Языки';
      case 'business':
        return 'Бизнес';
      case 'lifestyle':
        return 'Лайфстайл';
      case 'writing':
        return 'Копирайтинг';
      case 'music':
        return 'Музыка';
      default:
        return 'Другое';
    }
  };

  const handleToggleFavorite = async () => {
    if (!user?.id || !service?.id) return;
    setFavoriteLoading(true);
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('service_id', service.id);
      setIsFavorite(false);
      showToast('Услуга удалена из избранного', 'info');
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, service_id: service.id });
      setIsFavorite(true);
      showToast('Услуга добавлена в избранное', 'success');
    }
    setFavoriteLoading(false);
  };

  if (loading) {
    return (
      <div className="px-4 py-6 min-h-screen">
        <div className="flex items-center mb-4">
          <ChevronLeft size={20} onClick={() => navigate('/services')} className="mr-2" />
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
        <Button onClick={() => navigate('/services')}>Вернуться к списку услуг</Button>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-2">
      <div className="px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center mb-1">
            <span className="inline-flex items-center text-xs font-semibold bg-blue-100 text-blue-800 py-1 px-3 rounded-full shadow-sm">
              <Award size={14} className="mr-1" />
              {getCategoryName(service.category)}
            </span>
            <div className="ml-auto flex items-center">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="ml-1 text-sm font-medium">{service.rating?.toFixed(1) || '—'}</span>
              {service.reviews_count && (
                <span className="ml-1 text-sm text-gray-500">({service.reviews_count})</span>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-2 animate-fade-in">
            {service.title}
            {user && user.id !== provider.id && (
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className={`ml-2 p-1 rounded-full hover:bg-yellow-100 transition ${isFavorite ? 'text-yellow-400' : 'text-gray-300'}`}
                aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <StarIcon fill={isFavorite ? '#facc15' : 'none'} />
              </button>
            )}
          </h1>
          <div className="flex items-center text-sm text-gray-500">
            <Clock size={14} className="mr-1" />
            <span>Опубликовано {formatDate(new Date(service.created_at))}</span>
          </div>
        </motion.div>
        
        {/* Provider info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-2xl shadow-xl mb-6 flex items-center gap-4"
        >
          <div className="relative">
            <img
              src={provider.avatar_url || 'https://images.pexels.com/photos/4926674/pexels-photo-4926674.jpeg?auto=compress&cs=tinysrgb&w=150'}
              alt={provider.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              {provider.name}
              {provider.role === 'admin' && <span className="ml-1 text-xs bg-yellow-100 px-2 py-0.5 rounded-full">админ</span>}
            </h3>
            <div className="flex items-center text-sm mt-1">
              <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
              <span>{provider.rating !== null ? provider.rating.toFixed(1) : '—'}</span>
              <span className="mx-1 text-gray-400">•</span>
              <span className="text-gray-500">{provider.completed_tasks ?? 0} заданий</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<MessageCircle size={14} />}
            onClick={handleContactProvider}
          >
            Связаться
          </Button>
        </motion.div>
        
        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 bg-white p-5 rounded-2xl shadow"
        >
          <h2 className="text-lg font-semibold mb-2">Описание услуги</h2>
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
        </motion.div>
        
        {/* Price and Order */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="fixed bottom-16 left-0 right-0 bg-white p-5 shadow-2xl border-t border-gray-200 z-10 rounded-t-2xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm text-gray-500">Стоимость</span>
              <div className="flex items-center gap-2 text-2xl font-extrabold text-orange-500">
                <span>{service.price}</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#FDBA74" /><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">₽</text></svg>
                <span className="text-base font-bold text-gray-500 ml-1">кредитов</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500">Выполнено заказов</span>
              <div className="text-xl font-bold">{provider.completed_tasks ?? 0}</div>
            </div>
          </div>
          <Button 
            variant="primary" 
            fullWidth 
            size="lg"
            className="text-lg py-3 rounded-xl shadow-md bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500"
            onClick={handleOrder}
          >
            Заказать услугу
          </Button>
        </motion.div>
        
        {/* Кнопки для владельца услуги */}
        {user?.id === service.user_id && (
          <div className="flex gap-2 mt-4">
            <Button
              variant={service.is_active === false ? 'outline' : 'secondary'}
              size="sm"
              leftIcon={<X size={14} />}
              isLoading={actionLoading && service.is_active !== false}
              onClick={async () => {
                setActionLoading(true);
                try {
                  await updateService.mutateAsync({ id: service.id, updates: { is_active: service.is_active === false ? true : false } });
                  showToast(service.is_active === false ? 'Услуга активирована' : 'Услуга приостановлена', 'success');
                  setService({ ...service, is_active: service.is_active === false ? true : false });
                } catch (e: any) {
                  showToast('Ошибка: ' + e.message, 'error');
                }
                setActionLoading(false);
              }}
            >
              {service.is_active === false ? 'Включить услугу' : 'Приостановить услугу'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<X size={14} />}
              isLoading={actionLoading && service.is_active !== false}
              onClick={async () => {
                if (!window.confirm('Удалить услугу?')) return;
                setActionLoading(true);
                try {
                  // Мягкое удаление: делаем услугу неактивной
                  await updateService.mutateAsync({ id: service.id, updates: { is_active: false } });
                  showToast('Услуга перемещена в архив', 'success');
                  navigate('/services');
                } catch (e: any) {
                  showToast('Ошибка: ' + e.message, 'error');
                }
                setActionLoading(false);
              }}
            >
              Удалить услугу
            </Button>
          </div>
        )}
        
        {/* Перед списком отзывов */}
        {user && user.id !== provider.id && canReview && !hasLeftReview && (
          <div className="bg-white rounded-lg shadow-card p-4 mb-6">
            <h3 className="font-semibold mb-2">Оставить отзыв</h3>
            <div className="flex items-center gap-2 mb-2">
              {[1,2,3,4,5].map(i => (
                <button
                  key={i}
                  type="button"
                  className={`text-2xl ${reviewRating >= i ? 'text-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setReviewRating(i)}
                  aria-label={`Поставить ${i} звёзд`}
                >
                  <StarIcon fill={reviewRating >= i ? '#facc15' : 'none'} />
                </button>
              ))}
            </div>
            <textarea
              className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50 mb-2"
              rows={3}
              placeholder="Ваш отзыв..."
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              maxLength={300}
            />
            <Button
              variant="primary"
              disabled={reviewSubmitting || reviewRating === 0 || reviewText.trim().length < 3}
              onClick={async () => {
                setReviewSubmitting(true);
                const { error } = await supabase.from('reviews').insert({
                  service_id: service.id,
                  user_id: user.id,
                  rating: reviewRating,
                  comment: reviewText.trim(),
                });
                setReviewSubmitting(false);
                if (!error) {
                  setHasLeftReview(true);
                  setReviews([...reviews, { service_id: service.id, user_id: user.id, rating: reviewRating, comment: reviewText.trim() }]);
                  setReviewText('');
                  setReviewRating(0);
                  showToast('Спасибо за отзыв!', 'success');
                } else {
                  showToast('Ошибка при отправке отзыва', 'error');
                }
              }}
            >Оставить отзыв</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetailPage;