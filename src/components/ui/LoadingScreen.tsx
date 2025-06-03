import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-24 h-24 relative">
        {/* Анимация загрузки */}
        <div className="absolute inset-0">
          <div className="w-full h-full border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </div>
      <h2 className="mt-8 text-xl font-medium text-gray-700">
        Загрузка приложения...
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Пожалуйста, подождите
      </p>
    </div>
  );
}