import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { challengesApi } from '../lib/api/challenges';
import { useChallengeSubmissions, useSubmitWork } from '../hooks/useChallengeSubmissions';
// TODO: Импортировать хуки для голосов, комментариев, жалоб

const ChallengeDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [comment, setComment] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { data: submissions, isLoading: subsLoading } = useChallengeSubmissions(id || '');
    const submitWork = useSubmitWork();

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        challengesApi.getById(id)
            .then(setChallenge)
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');
        if (!file) {
            setSubmitError('Пожалуйста, выберите файл');
            return;
        }
        setSubmitting(true);
        try {
            // Загрузка файла в Supabase Storage
            const file_url = await challengesApi.uploadSubmissionFile(file, 1, id!); // TODO: заменить 1 на user.id
            await submitWork.mutateAsync({
                challenge_id: id,
                file_url,
                comment,
                user_id: 1, // TODO: заменить на реального пользователя
            });
            setFile(null);
            setComment('');
        } catch (e: any) {
            setSubmitError(e.message || 'Ошибка отправки');
        } finally {
            setSubmitting(false);
        }
    };

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

            {/* Форма отправки работы */}
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-6 flex flex-col gap-3">
                <label className="font-medium">Ваша работа (файл):</label>
                <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
                <label className="font-medium">Комментарий:</label>
                <textarea className="rounded border px-2 py-1" value={comment} onChange={e => setComment(e.target.value)} rows={2} />
                {submitError && <div className="text-red-500 text-sm">{submitError}</div>}
                <Button type="submit" variant="primary" isLoading={submitting}>Отправить работу</Button>
            </form>

            {/* Список работ участников */}
            <h2 className="font-semibold text-lg mb-2">Работы участников</h2>
            {subsLoading ? (
                <div className="text-gray-400 py-6">Загрузка работ...</div>
            ) : (
                <div className="space-y-3">
                    {(submissions || []).filter((s: any) => s.status === 'approved').length === 0 ? (
                        <div className="text-gray-400">Пока нет одобренных работ</div>
                    ) : (
                        (submissions || []).filter((s: any) => s.status === 'approved').map((s: any) => (
                            <div key={s.id} className="bg-white rounded-lg shadow p-3">
                                <div className="font-medium mb-2">
                                    {s.file_url && (s.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                        ? <img src={s.file_url} alt="Работа участника" className="max-h-48 rounded mb-2" />
                                        : <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Скачать файл</a>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 mb-1">{s.comment}</div>
                                {/* TODO: Кнопки голосования, комментарии, жалобы */}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ChallengeDetailPage; 