import React from "react";
import { useChallengeMeta } from "../../hooks/useChallengeMeta";

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
        <div
            className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl bg-white border border-gray-100 ${className} shadow-md md:shadow-xl min-h-[160px] flex flex-row md:flex-col justify-end`}
            onClick={onClick}
        >
            {/* Оверлей завершён */}
            {timeRemaining.expired && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 rounded-3xl">
                    <span className="text-white text-lg font-bold">Завершён</span>
                </div>
            )}
            {/* Бейдж лимита */}
            {isLimitReached && !timeRemaining.expired && (
                <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-20 shadow-lg">
                    Лимит достигнут
                </div>
            )}
            {/* Фоновое изображение */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100"
                style={image ? {
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : {}}
            />
            {/* Градиентный оверлей */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/10" />
            {/* Контент карточки */}
            <div className="relative z-10 p-4 md:p-6 flex flex-col gap-2 min-h-[180px] md:min-h-[220px]">
                {/* Верхняя часть */}
                <div className="flex items-start justify-between mb-2 md:mb-4">
                    {/* Аватар и бренд */}
                    <div className="flex items-center gap-2 md:gap-3">
                        {avatar && (
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-white overflow-hidden">
                                <img src={avatar} alt="Аватар" className="w-full h-full object-cover" />
                            </div>
                        )}
                        {brand && (
                            <div className="text-xs md:text-sm font-medium text-gray-600 bg-white/80 px-2 md:px-3 py-1 rounded-full">
                                {brand}
                            </div>
                        )}
                    </div>
                    {/* Статус времени */}
                    <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold ${timeRemaining.expired
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-orange-100 text-orange-700'
                        }`}>
                        {timeRemaining.text}
                    </div>
                </div>
                {/* Заголовок */}
                <h3 className="font-bold text-lg md:text-xl text-gray-900 mb-1 md:mb-2 line-clamp-2 leading-tight">
                    {title}
                </h3>
                {/* Описание */}
                {description && (
                    <p className="text-gray-600 text-xs md:text-sm mb-2 md:mb-4 line-clamp-2 flex-1">
                        {description}
                    </p>
                )}
                {/* Нижняя часть */}
                <div className="mt-auto space-y-2 md:space-y-4">
                    {/* Приз и участники */}
                    <div className="flex items-center justify-between">
                        {prize && (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3 md:px-4 py-2 rounded-full shadow-lg">
                                <span className="text-lg">{prizeIcon}</span>
                                <span className="font-bold text-xs md:text-sm">{prize}</span>
                            </div>
                        )}
                        {participantsLimit && (
                            <div className="text-xs text-gray-500 bg-white/80 px-2 md:px-3 py-1 rounded-full">
                                {participants}/{participantsLimit} участников
                            </div>
                        )}
                    </div>
                    {/* Прогресс-бар */}
                    <div className="space-y-1 md:space-y-2">
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>До конца: {timeRemaining.expired ? 'Завершён' : timeRemaining.text}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-700 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Hover эффект */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-pink-400/0 group-hover:from-blue-400/10 group-hover:via-purple-400/10 group-hover:to-pink-400/10 transition-all duration-300 rounded-3xl" />
        </div>
    );
};

export default ChallengeCard; 