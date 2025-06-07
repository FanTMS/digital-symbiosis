import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useTelegram } from "../hooks/useTelegram";
import ServiceCard from "../components/ui/ServiceCard";
import Button from "../components/ui/Button";
import { Star } from "lucide-react";

const FavoritesPage: React.FC = () => {
  const { user, tg } = useTelegram();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tg) {
      tg.setHeaderColor("#0BBBEF");
      tg.BackButton.show();
      const handleBack = () => navigate("/");
      tg.BackButton.onClick(handleBack);
      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick(handleBack);
      };
    }
  }, [tg, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    (async () => {
      // Получаем id избранных услуг
      const { data: favs, error: favsError } = await supabase
        .from("favorites")
        .select("service_id")
        .eq("user_id", user.id);
      const ids = favs?.map((f: any) => f.service_id) || [];
      let services = [];
      if (ids.length > 0) {
        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select("*, user:users(*)")
          .in("id", ids);
        services = servicesData || [];
      }
      setFavorites(services);
      setLoading(false);
    })();
  }, [user?.id]);

  // Добавляю вывод в консоль для отладки
  console.log("favorites", favorites);

  return (
    <div className="pb-16 pt-2 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Star className="text-yellow-400" /> Избранное
      </h1>
      <div className="text-lg text-gray-500 mb-4">
        Функция избранного временно недоступна
      </div>
      <Button variant="primary" onClick={() => navigate("/services")}>
        Перейти в каталог
      </Button>
    </div>
  );
};

export default FavoritesPage;
