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
      className="flex items-center rounded-xl shadow-lg p-4 mb-4 cursor-pointer hover:shadow-xl transition"
      style={{ background: color || "linear-gradient(90deg,#bae6fd,#f0fdfa)" }}
      onClick={onClick}
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="w-16 h-16 object-cover rounded-lg mr-4 hidden sm:block"
        />
      )}
      <div className="flex-1">
        <div className="text-lg font-bold mb-1">{title}</div>
        <div className="text-sm text-gray-700 mb-2">{text}</div>
      </div>
    </div>
  );
};

export default PromoBanner; 