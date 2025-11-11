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
  FileText,
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
    <div className="pb-16 pt-2 min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="px-4 sm:px-6 mb-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10 pointer-events-none" />
          <div className="relative">
            {/* Заголовок */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Услуги</h1>
                <p className="text-gray-600 text-sm">Найдите нужного специалиста</p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="icon" size="icon" onClick={() => setShowSortModal(true)} aria-label="Фильтры" className="bg-white shadow-lg">
                  <Filter size={20} />
                </Button>
              </motion.div>
            </div>

            {/* Быстрые действия */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-2 mb-4"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={16} />}
                  onClick={handleCreateService}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg"
                >
                  Создать
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FileText size={16} />}
                  onClick={() => navigate('/orders')}
                  className="w-full bg-white shadow-md border-primary-200 hover:bg-primary-50"
                >
                  Заказы
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<StarIcon size={16} />}
                  onClick={() => navigate("/favorites")}
                  className="w-full bg-white shadow-md border-primary-200 hover:bg-primary-50"
                >
                  Избранное
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Search bar - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mb-4"
        >
          <div className="relative bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-50 rounded-xl">
                <Search size={20} className="text-primary-600" />
              </div>
              <input
                type="text"
                placeholder="Поиск услуг и специалистов..."
                className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm("")}
                >
                  <X size={18} />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Categories chips убраны, фильтрация теперь через модальное окно */}

        {/* Вкладки - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex mb-4 bg-white rounded-2xl shadow-lg p-1.5"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-3 rounded-xl text-center font-semibold transition-all ${activeTab === 'all' ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('all')}
          >
            Все услуги
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-3 rounded-xl text-center font-semibold transition-all ${activeTab === 'my' ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
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
          className="flex mb-4 bg-white rounded-2xl shadow-lg p-1.5 gap-2"
        >
          {(['all', 'provider', 'client'] as const).map((filter) => (
            <motion.button
              key={filter}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-2.5 rounded-xl text-center text-sm font-medium transition-all ${
                roleFilter === filter
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setRoleFilter(filter)}
            >
              {filter === 'all' ? 'Все' : filter === 'provider' ? 'Исполнители' : 'Заказчики'}
            </motion.button>
          ))}
        </motion.div>

        {/* Services list - Enhanced */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
        >
          {isLoading && page === 0 && activeTab === "all" ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gray-100 animate-pulse h-40 rounded-2xl"
                />
              ))}
            </div>
          ) : activeTab === "all" ? (
            filteredServices.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex justify-center mt-6"
                  >
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={isFetching}
                      className="border-2 border-primary-200 text-primary-600 hover:bg-primary-50"
                    >
                      {isFetching ? "Загрузка..." : "Показать ещё"}
                    </Button>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 text-center shadow-lg border border-gray-100"
              >
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={40} className="text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Ничего не найдено</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Попробуйте изменить параметры поиска или создайте новую услугу
                </p>
                <Button
                  variant="primary"
                  leftIcon={<Plus size={18} />}
                  onClick={handleCreateService}
                  className="mx-auto"
                >
                  Создать услугу
                </Button>
              </motion.div>
            )
          ) : activeTab === "my" ? (
            filteredServices.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex justify-center mt-6"
                  >
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={isFetching}
                      className="border-2 border-primary-200 text-primary-600 hover:bg-primary-50"
                    >
                      {isFetching ? "Загрузка..." : "Показать ещё"}
                    </Button>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 text-center shadow-lg border border-gray-100"
              >
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={40} className="text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">У вас пока нет своих услуг</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Создайте первую услугу, чтобы начать принимать заказы
                </p>
                <Button
                  variant="primary"
                  leftIcon={<Plus size={18} />}
                  onClick={handleCreateService}
                  className="mx-auto"
                >
                  Создать услугу
                </Button>
              </motion.div>
            )
          ) : null}
        </motion.div>
      </div>
      {/* Модальное окно сортировки - Enhanced */}
      <Modal isOpen={showSortModal} onClose={() => setShowSortModal(false)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 w-[90vw] max-w-md bg-white rounded-3xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-primary-50 rounded-xl">
              <Filter size={24} className="text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Фильтры и сортировка</h2>
          </div>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Сортировка</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'date_desc', label: 'Сначала новые' },
                  { value: 'date_asc', label: 'Сначала старые' },
                  { value: 'price_asc', label: 'Дешевле' },
                  { value: 'price_desc', label: 'Дороже' },
                  { value: 'rating_desc', label: 'По рейтингу', className: 'col-span-2' },
                ].map((option) => (
                  <motion.div key={option.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant={sortBy === option.value ? 'primary' : 'outline'}
                      className={`w-full ${option.className || ''} ${sortBy === option.value ? 'bg-gradient-to-r from-primary-500 to-primary-600' : ''}`}
                      onClick={() => { setSortBy(option.value as any); setShowSortModal(false); }}
                    >
                      {option.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Категория услуги</label>
              <select
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white"
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
          <Button
            variant="primary"
            fullWidth
            onClick={() => setShowSortModal(false)}
            className="bg-gradient-to-r from-primary-500 to-primary-600"
          >
            Применить
          </Button>
        </motion.div>
      </Modal>
    </div>
  );
};

export default ServicesPage;
