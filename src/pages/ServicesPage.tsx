import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';
import { Search, Plus, Filter, X, Star as StarIcon, SortAsc, SortDesc } from 'lucide-react';
import { useServices } from '../hooks/useServices';
import ServiceCard from '../components/ui/ServiceCard';
import Button from '../components/ui/Button';
import type { Database } from '../types/supabase';
import { supabase } from '../lib/supabase';

type Service = Database['public']['Tables']['services']['Row'];
type ServiceCategory = 'education' | 'it' | 'design' | 'languages' | 'business' | 'lifestyle';

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { tg, user } = useTelegram();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [ratingFrom, setRatingFrom] = useState('');
  const [ratingTo, setRatingTo] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'price_asc' | 'price_desc' | 'rating_asc' | 'rating_desc'>('date_desc');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [favoriteServices, setFavoriteServices] = useState<any[]>([]);
  
  const { data: services, isLoading } = useServices(selectedCategory === 'all' ? undefined : selectedCategory);
  
  const location = useLocation();
  
  React.useEffect(() => {
    if (tg) {
      tg.setHeaderColor('#0BBBEF');
      tg.BackButton.show();
      const handleBack = () => navigate('/');
      tg.BackButton.onClick(handleBack);
      
      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick(handleBack);
      };
    }
  }, [tg, navigate]);
  
  useEffect(() => {
    if (activeTab !== 'favorites' || !user?.id) return;
    const fetchFavorites = async () => {
      // Получаем id избранных услуг
      const { data: favs, error: favsError } = await supabase
        .from('favorites')
        .select('service_id')
        .eq('user_id', user.id);
      const ids = favs?.map((f: any) => f.service_id) || [];
      let services = [];
      if (ids.length > 0) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*, user:users(*)')
          .in('id', ids);
        services = servicesData || [];
      }
      setFavoriteServices(services);
    };
    fetchFavorites();
    (window as any).refetchFavorites = fetchFavorites;
  }, [activeTab, user?.id]);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'favorites' || tab === 'all') {
      setActiveTab(tab);
    }
  }, [location.search]);
  
  useEffect(() => {
    if (services) {
      console.log('services:', services);
    }
  }, [services]);
  
  const handleCreateService = () => {
    navigate('/create-service');
  };
  
  const categories: { id: ServiceCategory | 'all'; label: string; emoji: string }[] = [
    { id: 'all', label: 'Все', emoji: '🔍' },
    { id: 'education', label: 'Образование', emoji: '🎓' },
    { id: 'it', label: 'IT', emoji: '💻' },
    { id: 'design', label: 'Дизайн', emoji: '🎨' },
    { id: 'languages', label: 'Языки', emoji: '🌐' },
    { id: 'business', label: 'Бизнес', emoji: '💼' },
    { id: 'lifestyle', label: 'Лайфстайл', emoji: '🌿' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const filteredServices = services?.filter((service: any) => {
    const matchesTitle = service.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesPrice = (priceFrom === '' || service.price >= parseFloat(priceFrom)) && (priceTo === '' || service.price <= parseFloat(priceTo));
    const matchesRating = (ratingFrom === '' || service.rating >= parseFloat(ratingFrom)) && (ratingTo === '' || service.rating <= parseFloat(ratingTo));
    return matchesTitle && matchesCategory && matchesPrice && matchesRating;
  }) || [];

  return (
    <div className="pb-16 pt-2">
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Услуги
            <button
              className="ml-2 p-1 rounded-full hover:bg-yellow-100 transition text-yellow-400"
              onClick={() => navigate('/favorites')}
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
              onClick={() => setSearchTerm('')}
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
                className={`flex items-center space-x-1 whitespace-nowrap px-3 py-1.5 rounded-full text-sm ${selectedCategory === category.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-800'}`}
              >
                <span>{category.emoji}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Фильтры и сортировка */}
        <div className="flex flex-wrap gap-2 mb-4 items-end bg-white rounded-lg shadow-card px-3 py-2 border border-gray-100">
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-base font-bold">₽</span>
            <input type="number" min={0} className="w-16 rounded-md border border-gray-200 px-2 py-1 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-200 transition" value={priceFrom} onChange={e => setPriceFrom(e.target.value)} placeholder="от" />
            <span className="mx-1 text-gray-400">–</span>
            <input type="number" min={0} className="w-16 rounded-md border border-gray-200 px-2 py-1 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-200 transition" value={priceTo} onChange={e => setPriceTo(e.target.value)} placeholder="до" />
          </div>
          <div className="flex items-center gap-1">
            <StarIcon size={16} className="text-yellow-400" />
            <input type="number" min={0} max={5} step={0.1} className="w-12 rounded-md border border-gray-200 px-2 py-1 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-200 transition" value={ratingFrom} onChange={e => setRatingFrom(e.target.value)} placeholder="от" />
            <span className="mx-1 text-gray-400">–</span>
            <input type="number" min={0} max={5} step={0.1} className="w-12 rounded-md border border-gray-200 px-2 py-1 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-200 transition" value={ratingTo} onChange={e => setRatingTo(e.target.value)} placeholder="до" />
          </div>
          <div className="flex items-center gap-1">
            <SortAsc size={16} className="text-gray-400" />
            <select className="rounded-md border border-gray-200 px-2 py-1 bg-gray-50 text-sm focus:ring-2 focus:ring-primary-200 transition" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
              <option value="date_desc">Сначала новые</option>
              <option value="date_asc">Сначала старые</option>
              <option value="price_asc">Цена ↑</option>
              <option value="price_desc">Цена ↓</option>
              <option value="rating_desc">Рейтинг ↓</option>
              <option value="rating_asc">Рейтинг ↑</option>
            </select>
          </div>
          <button
            className="ml-auto flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition underline px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-200"
            onClick={() => { setPriceFrom(''); setPriceTo(''); setRatingFrom(''); setRatingTo(''); setSortBy('date_desc'); }}
            title="Сбросить фильтры"
          >
            <X size={14} /> Сбросить
          </button>
        </div>
        
        {/* Services list */}
        {isLoading && activeTab === 'all' ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 animate-pulse h-32 rounded-lg"></div>
            ))}
          </div>
        ) : activeTab === 'all' ? (
          filteredServices.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-3"
            >
              {filteredServices.map((service) => (
                <motion.div key={service.id} variants={item}>
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
        ) : (
          // Вкладка избранное
          favoriteServices.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-3"
            >
              {favoriteServices.map((service) => (
                <ServiceCard key={service.id} service={service} onFavoriteChange={() => {
                  if ((window as any).refetchFavorites) (window as any).refetchFavorites();
                }} />
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
          )
        )}
      </div>
    </div>
  );
};

export default ServicesPage;