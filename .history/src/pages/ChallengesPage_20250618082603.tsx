import React, { useState, useRef } from 'react';
import Button from '../components/ui/Button';
import { useChallenges } from '../hooks/useChallenges';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/ui/Modal';
import { challengesApi } from '../lib/api/challenges';
import ChallengeCard from '../components/ui/ChallengeCard';
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
    const filteredChallenges = (challenges || []).filter((challenge: Challenge) => {
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

            // Сброс формы
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Заголовок */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                        Челленджи
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Участвуйте в конкурсах, демонстрируйте свои навыки и выигрывайте потрясающие призы
                    </p>

                    {isAdmin && (
                        <div className="mt-8">
                            <Button
                                variant="primary"
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                                onClick={() => setShowCreate(true)}
                            >
                                ✨ Создать челлендж
                            </Button>
                        </div>
                    )}
                </div>

                {/* Вкладки */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
                        <div className="flex gap-1">
                            {TABS.map(tabItem => (
                                <button
                                    key={tabItem.id}
                                    className={`relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${tab === tabItem.id
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    onClick={() => setTab(tabItem.id as any)}
                                >
                                    <span className="text-lg">{tabItem.icon}</span>
                                    <span>{tabItem.label}</span>
                                    {getTabCount(tabItem.id) > 0 && (
                                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${tab === tabItem.id
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {getTabCount(tabItem.id)}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Фильтры */}
                <div className="flex justify-center mb-12">
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {FILTERS.map(f => (
                            <button
                                key={f.id}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 whitespace-nowrap ${filter === f.id
                                        ? 'bg-white text-gray-900 shadow-lg border-2 border-blue-200'
                                        : 'bg-white/60 text-gray-600 hover:bg-white hover:text-gray-900 border border-gray-200'
                                    }`}
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
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-xl text-gray-600">Загружаем челленджи...</p>
                        </div>
                    </div>
                ) : filteredChallenges.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🎯</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Нет челленджей</h3>
                        <p className="text-gray-600 mb-8">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredChallenges.map((challenge: Challenge) => (
                            <ChallengeCard
                                key={challenge.id}
                                title={challenge.title}
                                description={challenge.description}
                                image={challenge.background_url || challenge.image_url}
                                avatar={challenge.avatar_url || challenge.brand_logo}
                                prize={challenge.prize}
                                endsAt={challenge.ends_at}
                                createdAt={challenge.created_at}
                                participants={challenge.current_participants}
                                participantsLimit={challenge.participants_limit}
                                brand={challenge.brand}
                                onClick={() => navigate(`/challenges/${challenge.id}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Модальное окно создания челленджа */}
                <Modal isOpen={showCreate} onClose={() => setShowCreate(false)}>
                    <div className="p-6 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            Создать новый челлендж
                        </h2>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Название *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Введите название челленджа"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Описание
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Опишите условия челленджа"
                                    rows={3}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Бренд
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Название бренда (опционально)"
                                    value={brand}
                                    onChange={e => setBrand(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Изображение
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
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
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Тип приза
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Приз
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="500₽, iPhone, и т.д."
                                        value={prize}
                                        onChange={e => setPrize(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Дата окончания *
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={endsAt}
                                        onChange={e => setEndsAt(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Лимит участников
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Без лимита"
                                        value={participantsLimit}
                                        onChange={e => setParticipantsLimit(e.target.value)}
                                    />
                                </div>
                            </div>

                            {createError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-red-700 text-sm">{createError}</p>
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
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
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