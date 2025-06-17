import React, { useState } from 'react';
import Button from '../components/ui/Button';
import { useChallenges } from '../hooks/useChallenges';
import { useNavigate } from 'react-router-dom';

// TODO: Получать данные из Supabase
// const { data: challenges, isLoading } = useChallenges();

const ChallengesPage: React.FC = () => {
    const [filter, setFilter] = useState<'active' | 'finished' | 'all'>('active');
    const isAdmin = false; // TODO: заменить на реальную проверку роли
    const { data: challenges, isLoading } = useChallenges();
    const navigate = useNavigate();

    const filtered = (challenges || []).filter((c: any) =>
        filter === 'all' ? true : c.status === filter
    );

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Челленджи</h1>
                {isAdmin && (
                    <Button variant="primary">Создать челлендж</Button>
                )}
            </div>
            <div className="flex gap-2 mb-6">
                <Button variant={filter === 'active' ? 'primary' : 'outline'} onClick={() => setFilter('active')}>Активные</Button>
                <Button variant={filter === 'finished' ? 'primary' : 'outline'} onClick={() => setFilter('finished')}>Завершённые</Button>
                <Button variant={filter === 'all' ? 'primary' : 'outline'} onClick={() => setFilter('all')}>Все</Button>
            </div>
            {isLoading ? (
                <div className="text-gray-400 text-center py-12">Загрузка...</div>
            ) : filtered.length === 0 ? (
                <div className="text-gray-400 text-center py-12">Нет челленджей</div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((ch: any) => (
                        <div key={ch.id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                                <div className="font-semibold text-lg mb-1">{ch.title}</div>
                                <div className="text-gray-500 text-sm mb-1">{ch.description}</div>
                                <div className="text-xs text-gray-400 mb-1">Приз: {ch.prize}</div>
                                <div className="text-xs text-gray-400">Статус: {ch.status}</div>
                            </div>
                            <div className="flex flex-col gap-2 md:items-end">
                                <div className="text-xs text-gray-500">{ch.status === 'active' ? `До ${ch.ends_at?.slice(0, 10)}` : `Завершён: ${ch.ends_at?.slice(0, 10)}`}</div>
                                <Button variant="outline" onClick={() => navigate(`/challenges/${ch.id}`)}>Подробнее</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChallengesPage; 