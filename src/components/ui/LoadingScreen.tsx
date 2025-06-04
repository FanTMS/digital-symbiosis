import React from "react";

export default function LoadingScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gray-50"
      data-oid="8leof0w"
    >
      <div className="w-24 h-24 relative" data-oid="u1ivoku">
        {/* Анимация загрузки */}
        <div className="absolute inset-0" data-oid="t-zvfr9">
          <div
            className="w-full h-full border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"
            data-oid="2z_5tlo"
          ></div>
        </div>
      </div>
      <h2 className="mt-8 text-xl font-medium text-gray-700" data-oid="seeaeas">
        Загрузка приложения...
      </h2>
      <p className="mt-2 text-sm text-gray-500" data-oid="gtzhrd9">
        Пожалуйста, подождите
      </p>
    </div>
  );
}
