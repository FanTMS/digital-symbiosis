import React, { useState } from 'react';
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

    const filtered = (challenges || []).filter((c: any) =>
        filter === 'all' ? true : c.status === filter
    );

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        if (!title.trim() || !endsAt) {
            setCreateError('Заполните все поля');
            return;
        }
        setCreating(true);
        try {
            await challengesApi.create({
                title: title.trim(),
                description: description.trim(),
                prize: prize.trim(),
                ends_at: endsAt,
                status: 'active',
            });
            setShowCreate(false);
            setTitle(''); setDescription(''); setPrize(''); setEndsAt('');
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
                                <input className="border rounded px-2 py-1" placeholder="Приз" value={prize} onChange={e => setPrize(e.target.value)} />
                                <input className="border rounded px-2 py-1" type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
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