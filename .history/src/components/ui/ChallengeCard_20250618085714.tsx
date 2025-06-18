import React from "react";
import { useChallengeMeta } from "../../hooks/useChallengeMeta";
import { motion } from "framer-motion";

interface ChallengeCardProps {
    title: string;
    description?: string;
    image?: string;
    avatar?: string;
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
    avatar,
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
            whileHover={{ y: -2, scale: 1.01, boxShadow: "0 4px 16px 0 rgba(34,197,246,0.10)" }}
            whileTap={{ scale: 0.98 }}
            className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer border border-gray-100 flex flex-col ${className}`}
            onClick={onClick}
        >
            {/* Картинка */}
            <div className="relative w-full h-28 overflow-hidden flex-shrink-0">
                {image && (
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                    />
                )}

                {/* Бейдж лимита */}
                {isLimitReached && !timeRemaining.expired && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
                        Лимит
                    </span>
                )}

                {/* Завершён overlay */}
                {timeRemaining.expired && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">Завершён</span>
                    </div>
                )}
            </div>

            {/* Контент */}
            <div className="flex-1 flex flex-col p-3 gap-2">
                <div className="flex items-center justify-between mb-1 gap-1 min-h-[22px]">
                    {brand && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded max-w-[60%] overflow-hidden">
                            {brand}
                        </span>
                    )}
                    <span
                        className={`flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap ${timeRemaining.expired ? "bg-gray-200 text-gray-500" : "bg-orange-50 text-orange-500"}`}
                    >
                        {timeRemaining.text}
                    </span>
                </div>

                <h3 className="font-semibold text-gray-900 text-base line-clamp-2 group-hover:underline transition-all duration-200">
                    {title}
                </h3>

                {description && (
                    <p className="text-gray-600 text-xs line-clamp-2 min-h-[32px]">{description}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-1">
                    {prize && (
                        <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded shadow-sm">
                            {prizeIcon} {prize}
                        </span>
                    )}
                    {participantsLimit && (
                        <span className="text-[11px] text-gray-600">
                            {participants}/{participantsLimit}
                        </span>
                    )}
                </div>

                {/* Прогресс бар */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                    <div
                        className="h-full bg-primary-500 transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default ChallengeCard; 