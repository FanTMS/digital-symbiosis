import React from "react";

const ChallengeSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
    return (
        <div
            className={`rounded-3xl bg-white border border-gray-100 shadow-md animate-pulse overflow-hidden flex flex-row md:flex-col min-h-[160px] ${className}`}
        >
            {/* Изображение-заглушка */}
            <div className="w-1/3 md:w-full h-full md:h-40 bg-gray-200" />
            {/* Контент-заглушка */}
            <div className="flex-1 p-4 md:p-6 flex flex-col gap-3">
                <div className="w-1/2 h-4 bg-gray-200 rounded" />
                <div className="w-2/3 h-3 bg-gray-200 rounded" />
                <div className="flex-1" />
                <div className="w-full h-2 bg-gray-200 rounded-full" />
            </div>
        </div>
    );
};

export default ChallengeSkeleton; 