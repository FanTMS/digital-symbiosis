import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PromoBannerProps {
  image?: string;
  title?: string;
  text?: string;
  color?: string;
  onClick?: () => void;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ image, title, text, color, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Проверяем валидность URL изображения
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      // Если URL относительный, считаем его валидным
      return url.startsWith('/') || url.startsWith('./');
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('Ошибка загрузки изображения промо-баннера:', image);
    setImageError(true);
    setImageLoading(false);
    // Предотвращаем дальнейшие попытки загрузки
    if (e.currentTarget) {
      e.currentTarget.style.display = 'none';
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Сбрасываем состояние при изменении изображения
  useEffect(() => {
    if (image) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [image]);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full rounded-3xl shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 relative group"
      style={{ 
        minHeight: 160,
        background: color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
      onClick={onClick}
    >
      {image && isValidImageUrl(image) && !imageError ? (
        <div className="relative w-full h-40 sm:h-56">
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={image}
            alt={title || "Promo banner"}
            className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
          {(title || text) && !imageLoading && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6">
              {title && (
                <h3 className="text-white font-bold text-lg sm:text-xl mb-2">{title}</h3>
              )}
              {text && (
                <p className="text-white/90 text-sm sm:text-base line-clamp-2">{text}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 sm:p-8 text-white">
          {title && (
            <h3 className="font-bold text-xl sm:text-2xl mb-2">{title}</h3>
          )}
          {text && (
            <p className="text-white/90 text-sm sm:text-base">{text}</p>
          )}
        </div>
      )}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

export default PromoBanner; 