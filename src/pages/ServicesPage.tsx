import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTelegram } from "../hooks/useTelegram";
import {
  Search,
  Plus,
  X,
  Star as StarIcon,
  FileText,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  TrendingUp,
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
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

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
  const [roleFilter, setRoleFilter] = useState<'all' | 'provider' | 'client'>('all');

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
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "all" || tab === "my") {
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

  const filteredServices = React.useMemo(() =>
    allServices.filter((service: any) => {
      if (roleFilter !== 'all' && service.role !== roleFilter) return false;
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
    }) || []
  , [allServices, roleFilter, activeTab, user?.id, searchTerm, selectedCategory, priceFrom, priceTo, ratingFrom, ratingTo]);

  const CARD_HEIGHT = 320; // px, увеличено для корректного отображения ServiceCard
  const VISIBLE_COUNT = 8; // сколько карточек видно на экране

  return (
    <div className="pb-20 pt-2 min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="px-4 sm:px-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden mb-6"
        >
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            {/* Заголовок */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                  <Sparkles size={24} className="text-white" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900">Услуги</h1>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="primary" 
                  size="icon" 
                  onClick={() => setShowSortModal(true)} 
                  aria-label="Фильтры"
                  className="shadow-lg"
                >
                  <SlidersHorizontal size={20} />
                </Button>
              </motion.div>
            </div>

            {/* Search bar - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative mb-4"
            >
              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search size={20} className="text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Поиск услуг и специалистов..."
                  className="w-full py-4 pl-12 pr-12 bg-transparent outline-none text-gray-900 placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    onClick={() => setSearchTerm("")}
                  >
                    <X size={16} className="text-gray-600" />
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Быстрые действия - Redesigned */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3 mb-4"
            >
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={18} />}
                  onClick={handleCreateService}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg font-semibold"
                >
                  Создать
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FileText size={18} />}
                  onClick={() => navigate('/orders')}
                  className="w-full border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 font-semibold"
                >
                  Заказы
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<StarIcon size={18} />}
                  onClick={() => navigate("/favorites")}
                  className="w-full border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 font-semibold"
                >
                  Избранное
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Categories chips убраны, фильтрация теперь через модальное окно */}

        {/* Вкладки - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex mb-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-1.5"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-3 rounded-xl text-center font-semibold transition-all ${
              activeTab === 'all' 
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg' 
                : 'text-gray-600 hover:text-primary-600'
            }`}
            onClick={() => setActiveTab('all')}
          >
            Все услуги
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-3 rounded-xl text-center font-semibold transition-all ${
              activeTab === 'my' 
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg' 
                : 'text-gray-600 hover:text-primary-600'
            }`}
            onClick={() => setActiveTab('my')}
          >
            Мои услуги
          </motion.button>
        </motion.div>

        {/* Фильтр роли - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex mb-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-1.5"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-2.5 rounded-xl text-center text-sm font-semibold transition-all ${
              roleFilter === 'all' 
                ? 'bg-primary-50 text-primary-600 border-2 border-primary-200' 
                : 'text-gray-600 hover:text-primary-600'
            }`}
            onClick={() => setRoleFilter('all')}
          >
            Все
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-2.5 rounded-xl text-center text-sm font-semibold transition-all ${
              roleFilter === 'provider' 
                ? 'bg-primary-50 text-primary-600 border-2 border-primary-200' 
                : 'text-gray-600 hover:text-primary-600'
            }`}
            onClick={() => setRoleFilter('provider')}
          >
            Исполнители
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-2.5 rounded-xl text-center text-sm font-semibold transition-all ${
              roleFilter === 'client' 
                ? 'bg-primary-50 text-primary-600 border-2 border-primary-200' 
                : 'text-gray-600 hover:text-primary-600'
            }`}
            onClick={() => setRoleFilter('client')}
          >
            Заказчики
          </motion.button>
        </motion.div>

        {/* Services list - Enhanced */}
        {isLoading && page === 0 && activeTab === "all" ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-4"
          >
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                variants={item}
                className="bg-white animate-pulse h-64 rounded-2xl shadow-lg"
              />
            ))}
          </motion.div>
        ) : activeTab === "all" ? (
          filteredServices.length > 0 ? (
            <>
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-4 mb-6"
              >
                {filteredServices.map((service: any, index: number) => (
                  <motion.div
                    key={service.id}
                    variants={item}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ServiceCard service={service} />
                  </motion.div>
                ))}
              </motion.div>
              {hasMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center mb-6"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={isFetching}
                      className="border-2 border-primary-200 text-primary-600 hover:bg-primary-50 font-semibold px-8"
                      rightIcon={isFetching ? undefined : <ArrowRight size={18} />}
                    >
                      {isFetching ? "Загрузка..." : "Показать ещё"}
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl p-8 text-center shadow-lg border border-gray-100 my-8"
            >
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={40} className="text-primary-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Ничего не найдено</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Попробуйте изменить параметры поиска или создайте новую услугу
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="primary"
                  leftIcon={<Plus size={18} />}
                  onClick={handleCreateService}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg"
                >
                  Создать услугу
                </Button>
              </motion.div>
            </motion.div>
          )
        ) : activeTab === "my" ? (
          filteredServices.length > 0 ? (
            <>
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-4 mb-6"
              >
                {filteredServices.map((service: any, index: number) => (
                  <motion.div
                    key={service.id}
                    variants={item}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ServiceCard service={service} />
                  </motion.div>
                ))}
              </motion.div>
              {hasMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center mb-6"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={isFetching}
                      className="border-2 border-primary-200 text-primary-600 hover:bg-primary-50 font-semibold px-8"
                      rightIcon={isFetching ? undefined : <ArrowRight size={18} />}
                    >
                      {isFetching ? "Загрузка..." : "Показать ещё"}
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl p-8 text-center shadow-lg border border-gray-100 my-8"
            >
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={40} className="text-primary-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">У вас пока нет своих услуг</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Создайте первую услугу, чтобы начать принимать заказы
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="primary"
                  leftIcon={<Plus size={18} />}
                  onClick={handleCreateService}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg"
                >
                  Создать услугу
                </Button>
              </motion.div>
            </motion.div>
          )
        ) : null}
      </div>
      {/* Модальное окно сортировки - Enhanced */}
      <Modal isOpen={showSortModal} onClose={() => setShowSortModal(false)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 w-[90vw] max-w-md bg-white rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 rounded-xl">
              <SlidersHorizontal size={24} className="text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Фильтры и сортировка</h2>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Сортировка</label>
              <div className="grid grid-cols-2 gap-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant={sortBy === 'date_desc' ? 'primary' : 'outline'} 
                    onClick={() => { setSortBy('date_desc'); setShowSortModal(false); }}
                    className="w-full text-sm"
                    fullWidth
                  >
                    Новые
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant={sortBy === 'date_asc' ? 'primary' : 'outline'} 
                    onClick={() => { setSortBy('date_asc'); setShowSortModal(false); }}
                    className="w-full text-sm"
                    fullWidth
                  >
                    Старые
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant={sortBy === 'price_asc' ? 'primary' : 'outline'} 
                    onClick={() => { setSortBy('price_asc'); setShowSortModal(false); }}
                    className="w-full text-sm"
                    fullWidth
                  >
                    Дешевле
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant={sortBy === 'price_desc' ? 'primary' : 'outline'} 
                    onClick={() => { setSortBy('price_desc'); setShowSortModal(false); }}
                    className="w-full text-sm"
                    fullWidth
                  >
                    Дороже
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-2">
                  <Button 
                    variant={sortBy === 'rating_desc' ? 'primary' : 'outline'} 
                    onClick={() => { setSortBy('rating_desc'); setShowSortModal(false); }}
                    className="w-full text-sm"
                    fullWidth
                    leftIcon={<TrendingUp size={16} />}
                  >
                    По рейтингу
                  </Button>
                </motion.div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Категория услуги</label>
              <select
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
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
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="primary"
              fullWidth
              onClick={() => setShowSortModal(false)}
              className="bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg"
            >
              Применить
            </Button>
          </motion.div>
        </motion.div>
      </Modal>
    </div>
  );
};

export default ServicesPage;
