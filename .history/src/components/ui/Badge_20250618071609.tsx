import React from "react";

interface BadgeProps {
    icon?: React.ReactNode;
    name: string;
    description?: string;
}

const Badge: React.FC<BadgeProps> = ({ icon, name, description }) => (
    <div className="flex flex-col items-center group cursor-pointer" title={description || name}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-200 to-amber-400 flex items-center justify-center text-2xl shadow-md mb-1">
            {icon || '🏅'}
        </div>
        <span className="text-xs font-semibold text-gray-700 group-hover:underline text-center max-w-[60px] truncate">{name}</span>
    </div>
);

export default Badge; 