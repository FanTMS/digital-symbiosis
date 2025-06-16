import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTelegram } from "../hooks/useTelegram";
import {
  Search,
  Plus,
  Filter,
  X,
  Star as StarIcon,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { useServices } from "../hooks/useServices";
import ServiceCard from "../components/ui/ServiceCard";
import Button from "../components/ui/Button";
import type { Database } from "../types/supabase";
import { supabase } from "../lib/supabase";
import Modal from "../components/ui/Modal";
import { FixedSizeList as List } from "react-window";

type Service = Database["public"]["Tables"]["services"]["Row"];
type ServiceCategory =
  | "education"
  | "it"
  | "design"
  | "languages"
  | "business"
  | "lifestyle";

const PAGE_SIZE = 20;

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { tg, user } = useTelegram();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    ServiceCategory | "all"
  >("all");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [ratingFrom, setRatingFrom] = useState("");
  const [ratingTo, setRatingTo] = useState("");
  const [sortBy, setSortBy] = useState<
    | "date_desc"
    | "date_asc"
    | "price_asc"
    | "price_desc"
    | "rating_asc"
    | "rating_desc"
  >("date_desc");
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'my'>('all');
  const [favoriteServices, setFavoriteServices] = useState<any[]>([]);
  const [showSortModal, setShowSortModal] = useState(false);
  const [page, setPage] = useState(0);
  const [allServices, setAllServices] = useState<any[]>([]);
  const {
    data: services,
    isLoading,
    isFetching,
  } = useServices(
    selectedCategory === "all" ? undefined : selectedCategory,
    PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const [hasMore, setHasMore] = useState(true);

  const location = useLocation();

  React.useEffect(() => {
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
    if (activeTab !== "favorites" || !user?.id) return;
    const fetchFavorites = async () => {
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
      setFavoriteServices(services);
    };
    fetchFavorites();
    (window as any).refetchFavorites = fetchFavorites;
  }, [activeTab, user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "favorites" || tab === "all" || tab === "my") {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (services && services.length > 0) {
      setAllServices((prev) =>
        page === 0 ? services : [...prev, ...services],
      );
      setHasMore(services.length === PAGE_SIZE);
    } else if (page === 0) {
      setAllServices([]);
      setHasMore(false);
    } else if (services && services.length < PAGE_SIZE) {
      setHasMore(false);
    }
  }, [services, page]);

  useEffect(() => {
    if (services) {
      console.log("services:", services);
    }
  }, [services]);

  // Сброс при смене фильтров/категории
  useEffect(() => {
    setPage(0);
  }, [
    selectedCategory,
    searchTerm,
    priceFrom,
    priceTo,
    ratingFrom,
    ratingTo,
    sortBy,
  ]);

  const handleCreateService = () => {
    navigate("/create-service");
  };

  const categories: {
    id: ServiceCategory | "all";
    label: string;
    emoji: string;
  }[] = [
      { id: "all", label: "Все", emoji: "🔍" },
      { id: "education", label: "Образование", emoji: "🎓" },
      { id: "it", label: "IT", emoji: "💻" },
      { id: "design", label: "Дизайн", emoji: "🎨" },
      { id: "languages", label: "Языки", emoji: "🌐" },
      { id: "business", label: "Бизнес", emoji: "💼" },
      { id: "lifestyle", label: "Лайфстайл", emoji: "🌿" },
    ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const filteredServices =
    allServices.filter((service: any) => {
      if (activeTab === 'my' && user?.id) {
        if (service.user_id !== user.id) return false;
      }
      const matchesTitle = service.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || service.category === selectedCategory;
      const matchesPrice =
        (priceFrom === "" || service.price >= parseFloat(priceFrom)) &&
        (priceTo === "" || service.price <= parseFloat(priceTo));
      const matchesRating =
        (ratingFrom === "" || service.rating >= parseFloat(ratingFrom)) &&
        (ratingTo === "" || service.rating <= parseFloat(ratingTo));
      return matchesTitle && matchesCategory && matchesPrice && matchesRating;
    }) || [];

  const CARD_HEIGHT = 320; // px, увеличено для корректного отображения ServiceCard
  const VISIBLE_COUNT = 8; // сколько карточек видно на экране

  return (
    <div className="pb-16 pt-2">
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Услуги
            <button
              className="ml-2 p-1 rounded-full hover:bg-yellow-100 transition text-yellow-400"
              onClick={() => navigate("/favorites")}
              title="Избранное"
            >
              <StarIcon size={24} />
            </button>
          </h1>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={handleCreateService}
          >
            Создать
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative bg-gray-100 rounded-lg mb-4 flex items-center overflow-hidden">
          <Search size={18} className="text-gray-500 absolute left-3" />

          <input
            type="text"
            placeholder="Поиск услуг и специалистов..."
            className="bg-transparent w-full py-3 pl-10 pr-4 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm && (
            <button
              className="absolute right-3 text-gray-500"
              onClick={() => setSearchTerm("")}
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="overflow-x-auto pb-2 mb-4">
          <div className="flex space-x-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-1 whitespace-nowrap px-3 py-1.5 rounded-full text-sm ${selectedCategory === category.id ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-800"}`}
              >
                <span>{category.emoji}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-md text-center ${activeTab === 'all' ? 'bg-white text-primary-500 shadow-sm' : 'text-gray-600'}`}
            onClick={() => setActiveTab('all')}
          >
            Все услуги
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-center ${activeTab === 'my' ? 'bg-white text-primary-500 shadow-sm' : 'text-gray-600'}`}
            onClick={() => setActiveTab('my')}
          >
            Мои услуги
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-center ${activeTab === 'favorites' ? 'bg-white text-primary-500 shadow-sm' : 'text-gray-600'}`}
            onClick={() => setActiveTab('favorites')}
          >
            Избранные
          </button>
        </div>

        {/* Services list */}
        {isLoading && page === 0 && activeTab === "all" ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-100 animate-pulse h-32 rounded-lg"
              ></div>
            ))}
          </div>
        ) : activeTab === "all" ? (
          filteredServices.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                {filteredServices.map((service: any) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetching}
                  >
                    {isFetching ? "Загрузка..." : "Показать ещё"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="text-4xl mb-2">🔍</div>
              <h3 className="text-lg font-medium mb-1">Ничего не найдено</h3>
              <p className="text-gray-500 mb-4 max-w-xs">
                Попробуйте изменить параметры поиска или создайте новую услугу
              </p>
              <Button
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={handleCreateService}
              >
                Создать услугу
              </Button>
            </motion.div>
          )
        ) : activeTab === "my" ? (
          filteredServices.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                {filteredServices.map((service: any) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetching}
                  >
                    {isFetching ? "Загрузка..." : "Показать ещё"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="text-4xl mb-2">🧑‍💼</div>
              <h3 className="text-lg font-medium mb-1">У вас пока нет своих услуг</h3>
              <p className="text-gray-500 mb-4 max-w-xs">
                Создайте первую услугу, чтобы начать принимать заказы
              </p>
              <Button
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={handleCreateService}
              >
                Создать услугу
              </Button>
            </motion.div>
          )
        ) : // Вкладка избранное
          favoriteServices.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-3"
            >
              {favoriteServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onFavoriteChange={() => {
                    if ((window as any).refetchFavorites)
                      (window as any).refetchFavorites();
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="text-4xl mb-2">⭐</div>
              <h3 className="text-lg font-medium mb-1">Нет избранных услуг</h3>
              <p className="text-gray-500 mb-4 max-w-xs">
                Добавьте услуги в избранное, чтобы быстро находить их позже
              </p>
            </motion.div>
          )}
      </div>
      {/* Модальное окно сортировки */}
      <Modal isOpen={showSortModal} onClose={() => setShowSortModal(false)}>
        <div className="p-4 w-[90vw] max-w-xs">
          <h2 className="text-lg font-bold mb-4">Сортировка</h2>
          <div className="flex flex-col gap-2 mb-4">
            <Button variant={sortBy === 'date_desc' ? 'primary' : 'outline'} onClick={() => { setSortBy('date_desc'); setShowSortModal(false); }}>Сначала новые</Button>
            <Button variant={sortBy === 'date_asc' ? 'primary' : 'outline'} onClick={() => { setSortBy('date_asc'); setShowSortModal(false); }}>Сначала старые</Button>
            <Button variant={sortBy === 'price_asc' ? 'primary' : 'outline'} onClick={() => { setSortBy('price_asc'); setShowSortModal(false); }}>Дешевле</Button>
            <Button variant={sortBy === 'price_desc' ? 'primary' : 'outline'} onClick={() => { setSortBy('price_desc'); setShowSortModal(false); }}>Дороже</Button>
            <Button variant={sortBy === 'rating_desc' ? 'primary' : 'outline'} onClick={() => { setSortBy('rating_desc'); setShowSortModal(false); }}>По рейтингу</Button>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Категория услуги</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as ServiceCategory | 'all')}
            >
              <option value="all">Все категории</option>
              <option value="education">🎓 Образование</option>
              <option value="it">💻 IT и разработка</option>
              <option value="design">🎨 Дизайн</option>
              <option value="languages">🌐 Языки</option>
              <option value="business">💼 Бизнес</option>
              <option value="lifestyle">🌿 Лайфстайл</option>
              <option value="writing">✍️ Копирайтинг</option>
              <option value="music">🎵 Музыка</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ServicesPage;
