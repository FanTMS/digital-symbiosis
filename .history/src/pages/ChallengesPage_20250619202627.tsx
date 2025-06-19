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
import { Trophy, Flame, CheckCircle, User, Filter, Plus, Upload, Calendar, Users, Gift } from 'lucide-react';

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-20">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Заголовок страницы */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                                Челленджи
                            </h1>
                            <p className="text-gray-600">Участвуйте в конкурсах и выигрывайте призы</p>
                        </div>

                        {isAdmin && (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    variant="primary"
                                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
                                    onClick={() => setShowCreate(true)}
                                >
                                    <Plus size={20} className="mr-2" />
                                    Создать челлендж
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Вкладки */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-1.5">
                        <div className="flex gap-1">
                            {TABS.map(tabItem => {
                                const Icon = tabItem.icon;
                                const isActive = tab === tabItem.id;
                                const count = getTabCount(tabItem.id);

                                return (
                                    <button
                                        key={tabItem.id}
                                        className={`
                                            flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200
                                            flex items-center justify-center gap-2
                                            ${isActive
                                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }
                                        `}
                                        onClick={() => setTab(tabItem.id as any)}
                                    >
                                        <Icon size={18} />
                                        <span>{tabItem.label}</span>
                                        {count > 0 && (
                                            <span className={`
                                                ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                                                ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}
                                            `}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Фильтры */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Filter size={18} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Фильтр по призам:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map(f => (
                            <motion.button
                                key={f.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                                    transition-all duration-200 shadow-sm
                                    ${filter === f.id
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                                        : 'bg-white text-gray-700 hover:shadow-md'
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, idx) => (
                                <motion.div key={idx} variants={item}>
                                    <ChallengeSkeleton />
                                </motion.div>
                            ))}
                        </div>
                    ) : filteredChallenges.length === 0 ? (
                        <motion.div
                            variants={item}
                            className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl max-w-2xl mx-auto"
                        >
                            <Trophy size={80} className="mx-auto text-gray-300 mb-6" />
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
                                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                >
                                    <Plus size={20} className="mr-2" />
                                    Создать первый челлендж
                                </Button>
                            )}
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-6 text-center">
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
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
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
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none min-h-[120px] resize-none transition-all"
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
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
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
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 font-medium hover:from-orange-200 hover:to-red-200 transition-all flex items-center gap-2"
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
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
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
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
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
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
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
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
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
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
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