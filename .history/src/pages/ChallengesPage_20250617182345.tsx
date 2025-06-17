import React, { useState } from 'react';
import Button from '../components/ui/Button';

// Временные данные для примера
const mockChallenges = [
    {
        id: 1,
        title: 'Лучший логотип для стартапа',
        description: 'Создайте уникальный логотип для нового IT-проекта!',
        prize: '500 кредитов',
        status: 'active',
        endsAt: '2024-07-31',
        participants: 12,
    },
    {
        id: 2,
        title: 'Дизайн баннера для бренда',
        description: 'Сделайте креативный баннер для рекламной кампании.',
        prize: 'Подписка Pro',
        status: 'finished',
        endsAt: '2024-06-20',
        participants: 24,
    },
];

const ChallengesPage: React.FC = () => {
    const [filter, setFilter] = useState<'active' | 'finished' | 'all'>('active');
    const isAdmin = false; // TODO: заменить на реальную проверку роли

    const filtered = mockChallenges.filter(c =>
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
            {filtered.length === 0 ? (
                <div className="text-gray-400 text-center py-12">Нет челленджей</div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(ch => (
                        <div key={ch.id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                                <div className="font-semibold text-lg mb-1">{ch.title}</div>
                                <div className="text-gray-500 text-sm mb-1">{ch.description}</div>
                                <div className="text-xs text-gray-400 mb-1">Приз: {ch.prize}</div>
                                <div className="text-xs text-gray-400">Участников: {ch.participants}</div>
                            </div>
                            <div className="flex flex-col gap-2 md:items-end">
                                <div className="text-xs text-gray-500">{ch.status === 'active' ? `До ${ch.endsAt}` : `Завершён: ${ch.endsAt}`}</div>
                                <Button variant="outline">Подробнее</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChallengesPage; 