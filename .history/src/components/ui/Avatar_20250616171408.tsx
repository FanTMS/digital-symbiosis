import React from "react";

interface AvatarProps {
    src?: string | null;
    name?: string;
    size?: number; // px
    className?: string;
}

function getInitial(name?: string) {
    if (!name) return "?";
    // Берём первую букву первого слова (рус/eng)
    const match = name.trim().match(/^([\p{L}\p{M}])/u);
    return match ? match[1].toUpperCase() : name[0].toUpperCase();
}

// Генерируем цвет по имени (чтобы у всех был разный, но приятный)
function getBgColor(name?: string) {
    if (!name) return "bg-gray-300";
    const colors = [
        "bg-blue-200", "bg-green-200", "bg-yellow-200", "bg-pink-200", "bg-purple-200", "bg-orange-200", "bg-teal-200", "bg-red-200"
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 40, className = "" }) => {
    const initial = getInitial(name);
    const bgColor = getBgColor(name);

    if (src) {
        return (
            <img
                src={src}
                alt={name || "Аватар"}
                className={`rounded-full object-cover border ${className}`}
                style={{ width: size, height: size }}
                onError={(e) => {
                    // fallback на инициал, если картинка не загрузилась
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = `flex items-center justify-center rounded-full font-bold text-xl text-white ${bgColor} ${className}`;
                    fallback.style.width = `${size}px`;
                    fallback.style.height = `${size}px`;
                    fallback.innerText = initial;
                    (e.target as HTMLImageElement).parentElement?.appendChild(fallback);
                }}
            />
        );
    }
    return (
        <div
            className={`flex items-center justify-center rounded-full font-bold text-xl text-white ${bgColor} ${className}`}
            style={{ width: size, height: size }}
        >
            {initial}
        </div>
    );
}; 