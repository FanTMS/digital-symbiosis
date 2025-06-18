import React from "react";

interface ChallengeCardProps {
  title: string;
  description?: string;
  image?: string;
  brand?: string;
  prize?: string;
  endsAt: string;
  onClick?: () => void;
}

const getProgress = (endsAt: string) => {
  if (!endsAt) return 0;
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  const total = end - now;
  const duration = 1000 * 60 * 60 * 24 * 7; // 7 дней для примера
  const percent = Math.max(0, Math.min(1, 1 - total / duration));
  return percent * 100;
};

const ChallengeCard: React.FC<ChallengeCardProps> = ({ title, description, image, brand, prize, endsAt, onClick }) => {
  const progress = getProgress(endsAt);
  return (
    <div
      className="w-full rounded-2xl shadow-xl mb-6 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200 bg-white border border-gray-100"
      style={{ minHeight: 180 }}
      onClick={onClick}
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="w-full h-40 sm:h-56 object-cover"
          style={{ display: 'block' }}
        />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {brand && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{brand}</span>}
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">{prize}</span>
        </div>
        <div className="font-bold text-lg mb-1 text-gray-900 line-clamp-2">{title}</div>
        {description && <div className="text-gray-500 text-sm mb-2 line-clamp-2">{description}</div>}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-gray-500 ml-2">До {endsAt ? endsAt.slice(0, 10) : '—'}</span>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard; 