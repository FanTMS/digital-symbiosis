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
      try {
        // Получаем id избранных услуг
        const { data: favs, error: favsError } = await supabase
          .from("favorites")
          .select("service_id")
          .eq("user_id", user.id);
        if (favsError) {
          console.error("Ошибка загрузки избранного:", favsError);
          return;
        }
        const ids = favs?.map((f: any) => f.service_id) || [];
        let services = [];
        if (ids.length > 0) {
          const { data: servicesData, error: servicesError } = await supabase
            .from("services")
            .select("*, user:users(*)")
            .in("id", ids);
          if (servicesError) throw servicesError;
          services = servicesData || [];
        }
        setFavorites(services);
      } catch (e) {
        alert("Ошибка загрузки избранного: " + (e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  // Добавляю вывод в консоль для отладки
  console.log("favorites", favorites);

  const refetchFavorites = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: favs } = await supabase
        .from("favorites")
        .select("service_id")
        .eq("user_id", user.id);
      const ids = favs?.map((f: any) => f.service_id) || [];
      let services = [];
      if (ids.length > 0) {
        const { data: servicesData } = await supabase
          .from("services")
          .select("*, user:users(*)")
          .in("id", ids);
        services = servicesData || [];
      }
      setFavorites(services);
    } catch (e) {
      console.error("Ошибка загрузки избранного:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16 pt-2">
      <div className="px-4 mb-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Star className="text-yellow-400" /> Избранное
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-100 animate-pulse h-32 rounded-lg"
              ></div>
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="grid grid-cols-2 gap-4"
          >
            {favorites.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onFavoriteChange={refetchFavorites}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div className="text-4xl mb-2">💖</div>
            <h3 className="text-lg font-medium mb-1">Нет избранных услуг</h3>
            <p className="text-gray-500 mb-4 max-w-xs">
              Нажмите на сердечко ❤️ на карточке услуги, чтобы добавить её в избранное
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/services")}
              className="mt-2"
            >
              Посмотреть все услуги
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
