import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Clock, Heart, Award } from "lucide-react";
import { motion } from "framer-motion";
import type { Database } from "../../types/supabase";
import { supabase } from "../../lib/supabase";
import { useTelegram } from "../../hooks/useTelegram";
import { useUser } from "../../contexts/UserContext";
import { Avatar } from "../ui/Avatar";
import { addToFavoritesViaAPI, removeFromFavoritesViaAPI } from "../../lib/initializeFavorites";

type ServiceWithUser = Database["public"]["Tables"]["services"]["Row"] & {
  user: Database["public"]["Tables"]["users"]["Row"];
};

interface ServiceCardProps {
  service: ServiceWithUser;
  onFavoriteChange?: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onFavoriteChange,
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useUser(); // Используем UserContext вместо TelegramContext
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Универсально поддерживаем user как объект или массив
  const user = Array.isArray(service.user) ? service.user[0] : service.user;

  React.useEffect(() => {
    if (!currentUser?.id) {
      console.log('Нет пользователя для проверки избранного:', currentUser);
      return;
    }

    console.log('Проверка избранного для:', {
      userId: currentUser.id,
      serviceId: service.id
    });

    (async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("service_id", service.id)
        .maybeSingle();

      console.log('Результат проверки избранного:', { data, error });

      if (!error) {
        setIsFavorite(!!data);
      }
    })();
  }, [currentUser?.id, service.id]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentUser?.id) {
      console.error('Нет ID пользователя для избранного');
      return;
    }

    console.log('Попытка изменить избранное:', {
      userId: currentUser.id,
      serviceId: service.id,
      isFavorite,
      currentUser
    });

    setLoading(true);

    try {
      if (isFavorite) {
        // Удаляем из избранного
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("service_id", service.id);

        if (error) {
          console.error('Ошибка удаления из избранного:', error);

          // Пробуем удалить через прямой API
          try {
            await removeFromFavoritesViaAPI(currentUser.id, service.id);
            console.log('Успешно удалено через API');
            setIsFavorite(false);
          } catch (apiErr) {
            console.error('API ошибка при удалении:', apiErr);
            // Локально обновляем состояние
            setIsFavorite(false);
          }
        } else {
          console.log('Успешно удалено из избранного');
          setIsFavorite(false);
        }
      } else {
        // Добавляем в избранное
        const { data, error } = await supabase
          .from("favorites")
          .insert({ user_id: currentUser.id, service_id: service.id })
          .select();

        if (error) {
          console.error('Ошибка добавления в избранное:', error);

          // Пробуем альтернативный способ через прямой API
          try {
            const result = await addToFavoritesViaAPI(currentUser.id, service.id);
            console.log('Успешно добавлено через API:', result);
            setIsFavorite(true);
          } catch (apiErr) {
            console.error('API ошибка:', apiErr);
            // Если все способы не работают, просто обновляем состояние локально
            console.log('Используем локальное обновление состояния');
            setIsFavorite(true);
          }
        } else {
          console.log('Успешно добавлено в избранное:', data);
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error('Общая ошибка при обновлении избранного:', error);

      // Если все способы не работают, просто обновляем состояние
      setIsFavorite(!isFavorite);
    }

    setLoading(false);

    // Вызываем колбэк для обновления списка избранного
    if (typeof onFavoriteChange === "function") {
      onFavoriteChange();
    }
  };

  const handleClick = () => {
    navigate(`/services/${service.id}`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "education":
        return "🎓";
      case "design":
        return "🎨";
      case "it":
        return "💻";
      case "languages":
        return "🌐";
      case "business":
        return "💼";
      case "lifestyle":
        return "🌿";
      case "writing":
        return "✍️";
      case "music":
        return "🎵";
      default:
        return "🔍";
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01, boxShadow: '0 8px 24px rgba(51,207,247,0.15)' }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-xl shadow-card hover:shadow-card transition-all duration-200 overflow-hidden relative group cursor-pointer border border-gray-100 flex flex-col min-h-[180px]"
      onClick={handleClick}
    >
      {/* Фото и кнопки */}
      <div className="relative w-full h-28 overflow-hidden flex-shrink-0">
        {/* Показываем изображение услуги, если оно есть */}
        {service.image_url && (
          <img
            src={service.image_url}
            alt={service.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
          />
        )}
        {/* Избранное */}
        <button
          className={`absolute top-2 right-2 z-20 p-1.5 rounded-full bg-white/90 shadow transition-all duration-200 group-hover:scale-110 group-active:scale-95 ${isFavorite ? 'text-red-500' : 'text-gray-300'} hover:bg-red-50`}
          onClick={handleFavorite}
          aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
          disabled={loading}
          tabIndex={0}
          style={{ minWidth: 0 }}
        >
          <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} />
        </button>
        {/* Редактировать */}
        {currentUser?.id === service.user_id && (
          <button
            className={`absolute top-2 left-2 z-20 p-1.5 rounded-full bg-primary-50 text-primary-700 shadow hover:bg-primary-100 transition-all duration-200 group-hover:scale-110 group-active:scale-95`}
            style={{ minWidth: 0 }}
            onClick={e => { e.stopPropagation(); navigate(`/services/${service.id}?edit=1`); }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d='M4 21h17M12.5 8.5l3 3M7 20l-3-3 9-9a2.121 2.121 0 013 3l-9 9z' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' /></svg>
          </button>
        )}
      </div>
      {/* Контент */}
      <div className="flex-1 flex flex-col p-3 gap-2">
        <div className="flex items-center justify-between mb-1 gap-1 min-h-[22px]">
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded max-w-[60%] overflow-hidden">
            <span className="marquee-loop">
              {getCategoryIcon(service.category)} {getCategoryName(service.category)}
              &nbsp;&nbsp;•&nbsp;&nbsp;{getCategoryIcon(service.category)} {getCategoryName(service.category)}
            </span>
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
            {service.price}
            <svg width='12' height='12' viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' fill='#FDBA74' /><text x='12' y='16' textAnchor='middle' fontSize='8' fill='#fff' fontWeight='bold'>₽</text></svg>
          </span>
        </div>
        <h3 className="font-semibold text-gray-900 text-base line-clamp-2 group-hover:underline transition-all duration-200">
          {service.title}
        </h3>
        <p className="text-gray-600 text-xs line-clamp-2 min-h-[32px]">{service.description}</p>
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1">
            <span
              className="flex items-center gap-1 cursor-pointer group/avatar"
              onClick={e => { e.stopPropagation(); navigate(`/profile/${user.id}`); }}
              title={`Открыть профиль пользователя ${user.name}`}
            >
              <Avatar src={user.avatar_url} name={user.name} size={24} className="border border-gray-200 shadow-sm group-hover/avatar:ring-2 group-hover/avatar:ring-primary-400 transition" />
              <span className="text-[11px] text-gray-700 font-medium truncate max-w-[60px] group-hover/avatar:underline group-hover/avatar:text-primary-600 transition flex items-center gap-0.5">
                {user.name}
                {(user as any).display_badge_id && (
                  <Award size={10} className="text-yellow-500" />
                )}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-0.5 text-yellow-500">
            <Star size={13} className="fill-yellow-500" />
            <span className="text-xs font-medium">{service.rating?.toFixed(1) || '—'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
