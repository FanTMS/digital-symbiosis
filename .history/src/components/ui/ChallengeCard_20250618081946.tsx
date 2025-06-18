import React from "react";

interface ChallengeCardProps {
    title: string;
    description?: string;
    image?: string;
    avatar?: string;
    prize?: string;
    endsAt: string;
    onClick?: () => void;
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

const ChallengeCard: React.FC<ChallengeCardProps> = ({ title, description, image, avatar, prize, endsAt, onClick }) => {
    const progress = getProgressPercent(endsAt);
    return (
        <div
            className="relative rounded-3xl shadow-xl overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] bg-gradient-to-br from-cyan-100 via-blue-50 to-emerald-50 border border-gray-100 min-h-[180px] flex flex-col justify-end"
            style={image ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            onClick={onClick}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/60 to-transparent z-0" />
            {avatar && (
                <div className="absolute top-5 left-5 z-10 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-cyan-200">
                    <img src={avatar} alt="Аватар челленджа" className="w-12 h-12 object-cover rounded-full" />
                </div>
            )}
            <div className="relative z-10 p-6 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                    {prize && <span className="bg-gradient-to-r from-amber-400 to-yellow-300 text-white px-3 py-1 rounded-full text-xs font-bold shadow">{prize}</span>}
                    <span className="ml-auto text-xs text-gray-500">До {endsAt ? new Date(endsAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                </div>
                <div className="font-extrabold text-xl text-gray-900 drop-shadow-sm line-clamp-2 mb-1">{title}</div>
                {description && <div className="text-gray-600 text-sm line-clamp-2 mb-2">{description}</div>}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div className="h-2 bg-gradient-to-r from-cyan-400 to-blue-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
};

export default ChallengeCard; 