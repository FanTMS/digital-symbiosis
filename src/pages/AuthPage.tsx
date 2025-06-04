import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "../hooks/useTelegram";
import { useUser } from "../contexts/UserContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, error } = useUser();
  const { tg } = useTelegram();

  useEffect(() => {
    if (tg) {
      tg.expand();
      tg.enableClosingConfirmation();
    }
  }, [tg]);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        data-oid="jrghzk5"
      >
        <div
          className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"
          data-oid="8wd8q88"
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen p-4"
        data-oid="r:8qmdu"
      >
        <div className="text-center" data-oid="w9xn5n1">
          <h1
            className="text-2xl font-bold mb-4 text-red-500"
            data-oid="z_wzq7e"
          >
            Ошибка авторизации
          </h1>
          <p className="text-gray-600 mb-8" data-oid="82qn3_d">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            data-oid=".i3ef39"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-4"
      data-oid="d5huctm"
    >
      <div className="text-center" data-oid=".1ezf9v">
        <h1 className="text-2xl font-bold mb-4" data-oid="dfwaptc">
          Добро пожаловать!
        </h1>
        <p className="text-gray-600 mb-8" data-oid="8yq9w8i">
          Мы рады видеть вас в нашем приложении!
        </p>
      </div>
    </div>
  );
}
