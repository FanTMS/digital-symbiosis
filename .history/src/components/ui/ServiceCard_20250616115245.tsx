import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Clock, Heart } from "lucide-react";
import { motion } from "framer-motion";
import type { Database } from "../../types/supabase";
import { supabase } from "../../lib/supabase";
import { useTelegram } from "../../hooks/useTelegram";

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
  const { user: currentUser } = useTelegram();
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Универсально поддерживаем user как объект или массив
  const user = Array.isArray(service.user) ? service.user[0] : service.user;

  React.useEffect(() => {
    if (!currentUser?.id) return;
    (async () => {
      const { data } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("service_id", service.id)
        .single();
      setIsFavorite(!!data);
    })();
  }, [currentUser?.id, service.id]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id) return;
    setLoading(true);
    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("service_id", service.id);
      setIsFavorite(false);
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: currentUser.id, service_id: service.id });
      setIsFavorite(true);
    }
    setLoading(false);
    if (typeof onFavoriteChange === "function") onFavoriteChange();
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
      whileHover={{ y: -4, scale: 1.02, boxShadow: '0 8px 32px 0 rgba(34,197,246,0.12)' }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative group cursor-pointer border border-gray-100 flex flex-col min-h-[320px]"
      onClick={handleClick}
    >
      {/* Фото услуги */}
      {service.image_url && (
        <div className="relative w-full h-40 sm:h-48 overflow-hidden flex-shrink-0">
          <img
            src={service.image_url}
            alt={service.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          />
          {/* Сердце избранного */}
          <button
            className={`absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 shadow transition-all duration-200 group-hover:scale-110 group-active:scale-95 ${isFavorite ? "text-red-500" : "text-gray-300"} hover:bg-red-50`}
            onClick={handleFavorite}
            aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
            disabled={loading}
            tabIndex={0}
          >
            <Heart size={22} fill={isFavorite ? "#ef4444" : "none"} />
          </button>
        </div>
      )}
      <div className="flex-1 flex flex-col p-4 gap-2">
        {/* Категория и цена */}
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
            {getCategoryIcon(service.category)} {getCategoryName(service.category)}
          </span>
          <span className="flex items-center gap-1 text-lg font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full shadow-sm">
            {service.price}
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' fill='#FDBA74' /><text x='12' y='16' textAnchor='middle' fontSize='12' fill='#fff' fontWeight='bold'>₽</text></svg>
          </span>
        </div>
        {/* Название услуги */}
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2 group-hover:underline transition-all duration-200">
          {service.title}
        </h3>
        {/* Описание */}
        <p className="text-gray-600 text-sm mb-2 line-clamp-3 min-h-[42px]">{service.description}</p>
        {/* Автор и рейтинг */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <img
              src={user.avatar_url || "https://images.pexels.com/photos/4926674/pexels-photo-4926674.jpeg?auto=compress&cs=tinysrgb&w=150"}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm"
            />
            <span className="text-xs text-gray-700 font-medium truncate max-w-[80px]">{user.name}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star size={16} className="fill-yellow-500" />
            <span className="text-sm font-medium">{service.rating?.toFixed(1) || "—"}</span>
          </div>
        </div>
        {/* Кнопка Редактировать только для владельца */}
        {currentUser?.id === service.user_id && (
          <button
            className="absolute top-3 left-3 z-20 p-2 rounded-full bg-blue-50 text-blue-700 shadow hover:bg-blue-100 transition-all duration-200 group-hover:scale-110 group-active:scale-95"
            style={{ minWidth: 0 }}
            onClick={e => { e.stopPropagation(); navigate(`/services/${service.id}?edit=1`); }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d='M4 21h17M12.5 8.5l3 3M7 20l-3-3 9-9a2.121 2.121 0 013 3l-9 9z' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' /></svg>
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ServiceCard;
