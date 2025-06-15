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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden relative"
      onClick={handleClick}
    >
      {/* Фото услуги */}
      {service.image_url && (
        <img
          src={service.image_url}
          alt={service.title}
          className="w-full h-36 object-cover"
          style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
        />
      )}
      {/* Сердце избранного */}
      <button
        className={`absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 shadow transition ${isFavorite ? "text-red-500" : "text-gray-300"} hover:bg-red-50`}
        onClick={handleFavorite}
        aria-label={
          isFavorite ? "Удалить из избранного" : "Добавить в избранное"
        }
        disabled={loading}
        tabIndex={0}
      >
        <Heart size={20} fill={isFavorite ? "#ef4444" : "none"} />
      </button>
      <div className="p-4">
        {/* Проверенный пользователь */}
        {user && user.completed_tasks > 30 && user.rating > 4.8 && (
          <div className="mb-2 text-xs font-bold text-green-600 bg-green-100 rounded-full px-2 py-1 inline-block">
            Проверенный пользователь
          </div>
        )}
        <div className="flex items-center mb-3">
          <span className="text-lg mr-2">
            {getCategoryIcon(service.category)}
          </span>
          <span className="text-xs bg-primary-100 text-primary-800 py-1 px-2 rounded-full">
            {getCategoryName(service.category)}
          </span>
        </div>
        <h3 className="font-medium text-gray-900 text-lg mb-1 line-clamp-2">
          {service.title}
        </h3>
        {/* Рейтинг под заголовком */}
        <div className="flex items-center text-yellow-500 mb-2">
          <Star size={16} className="fill-yellow-500" />
          <span className="ml-1 text-sm font-medium">
            {service.rating?.toFixed(1) || "—"}
          </span>
        </div>
        {/* Автор услуги */}
        {user && (
          <div className="flex items-center gap-2 mb-2">
            <img
              src={
                user.avatar_url ||
                "https://images.pexels.com/photos/4926674/pexels-photo-4926674.jpeg?auto=compress&cs=tinysrgb&w=150"
              }
              alt={user.name}
              className="w-6 h-6 rounded-full object-cover border border-gray-200"
            />

            <span className="text-xs text-gray-700 font-medium">
              {user.name}
            </span>
          </div>
        )}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {service.description}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Clock size={14} className="text-gray-400" />
            <span className="ml-1 text-xs text-gray-500">
              {formatDate(service.created_at)}
            </span>
          </div>
          <div className="bg-accent-500 text-white py-1 px-3 rounded-full text-sm font-medium">
            {service.price} кр.
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
