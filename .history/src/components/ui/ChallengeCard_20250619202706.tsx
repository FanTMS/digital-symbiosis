import React from "react";
import { useChallengeMeta } from "../../hooks/useChallengeMeta";
import { motion } from "framer-motion";
import { Clock, Users, Trophy, Gift, Tag } from "lucide-react";

interface ChallengeCardProps {
    title: string;
    description?: string;
    image?: string;
    prize?: string;
    endsAt: string;
    createdAt?: string;
    participants?: number;
    participantsLimit?: number;
    brand?: string;
    onClick?: () => void;
    className?: string;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
    title,
    description,
    image,
    prize,
    endsAt,
    createdAt,
    participants = 0,
    participantsLimit,
    brand,
    onClick,
    className = ""
}) => {
    const { progress, timeRemaining, prizeIcon, isLimitReached } = useChallengeMeta({
        endsAt,
        createdAt,
        prize,
        participants,
        participantsLimit,
    });

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
                bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 
                overflow-hidden cursor-pointer group relative
                ${className}
            `}
            onClick={onClick}
        >
            {/* Изображение */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-100 to-red-100">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Trophy size={64} className="text-orange-300" />
                    </div>
                )}

                {/* Оверлей с градиентом */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Статус и время */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                    {isLimitReached && !timeRemaining.expired && (
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            Лимит достигнут
                        </span>
                    )}
                    {timeRemaining.expired && (
                        <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            Завершён
                        </span>
                    )}
                </div>

                {/* Бренд */}
                {brand && (
                    <div className="absolute bottom-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                            <Tag size={12} />
                            {brand}
                        </span>
                    </div>
                )}
            </div>

            {/* Контент */}
            <div className="p-5">
                {/* Заголовок */}
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {title}
                </h3>

                {/* Описание */}
                {description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {description}
                    </p>
                )}

                {/* Информация о призе и участниках */}
                <div className="flex items-center justify-between mb-4">
                    {prize && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                                <Gift size={16} className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Приз</p>
                                <p className="text-sm font-semibold text-gray-900">{prize}</p>
                            </div>
                        </div>
                    )}

                    {participantsLimit && (
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                                {participants}/{participantsLimit}
                            </span>
                        </div>
                    )}
                </div>

                {/* Время и прогресс */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                            <Clock size={14} className="text-gray-400" />
                            <span className={`font-medium ${timeRemaining.expired ? 'text-gray-500' : 'text-orange-600'}`}>
                                {timeRemaining.text}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                    </div>

                    {/* Прогресс-бар */}
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 to-red-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ChallengeCard; 