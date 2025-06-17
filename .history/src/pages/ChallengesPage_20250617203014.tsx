import React, { useState, useRef } from 'react';
import Button from '../components/ui/Button';
import { useChallenges } from '../hooks/useChallenges';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/ui/Modal';
import { challengesApi } from '../lib/api/challenges';
import ChallengeCard from '../components/ui/PromoBanner';

// TODO: Получать данные из Supabase
// const { data: challenges, isLoading } = useChallenges();

const ChallengesPage: React.FC = () => {
    const [filter, setFilter] = useState<'active' | 'finished' | 'all'>('active');
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

    const filtered = (challenges || []).filter((c: any) =>
        filter === 'all' ? true : c.status === filter
    );

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
                const { error } = await window.supabase.storage.from('challenge-files').upload(filePath, imageFile, { upsert: true });
                if (error) throw error;
                const { data } = window.supabase.storage.from('challenge-files').getPublicUrl(filePath);
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
        <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Челленджи</h1>
                {isAdmin && (
                    <>
                        <Button variant="primary" className="h-11 rounded-xl px-5 text-base font-semibold shadow-sm" onClick={() => setShowCreate(true)}>Создать челлендж</Button>
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
                    </>
                )}
            </div>
            <div className="flex justify-center gap-2 mb-8">
                <Button variant={filter === 'active' ? 'primary' : 'outline'} className="rounded-full px-5" onClick={() => setFilter('active')}>Активные</Button>
                <Button variant={filter === 'finished' ? 'primary' : 'outline'} className="rounded-full px-5" onClick={() => setFilter('finished')}>Завершённые</Button>
                <Button variant={filter === 'all' ? 'primary' : 'outline'} className="rounded-full px-5" onClick={() => setFilter('all')}>Все</Button>
            </div>
            {isLoading ? (
                <div className="text-gray-400 text-center py-12">Загрузка...</div>
            ) : filtered.length === 0 ? (
                <div className="text-gray-400 text-center py-12">Нет челленджей</div>
            ) : (
                <div className="space-y-6">
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
        </div>
    );
};

export default ChallengesPage; 