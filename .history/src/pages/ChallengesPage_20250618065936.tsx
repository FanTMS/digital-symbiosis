import React, { useState, useRef } from 'react';
import Button from '../components/ui/Button';
import { useChallenges } from '../hooks/useChallenges';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/ui/Modal';
import { challengesApi } from '../lib/api/challenges';
import ChallengeCard from '../components/ui/ChallengeCard';
import PromoBanner from '../components/ui/PromoBanner';
import { supabase } from '../lib/supabase';

// TODO: Получать данные из Supabase
// const { data: challenges, isLoading } = useChallenges();

const TABS = [
    { id: 'active', label: 'Активные' },
    { id: 'finished', label: 'Завершённые' },
    { id: 'my', label: 'Мои' },
];

const FILTERS = [
    { id: 'all', label: 'Все бренды' },
    { id: 'money', label: 'Деньги' },
    { id: 'certificate', label: 'Сертификаты' },
    { id: 'item', label: 'Товары' },
    { id: 'points', label: 'Баллы' },
];

const ChallengesPage: React.FC = () => {
    const [tab, setTab] = useState<'active' | 'finished' | 'my'>('active');
    const [filter, setFilter] = useState('all');
    const { user: currentUser } = useUser();
    const isAdmin = currentUser?.role === 'admin';
    const { data: challenges, isLoading } = useChallenges();
    const navigate = useNavigate();
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [prize, setPrize] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [createError, setCreateError] = useState('');
    const [creating, setCreating] = useState(false);
    const { refetch } = useChallenges();
    const [brand, setBrand] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prizeType, setPrizeType] = useState<'money' | 'certificate' | 'item' | 'points'>('money');
    const [participantsLimit, setParticipantsLimit] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Фильтрация
    const filtered = (challenges || []).filter((c: any) => {
        if (tab === 'my') return c.my_participation;
        if (tab === 'active') return c.status === 'active';
        if (tab === 'finished') return c.status === 'finished';
        return true;
    }).filter((c: any) => {
        if (filter === 'all') return true;
        if (filter === 'money') return c.prize_type === 'money';
        if (filter === 'certificate') return c.prize_type === 'certificate';
        if (filter === 'item') return c.prize_type === 'item';
        if (filter === 'points') return c.prize_type === 'points';
        return true;
    });

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
            setCreateError('Заполните все поля');
            return;
        }
        setCreating(true);
        try {
            let image_url = null;
            if (imageFile) {
                // Загрузка изображения в Supabase Storage
                const ext = imageFile.name.split('.').pop();
                const filePath = `challenges/${Date.now()}.${ext}`;
                const { error } = await supabase.storage.from('challenge-files').upload(filePath, imageFile, { upsert: true });
                if (error) throw error;
                const { data } = supabase.storage.from('challenge-files').getPublicUrl(filePath);
                image_url = data.publicUrl;
            }
            await challengesApi.create({
                title: title.trim(),
                description: description.trim(),
                prize: prize.trim(),
                prize_type: prizeType,
                ends_at: endsAt,
                status: 'active',
                brand: brand.trim(),
                image_url,
                participants_limit: participantsLimit ? Number(participantsLimit) : null,
            });
            setShowCreate(false);
            setTitle(''); setDescription(''); setPrize(''); setEndsAt(''); setBrand(''); setImageFile(null); setImagePreview(null); setParticipantsLimit('');
            refetch();
        } catch (e: any) {
            setCreateError(e.message || 'Ошибка создания');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            {/* Промо-блок */}
            <PromoBanner image={filtered[0]?.image_url} />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Челленджи</h1>
                {isAdmin && (
                    <Button variant="primary" className="h-11 rounded-xl px-5 text-base font-semibold shadow-sm" onClick={() => setShowCreate(true)}>Создать челлендж</Button>
                )}
            </div>
            {/* Вкладки */}
            <div className="flex gap-2 mb-4">
                {TABS.map(tabItem => (
                    <Button key={tabItem.id} variant={tab === tabItem.id ? 'primary' : 'outline'} className="rounded-full px-5" onClick={() => setTab(tabItem.id as any)}>{tabItem.label}</Button>
                ))}
            </div>
            {/* Фильтры */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {FILTERS.map(f => (
                    <Button key={f.id} variant={filter === f.id ? 'primary' : 'outline'} className="rounded-full px-4 text-sm" onClick={() => setFilter(f.id)}>{f.label}</Button>
                ))}
            </div>
            {/* Список челленджей */}
            {isLoading ? (
                <div className="text-gray-400 text-center py-12">Загрузка...</div>
            ) : filtered.length === 0 ? (
                <div className="text-gray-400 text-center py-12">Нет челленджей</div>
            ) : (
                <div className="grid gap-6">
                    {filtered.map((ch: any) => (
                        <ChallengeCard
                            key={ch.id}
                            title={ch.title}
                            description={ch.description}
                            image={ch.image_url || undefined}
                            brand={ch.brand || undefined}
                            prize={ch.prize}
                            endsAt={ch.ends_at}
                            onClick={() => navigate(`/challenges/${ch.id}`)}
                        />
                    ))}
                </div>
            )}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)}>
                <form onSubmit={handleCreate} className="p-4 w-80 flex flex-col gap-3">
                    <h2 className="font-bold text-lg mb-2">Создать челлендж</h2>
                    <input className="border rounded px-2 py-1" placeholder="Название" value={title} onChange={e => setTitle(e.target.value)} />
                    <textarea className="border rounded px-2 py-1" placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
                    <input className="border rounded px-2 py-1" placeholder="Бренд (опционально)" value={brand} onChange={e => setBrand(e.target.value)} />
                    <div>
                        <label className="block text-sm font-medium mb-1">Фото/баннер</label>
                        <div className="flex items-center gap-2">
                            <button type="button" className="px-3 py-1 bg-blue-100 text-blue-700 rounded" onClick={() => fileInputRef.current?.click()}>Загрузить</button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                            {imagePreview && <img src={imagePreview} alt="preview" className="w-16 h-16 object-cover rounded" />}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Тип приза</label>
                        <select className="border rounded px-2 py-1 w-full" value={prizeType} onChange={e => setPrizeType(e.target.value as any)}>
                            <option value="money">Деньги</option>
                            <option value="certificate">Сертификат</option>
                            <option value="item">Товар</option>
                            <option value="points">Баллы</option>
                        </select>
                    </div>
                    <input className="border rounded px-2 py-1" placeholder="Приз (например, 500₽, сертификат, товар)" value={prize} onChange={e => setPrize(e.target.value)} />
                    <input className="border rounded px-2 py-1" type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
                    <input className="border rounded px-2 py-1" type="number" min="0" placeholder="Лимит участников (опционально)" value={participantsLimit} onChange={e => setParticipantsLimit(e.target.value)} />
                    {createError && <div className="text-red-500 text-xs">{createError}</div>}
                    <Button type="submit" variant="primary" isLoading={creating}>Создать</Button>
                </form>
            </Modal>
        </div>
    );
};

export default ChallengesPage; 