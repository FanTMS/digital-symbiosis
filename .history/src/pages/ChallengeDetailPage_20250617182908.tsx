import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { challengesApi } from '../lib/api/challenges';
// TODO: Импортировать хуки для работ, голосов, комментариев, жалоб

const ChallengeDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        challengesApi.getById(id)
            .then(setChallenge)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="text-center py-12 text-gray-400">Загрузка...</div>;
    if (!challenge) return <div className="text-center py-12 text-red-500">Челлендж не найден</div>;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">← Назад</Button>
            <h1 className="text-2xl font-bold mb-2">{challenge.title}</h1>
            <div className="text-gray-500 mb-2">{challenge.description}</div>
            <div className="text-xs text-gray-400 mb-2">Приз: {challenge.prize}</div>
            <div className="text-xs text-gray-400 mb-2">Статус: {challenge.status}</div>
            <div className="text-xs text-gray-400 mb-6">До {challenge.ends_at?.slice(0, 10)}</div>
            {/* TODO: Кнопка "Участвовать" (если не участвовал), форма отправки работы */}
            {/* TODO: Список работ участников (только одобренные), кнопка голосования */}
            {/* TODO: Модерация работ (для админа/модератора) */}
            {/* TODO: Комментарии к работам */}
            {/* TODO: Жалобы на работы */}
            {/* TODO: Голосование (анонимное) */}
        </div>
    );
};

export default ChallengeDetailPage; 