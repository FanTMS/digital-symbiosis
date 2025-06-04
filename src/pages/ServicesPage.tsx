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
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
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
    if (tab === "favorites" || tab === "all") {
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
    <div className="pb-16 pt-2" data-oid="e4i8nq9">
      <div className="px-4 mb-6" data-oid="6r.:66l">
        <div
          className="flex justify-between items-center mb-4"
          data-oid="ohbc4b1"
        >
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            data-oid="o910jmb"
          >
            Услуги
            <button
              className="ml-2 p-1 rounded-full hover:bg-yellow-100 transition text-yellow-400"
              onClick={() => navigate("/favorites")}
              title="Избранное"
              data-oid="kchia_r"
            >
              <StarIcon size={24} data-oid="it983vr" />
            </button>
          </h1>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} data-oid="6f_5l6_" />}
            onClick={handleCreateService}
            data-oid="fksqedk"
          >
            Создать
          </Button>
        </div>

        {/* Search bar */}
        <div
          className="relative bg-gray-100 rounded-lg mb-4 flex items-center overflow-hidden"
          data-oid="pu.mv24"
        >
          <Search
            size={18}
            className="text-gray-500 absolute left-3"
            data-oid="e0x-h2-"
          />

          <input
            type="text"
            placeholder="Поиск услуг и специалистов..."
            className="bg-transparent w-full py-3 pl-10 pr-4 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-oid="nkqt-gg"
          />

          {searchTerm && (
            <button
              className="absolute right-3 text-gray-500"
              onClick={() => setSearchTerm("")}
              data-oid="b7_yxr_"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="overflow-x-auto pb-2 mb-4" data-oid="r8oq-5u">
          <div className="flex space-x-2" data-oid="1_qyf:a">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-1 whitespace-nowrap px-3 py-1.5 rounded-full text-sm ${selectedCategory === category.id ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-800"}`}
                data-oid="8:wm:g_"
              >
                <span data-oid="du89fo4">{category.emoji}</span>
                <span data-oid="aqct.in">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Фильтры и сортировка */}
        <div
          className="flex flex-wrap gap-2 mb-4 items-end bg-white rounded-lg shadow-card px-3 py-2 border border-gray-100"
          data-oid="zwy.h48"
        >
          <div className="flex items-center gap-1" data-oid="kfypnq_">
            <span
              className="text-gray-400 text-base font-bold"
              data-oid="fl0v93y"
            >
              ₽
            </span>
            <input
              type="number"
              min={0}
              className="w-16 rounded-md border border-gray-200 px-2 py-1 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-200 transition"
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
              placeholder="от"
              data-oid="i212-hn"
            />

            <span className="mx-1 text-gray-400" data-oid="p.g-l.i">
              –
            </span>
            <input
              type="number"
              min={0}
              className="w-16 rounded-md border border-gray-200 px-2 py-1 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-200 transition"
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
              placeholder="до"
              data-oid="4lyw1c."
            />
          </div>
          <div className="flex items-center gap-1" data-oid="vxig--g">
            <StarIcon
              size={16}
              className="text-yellow-400"
              data-oid="8_t:4pj"
            />

            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              className="w-12 rounded-md border border-gray-200 px-2 py-1 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-200 transition"
              value={ratingFrom}
              onChange={(e) => setRatingFrom(e.target.value)}
              placeholder="от"
              data-oid="tmeyz3:"
            />

            <span className="mx-1 text-gray-400" data-oid="1w55k8h">
              –
            </span>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              className="w-12 rounded-md border border-gray-200 px-2 py-1 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-200 transition"
              value={ratingTo}
              onChange={(e) => setRatingTo(e.target.value)}
              placeholder="до"
              data-oid="cvw:s16"
            />
          </div>
          <div className="flex items-center gap-1" data-oid="z097yvo">
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded bg-gray-50 border border-gray-200 text-gray-700 hover:bg-primary-50 transition text-sm font-medium"
              onClick={() => setShowSortModal(true)}
              data-oid="1wm3fw9"
            >
              <SortAsc
                size={16}
                className="text-primary-500"
                data-oid="q-77e48"
              />

              <span data-oid="htnqlli">Сортировка</span>
            </button>
          </div>
          <button
            className="ml-auto flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition underline px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-200"
            onClick={() => {
              setPriceFrom("");
              setPriceTo("");
              setRatingFrom("");
              setRatingTo("");
              setSortBy("date_desc");
            }}
            title="Сбросить фильтры"
            data-oid=".5o_ofa"
          >
            <X size={14} data-oid="asdy62l" /> Сбросить
          </button>
        </div>

        {/* Services list */}
        {isLoading && page === 0 && activeTab === "all" ? (
          <div className="space-y-3" data-oid="y4znrce">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-100 animate-pulse h-32 rounded-lg"
                data-oid="d82i_3p"
              ></div>
            ))}
          </div>
        ) : activeTab === "all" ? (
          filteredServices.length > 0 ? (
            <>
              <List
                height={
                  CARD_HEIGHT * Math.min(filteredServices.length, VISIBLE_COUNT)
                }
                itemCount={filteredServices.length}
                itemSize={CARD_HEIGHT}
                width={"100%"}
                style={{
                  minHeight:
                    CARD_HEIGHT *
                    Math.min(filteredServices.length, VISIBLE_COUNT),
                }}
                data-oid="b_e.13y"
              >
                {({
                  index,
                  style,
                }: {
                  index: number;
                  style: React.CSSProperties;
                }) => (
                  <div
                    style={style}
                    key={filteredServices[index].id}
                    data-oid="mdodksb"
                  >
                    <ServiceCard
                      service={filteredServices[index]}
                      data-oid="kjkwtr4"
                    />
                  </div>
                )}
              </List>
              {hasMore && (
                <div className="flex justify-center mt-4" data-oid="lj7myi2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetching}
                    data-oid="gl-n:tr"
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
              data-oid="r._yhr_"
            >
              <div className="text-4xl mb-2" data-oid="y61mro2">
                🔍
              </div>
              <h3 className="text-lg font-medium mb-1" data-oid="5j-b:f7">
                Ничего не найдено
              </h3>
              <p className="text-gray-500 mb-4 max-w-xs" data-oid="eyr7y19">
                Попробуйте изменить параметры поиска или создайте новую услугу
              </p>
              <Button
                variant="primary"
                leftIcon={<Plus size={16} data-oid="xr9ioi8" />}
                onClick={handleCreateService}
                data-oid="7:po5s8"
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
            data-oid="k881s5p"
          >
            {favoriteServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onFavoriteChange={() => {
                  if ((window as any).refetchFavorites)
                    (window as any).refetchFavorites();
                }}
                data-oid="irw6gov"
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
            data-oid="vkluc12"
          >
            <div className="text-4xl mb-2" data-oid=".9.d.mr">
              ⭐
            </div>
            <h3 className="text-lg font-medium mb-1" data-oid="w:_i4kw">
              Нет избранных услуг
            </h3>
            <p className="text-gray-500 mb-4 max-w-xs" data-oid="xw.gd0b">
              Добавьте услуги в избранное, чтобы быстро находить их позже
            </p>
          </motion.div>
        )}
      </div>
      {/* Модалка сортировки */}
      <Modal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        data-oid="by9qjkj"
      >
        <div className="p-4" data-oid="yh37l43">
          <h2 className="text-lg font-semibold mb-4" data-oid="sr72sro">
            Сортировка
          </h2>
          <div className="flex flex-col gap-2" data-oid="wwz8x6h">
            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${sortBy === "date_desc" ? "bg-primary-100 text-primary-800 font-bold" : "hover:bg-gray-100"}`}
              onClick={() => {
                setSortBy("date_desc");
                setShowSortModal(false);
              }}
              data-oid="cy3dosc"
            >
              Сначала новые
            </button>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${sortBy === "date_asc" ? "bg-primary-100 text-primary-800 font-bold" : "hover:bg-gray-100"}`}
              onClick={() => {
                setSortBy("date_asc");
                setShowSortModal(false);
              }}
              data-oid="q1jatpw"
            >
              Сначала старые
            </button>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${sortBy === "price_asc" ? "bg-primary-100 text-primary-800 font-bold" : "hover:bg-gray-100"}`}
              onClick={() => {
                setSortBy("price_asc");
                setShowSortModal(false);
              }}
              data-oid="vcxd30x"
            >
              Цена ↑
            </button>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${sortBy === "price_desc" ? "bg-primary-100 text-primary-800 font-bold" : "hover:bg-gray-100"}`}
              onClick={() => {
                setSortBy("price_desc");
                setShowSortModal(false);
              }}
              data-oid="wxrd9gf"
            >
              Цена ↓
            </button>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${sortBy === "rating_desc" ? "bg-primary-100 text-primary-800 font-bold" : "hover:bg-gray-100"}`}
              onClick={() => {
                setSortBy("rating_desc");
                setShowSortModal(false);
              }}
              data-oid="pnav5un"
            >
              Рейтинг ↓
            </button>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${sortBy === "rating_asc" ? "bg-primary-100 text-primary-800 font-bold" : "hover:bg-gray-100"}`}
              onClick={() => {
                setSortBy("rating_asc");
                setShowSortModal(false);
              }}
              data-oid="vey9ptt"
            >
              Рейтинг ↑
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ServicesPage;
