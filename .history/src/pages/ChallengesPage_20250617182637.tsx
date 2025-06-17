import React, { useState } from 'react';
import Button from '../components/ui/Button';

// TODO: Получать данные из Supabase
// const { data: challenges, isLoading } = useChallenges();

const ChallengesPage: React.FC = () => {
    const [filter, setFilter] = useState<'active' | 'finished' | 'all'>('active');
    const isAdmin = false; // TODO: заменить на реальную проверку роли

    // TODO: Фильтрация по статусу после получения данных из БД
    const filtered: any[] = []; // Заглушка, пока нет данных

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
            {/* TODO: Загрузка и отображение реальных данных */}
            {filtered.length === 0 ? (
                <div className="text-gray-400 text-center py-12">Нет челленджей</div>
            ) : (
                <div className="space-y-4">
                    {/* Здесь будет рендер списка челленджей */}
                </div>
            )}
        </div>
    );
};

export default ChallengesPage; 