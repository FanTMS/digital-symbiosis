import React, { useState, useRef } from 'react';
import Button from '../components/ui/Button';
import { useChallenges } from '../hooks/useChallenges';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/ui/Modal';
import { challengesApi } from '../lib/api/challenges';
import ChallengeCard from '../components/ui/ChallengeCard';
import ChallengeSkeleton from '../components/ui/ChallengeSkeleton';
import { supabase } from '../lib/supabase';
import type { Challenge } from '../types/models';
import { motion } from 'framer-motion';
import { Trophy, Flame, CheckCircle, User, Filter, Plus, Upload, Calendar, Users, Gift, Sparkles, Zap } from 'lucide-react';

const TABS = [
    { id: 'active', label: 'Активные', icon: Flame },
    { id: 'finished', label: 'Завершённые', icon: CheckCircle },
    { id: 'my', label: 'Мои', icon: User },
] as const;

const FILTERS = [
    { id: 'all', label: 'Все категории', icon: '🎯' },
    { id: 'money', label: 'Деньги', icon: '💰' },
    { id: 'certificate', label: 'Сертификаты', icon: '🎫' },
    { id: 'item', label: 'Товары', icon: '🎁' },
    { id: 'points', label: 'Баллы', icon: '⭐' },
] as const;

const ChallengesPage: React.FC = () => {
    const [tab, setTab] = useState<'active' | 'finished' | 'my'>('active');
    const [filter, setFilter] = useState('all');
    const { user: currentUser } = useUser();
    const isAdmin = currentUser?.role === 'admin';
    const { data: challenges, isLoading, refetch } = useChallenges();
    const navigate = useNavigate();

    // Модальное окно создания челленджа
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [prize, setPrize] = useState('');
    const [prizeType, setPrizeType] = useState<'money' | 'certificate' | 'item' | 'points'>('money');
    const [endsAt, setEndsAt] = useState('');
    const [brand, setBrand] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [participantsLimit, setParticipantsLimit] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Фильтрация челленджей
    const filteredChallenges = (challenges || [])
        .filter((challenge: Challenge | null | undefined) => !!challenge)
        .filter((challenge: Challenge) => {
            // Фильтр по вкладкам
            if (tab === 'my') return challenge.my_participation;
            if (tab === 'active') return challenge.status === 'active';
            if (tab === 'finished') return challenge.status === 'finished';
            // Фильтр по типу приза
            if (filter === 'all') return true;
            return challenge.prize_type === filter;
        });

    const getTabCount = (tabId: string) => {
        if (!challenges) return 0;

        return challenges.filter((challenge: Challenge) => {
            if (tabId === 'my') return challenge.my_participation;
            if (tabId === 'active') return challenge.status === 'active';
            if (tabId === 'finished') return challenge.status === 'finished';
            return false;
        }).length;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImageFile(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        if (!title.trim() || !endsAt) {
            setCreateError('Заполните все обязательные поля');
            return;
        }
        setCreating(true);
        try {
            let image_url = null;
            if (imageFile) {
                const ext = imageFile.name.split('.').pop();
                const filePath = `challenges/${Date.now()}.${ext}`;
                const { error } = await supabase.storage.from('challenge-files').upload(filePath, imageFile, { upsert: true });
                if (error) throw error;
                const { data } = supabase.storage.from('challenge-files').getPublicUrl(filePath);
                image_url = data.publicUrl;
            }
            await challengesApi.create({
                title: title.trim(),
                description: description.trim() || null,
                prize: prize.trim(),
                prize_type: prizeType,
                ends_at: endsAt,
                status: 'active',
                brand: brand.trim() || null,
                image_url,
                participants_limit: participantsLimit ? Number(participantsLimit) : null,
            });
            setShowCreate(false);
            setTitle('');
            setDescription('');
            setPrize('');
            setEndsAt('');
            setBrand('');
            setImageFile(null);
            setImagePreview(null);
            setParticipantsLimit('');
            refetch();
        } catch (e: any) {
            setCreateError(e.message || 'Ошибка создания челленджа');
        } finally {
            setCreating(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <div className="pb-20 sm:pb-24 pt-2 min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative px-4 sm:px-6 pt-6 pb-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Trophy size={28} className="text-primary-600" />
                                <h1 className="text-3xl font-bold text-gray-900">Челленджи</h1>
                            </div>
                            <p className="text-gray-600 text-sm">Участвуйте в конкурсах и выигрывайте призы</p>
                        </div>

                        {isAdmin && (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    variant="primary"
                                    className="bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg"
                                    onClick={() => setShowCreate(true)}
                                >
                                    <Plus size={20} className="mr-2" />
                                    Создать
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>

            <div className="px-2 sm:px-4 py-4">

                {/* Вкладки - Enhanced */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <div className="bg-white rounded-2xl shadow-lg p-1.5">
                        <div className="flex gap-2">
                            {TABS.map(tabItem => {
                                const Icon = tabItem.icon;
                                const isActive = tab === tabItem.id;
                                const count = getTabCount(tabItem.id);

                                return (
                                    <motion.button
                                        key={tabItem.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`
                                            flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200
                                            flex items-center justify-center gap-2
                                            ${isActive
                                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }
                                        `}
                                        onClick={() => setTab(tabItem.id as any)}
                                    >
                                        <Icon size={18} />
                                        <span>{tabItem.label}</span>
                                        {count > 0 && (
                                            <span className={`
                                                ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                                                ${isActive ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-600'}
                                            `}>
                                                {count}
                                            </span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Фильтры - Enhanced */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-primary-50 rounded-xl">
                            <Filter size={18} className="text-primary-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Фильтр по призам</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map(f => (
                            <motion.button
                                key={f.id}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold
                                    transition-all duration-200 shadow-md
                                    ${filter === f.id
                                        ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg'
                                        : 'bg-white text-gray-700 hover:shadow-lg border border-gray-200'
                                    }
                                `}
                                onClick={() => setFilter(f.id)}
                            >
                                <span className="text-base">{f.icon}</span>
                                <span>{f.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Список челленджей */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {Array.from({ length: 8 }).map((_, idx) => (
                                <motion.div key={idx} variants={item}>
                                    <ChallengeSkeleton />
                                </motion.div>
                            ))}
                        </div>
                    ) : filteredChallenges.length === 0 ? (
                        <motion.div
                            variants={item}
                            className="text-center py-16 bg-white rounded-3xl shadow-lg border border-gray-100 max-w-2xl mx-auto"
                        >
                            <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trophy size={48} className="text-primary-500" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                                Нет челленджей
                            </h3>
                            <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                                {tab === 'my'
                                    ? 'Вы ещё не участвуете ни в одном челлендже'
                                    : `Нет ${tab === 'active' ? 'активных' : 'завершённых'} челленджей в этой категории`
                                }
                            </p>
                            {isAdmin && tab === 'active' && (
                                <Button
                                    variant="primary"
                                    onClick={() => setShowCreate(true)}
                                    className="bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg"
                                >
                                    <Plus size={20} className="mr-2" />
                                    Создать первый челлендж
                                </Button>
                            )}
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredChallenges.map((challenge: Challenge) => (
                                <motion.div key={challenge.id} variants={item}>
                                    <ChallengeCard
                                        title={challenge.title}
                                        description={challenge.description || undefined}
                                        image={challenge.background_url || challenge.image_url || undefined}
                                        prize={challenge.prize}
                                        endsAt={challenge.ends_at}
                                        createdAt={challenge.created_at}
                                        participants={challenge.current_participants}
                                        participantsLimit={challenge.participants_limit || undefined}
                                        brand={challenge.brand || undefined}
                                        onClick={() => navigate(`/challenges/${challenge.id}`)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Модальное окно создания челленджа */}
                <Modal isOpen={showCreate} onClose={() => setShowCreate(false)}>
                    <div className="p-6 md:p-8 max-w-2xl w-full">
                        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                            Создать новый челлендж
                        </h2>

                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Название челленджа *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                                        placeholder="Введите название челленджа"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Описание челленджа
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none min-h-[120px] resize-none transition-all"
                                        placeholder="Опишите условия участия и требования"
                                        rows={4}
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Бренд/Спонсор
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                                        placeholder="Название бренда"
                                        value={brand}
                                        onChange={e => setBrand(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Изображение челленджа
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-xl bg-primary-50 text-primary-700 font-medium hover:bg-primary-100 transition-all flex items-center gap-2"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload size={18} />
                                            Загрузить
                                        </button>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        {imagePreview && (
                                            <img
                                                src={imagePreview}
                                                alt="Предпросмотр"
                                                className="w-20 h-20 object-cover rounded-xl shadow-md"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Тип приза
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                                        value={prizeType}
                                        onChange={e => setPrizeType(e.target.value as any)}
                                    >
                                        <option value="money">💰 Деньги</option>
                                        <option value="certificate">🎫 Сертификат</option>
                                        <option value="item">🎁 Товар</option>
                                        <option value="points">⭐ Баллы</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Приз
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                                        placeholder="500₽, iPhone 15, и т.д."
                                        value={prize}
                                        onChange={e => setPrize(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Дата окончания *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                                            value={endsAt}
                                            onChange={e => setEndsAt(e.target.value)}
                                        />
                                        <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Лимит участников
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
                                            placeholder="Без ограничений"
                                            value={participantsLimit}
                                            onChange={e => setParticipantsLimit(e.target.value)}
                                        />
                                        <Users size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {createError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-red-700 text-sm flex items-center gap-2">
                                        <span className="text-red-500">⚠️</span>
                                        {createError}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowCreate(false)}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1"
                                    isLoading={creating}
                                >
                                    Создать челлендж
                                </Button>
                            </div>
                        </form>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default ChallengesPage; 