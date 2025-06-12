import React from "react";

interface PromoBannerProps {
  title: string;
  text: string;
  image?: string;
  link?: string;
  color?: string;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ title, text, image, link, color }) => {
  return (
    <div
      className="flex items-center rounded-xl shadow-lg p-4 mb-4"
      style={{ background: color || "linear-gradient(90deg,#bae6fd,#f0fdfa)" }}
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
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-cyan-500 text-white rounded-full font-semibold text-sm shadow hover:bg-cyan-600 transition"
          >
            Подробнее
          </a>
        )}
      </div>
    </div>
  );
};

export default PromoBanner; 