import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { challengesApi } from '../lib/api/challenges';
import { useChallengeSubmissions, useSubmitWork } from '../hooks/useChallengeSubmissions';
import { useChallengeComments, useAddComment } from '../hooks/useChallengeComments';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/ui/Modal';
import { useChallengeVotes, useHasVoted, useVote } from '../hooks/useChallengeVotes';
import { Avatar } from '../components/ui/Avatar';

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
    const { user: currentUser } = useUser();
    const [showReport, setShowReport] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [reportError, setReportError] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [commentTextMap, setCommentTextMap] = useState<{ [id: string]: string }>({});
    const [commentErrorMap, setCommentErrorMap] = useState<{ [id: string]: string }>({});
    const [commentLoadingMap, setCommentLoadingMap] = useState<{ [id: string]: boolean }>({});
    const vote = useVote();

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
        if (!currentUser?.id) {
            setSubmitError('Необходима авторизация');
            return;
        }
        setSubmitting(true);
        try {
            const file_url = await challengesApi.uploadSubmissionFile(file, currentUser.id, id!);
            await submitWork.mutateAsync({
                challenge_id: id,
                file_url,
                comment,
                user_id: currentUser.id,
            });
            setFile(null);
            setComment('');
        } catch (e: any) {
            setSubmitError(e.message || 'Ошибка отправки');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReport = async (submissionId: string) => {
        setReportError('');
        if (!reportReason.trim()) {
            setReportError('Укажите причину');
            return;
        }
        if (!currentUser?.id) {
            setReportError('Необходима авторизация');
            return;
        }
        setReportLoading(true);
        try {
            await challengesApi.reportSubmission({
                submission_id: submissionId,
                user_id: currentUser.id,
                reason: reportReason.trim(),
            });
            setShowReport(null);
            setReportReason('');
        } catch (e: any) {
            setReportError(e.message || 'Ошибка');
        } finally {
            setReportLoading(false);
        }
    };

    const votesMap: Record<string, ReturnType<typeof useChallengeVotes>> = {};
    const hasVotedMap: Record<string, ReturnType<typeof useHasVoted>> = {};
    (submissions || []).forEach((s: any) => {
        votesMap[s.id] = useChallengeVotes(s.id);
        hasVotedMap[s.id] = useHasVoted(s.id, currentUser?.id || 0);
    });

    const approvedSubmissions = (submissions || []).filter((s: any) => s.status === 'approved');
    const winners = challenge && challenge.status === 'finished'
        ? [...approvedSubmissions].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 3)
        : [];

    const timeRemaining = challenge ? (() => {
        const end = new Date(challenge.ends_at).getTime();
        const now = Date.now();
        const diff = end - now;
        if (diff <= 0) return { text: 'Завершен', expired: true };
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return { text: `${days} дней ${hours} часов`, expired: false };
        if (hours > 0) return { text: `${hours} часов`, expired: false };
        return { text: 'Скоро завершится', expired: false };
    })() : { text: '', expired: false };

    const progress = challenge ? (() => {
        const end = new Date(challenge.ends_at).getTime();
        const now = Date.now();
        const start = challenge.created_at ? new Date(challenge.created_at).getTime() : now - 1000 * 60 * 60 * 24 * 7;
        const total = end - start;
        const left = end - now;
        if (total <= 0) return 100;
        return Math.max(0, Math.min(100, 100 - (left / total) * 100));
    })() : 0;

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xl text-gray-600">Загрузка челленджа...</p>
            </div>
        </div>
    );

    if (!challenge) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">😕</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Челлендж не найден</h2>
                <p className="text-gray-600 mb-6">Возможно, он был удалён или вы перешли по неверной ссылке</p>
                <Button variant="primary" onClick={() => navigate('/challenges')}>К списку челленджей</Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-20">
            <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
                {/* Кнопка назад */}
                <Button variant="outline" onClick={() => navigate(-1)} className="mb-6 bg-white/80 backdrop-blur-sm">
                    ← Назад
                </Button>

                {/* Хедер челленджа */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
                    {challenge.image_url && (
                        <div className="relative h-48 md:h-64 lg:h-80">
                            <img src={challenge.image_url} alt={challenge.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                    )}
                    <div className="p-6 md:p-8">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            {challenge.brand && (
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                    {challenge.brand}
                                </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${timeRemaining.expired
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-orange-100 text-orange-700'
                                }`}>
                                {timeRemaining.text}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                            {challenge.title}
                        </h1>
                        <p className="text-gray-600 text-lg mb-6">
                            {challenge.description}
                        </p>

                        {/* Прогресс-бар */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Прогресс челленджа</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-700 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Инфо блоки */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-amber-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl">
                                🏆
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Призы</h3>
                        </div>
                        <p className="text-2xl font-black text-gray-900 mb-2">{challenge.prize}</p>
                        <p className="text-sm text-gray-600">
                            Тип: {challenge.prize_type === 'money' ? '💰 Деньги' :
                                challenge.prize_type === 'certificate' ? '🎫 Сертификат' :
                                    challenge.prize_type === 'item' ? '🎁 Товар' : '⭐ Баллы'}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                                📋
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Условия</h3>
                        </div>
                        <p className="text-gray-700 mb-2">{challenge.description}</p>
                        {challenge.participants_limit && (
                            <p className="text-sm text-gray-600">
                                Лимит участников: {challenge.participants_limit}
                            </p>
                        )}
                    </div>
                </div>

                {/* Форма отправки работы */}
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Отправить работу</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Файл работы *
                            </label>
                            <input
                                type="file"
                                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Поддерживаются изображения и документы (pdf, docx, pptx, xlsx, txt, zip)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Комментарий
                            </label>
                            <textarea
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                rows={3}
                                placeholder="Опишите вашу работу..."
                            />
                        </div>

                        {submitError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-700 text-sm">{submitError}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={submitting}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3 text-lg font-semibold"
                        >
                            Отправить работу
                        </Button>
                    </form>
                </div>

                {/* Участники */}
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Участники
                        </h2>
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {approvedSubmissions.length} человек
                        </span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {approvedSubmissions.length === 0 ? (
                            <p className="text-gray-500">Пока нет участников</p>
                        ) : (
                            approvedSubmissions.map((s: any) => (
                                <div
                                    key={s.id}
                                    className="flex flex-col items-center min-w-[80px] cursor-pointer group"
                                    onClick={() => navigate(`/profile/${s.user_id}`)}
                                >
                                    <div className="relative">
                                        <Avatar src={s.user_avatar_url} name={s.user_name} size={56} />
                                        <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                    <span className="text-sm text-gray-700 mt-2 max-w-[70px] truncate text-center">
                                        {s.user_name}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Работы участников */}
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Работы участников</h2>
                    {subsLoading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Загрузка работ...</p>
                        </div>
                    ) : approvedSubmissions.length === 0 ? (
                        <p className="text-gray-500 text-center py-12">Пока нет одобренных работ</p>
                    ) : (
                        <div className="space-y-6">
                            {approvedSubmissions.map((s: any) => {
                                const { data: comments } = useChallengeComments(s.id);
                                const addComment = useAddComment();
                                const commentText = commentTextMap[s.id] || '';
                                const commentError = commentErrorMap[s.id] || '';
                                const commentLoading = commentLoadingMap[s.id] || false;

                                const handleAddComment = async (e: React.FormEvent) => {
                                    e.preventDefault();
                                    setCommentErrorMap(prev => ({ ...prev, [s.id]: '' }));
                                    if (!commentText.trim()) {
                                        setCommentErrorMap(prev => ({ ...prev, [s.id]: 'Введите комментарий' }));
                                        return;
                                    }
                                    if (!currentUser?.id) {
                                        setCommentErrorMap(prev => ({ ...prev, [s.id]: 'Необходима авторизация' }));
                                        return;
                                    }
                                    setCommentLoadingMap(prev => ({ ...prev, [s.id]: true }));
                                    try {
                                        await addComment.mutateAsync({
                                            submission_id: s.id,
                                            user_id: currentUser.id,
                                            text: commentText.trim(),
                                        });
                                        setCommentTextMap(prev => ({ ...prev, [s.id]: '' }));
                                    } catch (e: any) {
                                        setCommentErrorMap(prev => ({ ...prev, [s.id]: e.message || 'Ошибка' }));
                                    } finally {
                                        setCommentLoadingMap(prev => ({ ...prev, [s.id]: false }));
                                    }
                                };

                                return (
                                    <div key={s.id} className="bg-gray-50 rounded-2xl p-4 md:p-6">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            {/* Превью работы */}
                                            <div className="w-full md:w-32 h-32 flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-sm">
                                                {s.file_url && s.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                    <img src={s.file_url} alt="Работа" className="w-full h-full object-cover" />
                                                ) : (
                                                    <a
                                                        href={s.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full h-full flex flex-col items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                                                            <rect width="24" height="24" rx="6" fill="#e0e7ef" />
                                                            <path d="M8 16h8M8 12h8M8 8h8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                                                        </svg>
                                                        <span className="text-sm mt-2">Документ</span>
                                                    </a>
                                                )}
                                            </div>

                                            {/* Контент работы */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={s.user_avatar_url} name={s.user_name} size={40} />
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{s.user_name}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {new Date(s.created_at).toLocaleDateString('ru-RU')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setShowReport(s.id)}
                                                        className="text-red-600 hover:bg-red-50"
                                                    >
                                                        Пожаловаться
                                                    </Button>
                                                </div>

                                                {s.comment && (
                                                    <p className="text-gray-700 mb-4">{s.comment}</p>
                                                )}

                                                {/* Голосование */}
                                                <div className="flex items-center gap-4 mb-4">
                                                    {challenge && challenge.status === 'voting' && currentUser?.id && !hasVotedMap[s.id]?.data && (
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => vote.mutate({ submissionId: s.id, userId: currentUser.id })}
                                                            disabled={vote.status === 'pending'}
                                                        >
                                                            👍 Голосовать
                                                        </Button>
                                                    )}
                                                    {challenge && challenge.status === 'finished' && (
                                                        <span className="text-sm text-gray-600">
                                                            Голосов: {votesMap[s.id]?.data ?? 0}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Комментарии */}
                                                <div className="bg-white rounded-xl p-4">
                                                    <h4 className="font-semibold text-gray-900 mb-3">Комментарии</h4>
                                                    <div className="space-y-3 mb-4">
                                                        {(comments ?? []).length === 0 ? (
                                                            <p className="text-gray-500 text-sm">Комментариев пока нет</p>
                                                        ) : (
                                                            (comments ?? []).map((c: any) => (
                                                                <div key={c.id} className="flex items-start gap-3">
                                                                    <Avatar src={c.user_avatar_url} name={c.user_name} size={32} />
                                                                    <div className="flex-1 bg-gray-100 rounded-xl px-4 py-2">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-semibold text-sm text-gray-900">{c.user_name}</span>
                                                                            <span className="text-xs text-gray-500">
                                                                                {c.created_at ? new Date(c.created_at).toLocaleString('ru-RU', {
                                                                                    day: '2-digit',
                                                                                    month: '2-digit',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                }) : ''}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm text-gray-700">{c.text}</p>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    <form onSubmit={handleAddComment} className="flex gap-2">
                                                        <Avatar src={currentUser?.avatar_url} name={currentUser?.name} size={32} />
                                                        <input
                                                            type="text"
                                                            value={commentText}
                                                            onChange={e => setCommentTextMap(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                            placeholder="Добавить комментарий..."
                                                            disabled={commentLoading}
                                                        />
                                                        <Button type="submit" size="sm" variant="primary" disabled={commentLoading}>
                                                            Отправить
                                                        </Button>
                                                    </form>
                                                    {commentError && (
                                                        <p className="text-red-600 text-sm mt-2">{commentError}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Модалка жалобы */}
                                        {showReport === s.id && (
                                            <Modal isOpen onClose={() => setShowReport(null)}>
                                                <div className="p-6 max-w-md w-full">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                                                        Пожаловаться на работу
                                                    </h3>
                                                    <textarea
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                        rows={4}
                                                        value={reportReason}
                                                        onChange={e => setReportReason(e.target.value)}
                                                        placeholder="Опишите причину жалобы..."
                                                    />
                                                    {reportError && (
                                                        <p className="text-red-600 text-sm mt-2">{reportError}</p>
                                                    )}
                                                    <div className="flex gap-3 mt-4">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setShowReport(null)}
                                                            className="flex-1"
                                                        >
                                                            Отмена
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            disabled={reportLoading}
                                                            onClick={() => handleReport(s.id)}
                                                            className="flex-1"
                                                        >
                                                            Отправить
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Modal>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Победители */}
                {challenge && challenge.status === 'finished' && winners && winners.length > 0 && (
                    <div className="mt-8 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl shadow-xl p-6 md:p-8">
                        <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">
                            🏆 Победители
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {winners.map((w: any, idx: number) => (
                                <div key={w.id} className="bg-white rounded-2xl shadow-xl p-6 text-center relative">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl">
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                    </div>
                                    <div className="mt-6 mb-4">
                                        <Avatar src={w.user_avatar_url} name={w.user_name} size={80} />
                                    </div>
                                    <h3 className="font-bold text-xl text-gray-900 mb-2">{w.user_name}</h3>
                                    <p className="text-gray-600 mb-4">{w.prize || challenge.prize}</p>
                                    {w.file_url && w.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                                        <img src={w.file_url} alt="Работа победителя" className="w-full h-40 object-cover rounded-xl" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChallengeDetailPage; 