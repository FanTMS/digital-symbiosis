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

const TABS = [
    { id: 'active', label: 'Активные', icon: '🔥' },
    { id: 'finished', label: 'Завершённые', icon: '✅' },
    { id: 'my', label: 'Мои', icon: '👤' },
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

    return (
        <div className="pb-16 pt-2">
            <div className="px-4 mb-6">
                {/* Заголовок страницы */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Челленджи
                    </h1>

                    {isAdmin && (
                        <Button
                            variant="primary"
                            className="h-11 rounded-xl px-5 text-base font-semibold shadow-sm sm:h-9 sm:px-3 sm:text-sm"
                            onClick={() => setShowCreate(true)}
                        >
                            <span className="mr-2">✨</span> Создать челлендж
                        </Button>
                    )}
                </div>

                {/* Вкладки */}
                <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                    <div className="flex flex-1 gap-1">
                        {TABS.map(tabItem => (
                            <button
                                key={tabItem.id}
                                className={`flex-1 py-2 rounded-md text-center text-sm md:text-base ${tab === tabItem.id ? 'bg-white text-primary-500 shadow-sm' : 'text-gray-600'}`}
                                onClick={() => setTab(tabItem.id as any)}
                            >
                                <span className="inline-flex items-center gap-1 justify-center">
                                    <span className="text-base md:text-lg">{tabItem.icon}</span>
                                    {tabItem.label}
                                </span>
                                {getTabCount(tabItem.id) > 0 && (
                                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${tab === tabItem.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'}`}>
                                        {getTabCount(tabItem.id)}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Фильтры */}
                <div className="overflow-x-auto pb-2 mb-4">
                    <div className="flex space-x-2">
                        {FILTERS.map(f => (
                            <button
                                key={f.id}
                                className={`flex items-center space-x-1 whitespace-nowrap px-3 py-1.5 rounded-full text-sm ${filter === f.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-800'}`}
                                onClick={() => setFilter(f.id)}
                            >
                                <span>{f.icon}</span>
                                <span>{f.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Список челленджей */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-pulse">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <ChallengeSkeleton key={idx} />
                        ))}
                    </div>
                ) : filteredChallenges.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl max-w-2xl mx-auto">
                        <div className="text-6xl mb-6">🎯</div>
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Нет челленджей</h3>
                        <p className="text-gray-600 mb-8 text-lg">
                            {tab === 'my'
                                ? 'Вы ещё не участвуете ни в одном челлендже'
                                : `Нет ${tab === 'active' ? 'активных' : 'завершённых'} челленджей в этой категории`
                            }
                        </p>
                        {isAdmin && tab === 'active' && (
                            <Button
                                variant="outline"
                                onClick={() => setShowCreate(true)}
                                className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                                Создать первый челлендж
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {filteredChallenges.map((challenge: Challenge) => (
                            <ChallengeCard
                                key={challenge.id}
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
                                className="animate-fadein"
                            />
                        ))}
                    </div>
                )}

                {/* Модальное окно создания челленджа */}
                <Modal isOpen={showCreate} onClose={() => setShowCreate(false)}>
                    <div className="p-6 md:p-8 max-w-lg w-full">
                        <h2 className="text-2xl md:text-3xl font-bold text-blue-700 mb-6 md:mb-8 text-center">
                            ✨ Создать новый челлендж
                        </h2>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Название *
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-base transition"
                                    placeholder="Введите название челленджа"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Описание
                                </label>
                                <textarea
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none min-h-[100px] text-base transition resize-none"
                                    placeholder="Опишите условия челленджа"
                                    rows={3}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Бренд
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-base transition"
                                    placeholder="Название бренда (опционально)"
                                    value={brand}
                                    onChange={e => setBrand(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Изображение
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        📷 Загрузить
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
                                            className="w-16 h-16 object-cover rounded-xl shadow-md"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Тип приза
                                    </label>
                                    <select
                                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-base transition"
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
                                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-base transition"
                                        placeholder="500₽, iPhone, и т.д."
                                        value={prize}
                                        onChange={e => setPrize(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Дата окончания *
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-base transition"
                                        value={endsAt}
                                        onChange={e => setEndsAt(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Лимит участников
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-base transition"
                                        placeholder="Без лимита"
                                        value={participantsLimit}
                                        onChange={e => setParticipantsLimit(e.target.value)}
                                    />
                                </div>
                            </div>

                            {createError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-red-700 text-sm">{createError}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 py-3"
                                    onClick={() => setShowCreate(false)}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3 font-semibold"
                                    isLoading={creating}
                                >
                                    Создать
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