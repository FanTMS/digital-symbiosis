import React from "react";

const ChallengeSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
    return (
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse ${className}`}>
            {/* Изображение-заглушка */}
            <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300" />

            {/* Контент-заглушка */}
            <div className="p-5 space-y-4">
                {/* Заголовок */}
                <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-4/5" />
                    <div className="h-4 bg-gray-200 rounded w-3/5" />
                </div>

                {/* Описание */}
                <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                </div>

                {/* Инфо блок */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                        <div className="space-y-1">
                            <div className="h-2 bg-gray-200 rounded w-12" />
                            <div className="h-3 bg-gray-200 rounded w-20" />
                        </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16" />
                </div>

                {/* Прогресс и время */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <div className="h-3 bg-gray-200 rounded w-24" />
                        <div className="h-3 bg-gray-200 rounded w-12" />
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default ChallengeSkeleton; 