import React from "react";

interface PromoBannerProps {
  title: string;
  text: string;
  image?: string;
  link?: string;
  color?: string;
  onClick?: () => void;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ image, onClick }) => {
  return (
    <div
      className="w-full rounded-2xl shadow-xl mb-6 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200"
      style={{ minHeight: 120, background: '#f0fdfa' }}
      onClick={onClick}
    >
      {image && (
        <img
          src={image}
          alt="Promo banner"
          className="w-full h-40 sm:h-56 object-cover"
          style={{ display: 'block' }}
        />
      )}
    </div>
  );
};

export default PromoBanner; 