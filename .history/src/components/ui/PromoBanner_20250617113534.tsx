import React from "react";

interface PromoBannerProps {
  title: string;
  text: string;
  image?: string;
  link?: string;
  color?: string;
  onClick?: () => void;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ title, text, image, color, onClick }) => {
  return (
    <div
      className="relative flex items-center rounded-2xl shadow-xl p-6 mb-6 cursor-pointer bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 hover:scale-[1.02] transition-transform duration-200"
      style={{ minHeight: 120, background: color || undefined }}
      onClick={onClick}
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="w-24 h-24 object-cover rounded-xl shadow-lg mr-6 border-4 border-white hidden sm:block"
          style={{ background: "#fff" }}
        />
      )}
      <div className="flex-1">
        <div className="text-2xl font-extrabold text-white mb-2 drop-shadow">{title}</div>
        <div className="text-base text-white/90 mb-3">{text}</div>
        <button
          className="px-5 py-2 bg-white/90 text-blue-600 font-bold rounded-lg shadow hover:bg-white transition"
          onClick={e => { e.stopPropagation(); onClick && onClick(); }}
        >
          Подробнее
        </button>
      </div>
    </div>
  );
};

export default PromoBanner; 