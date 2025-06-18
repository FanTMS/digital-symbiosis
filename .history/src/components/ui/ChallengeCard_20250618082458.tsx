import React from "react";

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
}

function getTimeRemaining(endsAt: string) {
    const end = new Date(endsAt).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return { text: 'Завершен', expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return { text: `${days}д ${hours}ч`, expired: false };
    if (hours > 0) return { text: `${hours}ч ${minutes}м`, expired: false };
    return { text: `${minutes}м`, expired: false };
}

function getProgressPercent(endsAt: string, createdAt?: string) {
    if (!endsAt) return 0;
    const end = new Date(endsAt).getTime();
    const now = Date.now();
    const start = createdAt ? new Date(createdAt).getTime() : now - 1000 * 60 * 60 * 24 * 7;
    const total = end - start;
    const left = end - now;
    if (total <= 0) return 100;
    return Math.max(0, Math.min(100, 100 - (left / total) * 100));
}

function getPrizeIcon(prize?: string) {
    if (!prize) return '🎁';
    if (prize.includes('₽') || prize.includes('руб')) return '💰';
    if (prize.includes('сертификат')) return '🎫';
    if (prize.includes('балл')) return '⭐';
    return '🏆';
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
    onClick
}) => {
    const progress = getProgressPercent(endsAt, createdAt);
    const timeRemaining = getTimeRemaining(endsAt);
    const prizeIcon = getPrizeIcon(prize);

    return (
        <div
            className="group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl bg-white border border-gray-100"
            onClick={onClick}
        >
            {/* Фоновое изображение */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
                style={image ? {
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : {}}
            />

            {/* Градиентный оверлей */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/20" />

            {/* Контент карточки */}
            <div className="relative z-10 p-6 min-h-[240px] flex flex-col">
                {/* Верхняя часть */}
                <div className="flex items-start justify-between mb-4">
                    {/* Аватар и бренд */}
                    <div className="flex items-center gap-3">
                        {avatar && (
                            <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-white overflow-hidden">
                                <img src={avatar} alt="Аватар" className="w-full h-full object-cover" />
                            </div>
                        )}
                        {brand && (
                            <div className="text-sm font-medium text-gray-600 bg-white/80 px-3 py-1 rounded-full">
                                {brand}
                            </div>
                        )}
                    </div>

                    {/* Статус времени */}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${timeRemaining.expired
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                        {timeRemaining.text}
                    </div>
                </div>

                {/* Заголовок */}
                <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 leading-tight">
                    {title}
                </h3>

                {/* Описание */}
                {description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                        {description}
                    </p>
                )}

                {/* Нижняя часть */}
                <div className="mt-auto space-y-4">
                    {/* Приз и участники */}
                    <div className="flex items-center justify-between">
                        {prize && (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-2 rounded-full shadow-lg">
                                <span className="text-lg">{prizeIcon}</span>
                                <span className="font-bold text-sm">{prize}</span>
                            </div>
                        )}

                        {participantsLimit && (
                            <div className="text-xs text-gray-500 bg-white/80 px-3 py-1 rounded-full">
                                {participants}/{participantsLimit} участников
                            </div>
                        )}
                    </div>

                    {/* Прогресс-бар */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Прогресс челленджа</span>
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