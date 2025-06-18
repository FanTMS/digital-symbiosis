import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { challengesApi } from '../lib/api/challenges';
import { useChallengeSubmissions, useSubmitWork } from '../hooks/useChallengeSubmissions';
import { useChallengeComments, useAddComment } from '../hooks/useChallengeComments';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/ui/Modal';
import { useChallengeVotes, useHasVoted, useVote } from '../hooks/useChallengeVotes';
import ChallengeCard from '../components/ui/PromoBanner';
import { Avatar } from '../components/ui/Avatar';
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

    // Вынесем хуки для голосов и проверки голосования для всех работ заранее
    const votesMap: Record<string, ReturnType<typeof useChallengeVotes>> = {};
    const hasVotedMap: Record<string, ReturnType<typeof useHasVoted>> = {};
    (submissions || []).forEach((s: any) => {
        votesMap[s.id] = useChallengeVotes(s.id);
        hasVotedMap[s.id] = useHasVoted(s.id, currentUser?.id || 0);
    });

    const approvedSubmissions = (submissions || []).filter((s: any) => s.status === 'approved');
    const winners = challenge.status === 'finished'
        ? [...approvedSubmissions].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 3)
        : [];

    if (loading) return <div className="text-center py-12 text-gray-400">Загрузка...</div>;
    if (!challenge) return <div className="text-center py-12 text-red-500">Челлендж не найден</div>;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">← Назад</Button>
            <div className="relative mb-6">
                {challenge.image_url && (
                    <img src={challenge.image_url} alt={challenge.title} className="w-full h-64 object-cover rounded-2xl shadow mb-6" />
                )}
                <h1 className="text-4xl font-extrabold mb-2 text-gray-900">{challenge.title}</h1>
                <div className="flex items-center gap-2 mb-4">
                    {challenge.brand && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{challenge.brand}</span>}
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">{challenge.prize}</span>
                </div>
                <div className="text-gray-500 mb-2 text-lg">{challenge.description}</div>
                <div className="flex items-center gap-2 mt-2 mb-6">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${Math.max(0, Math.min(100, 100 - (new Date(challenge.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7) * 100))}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 ml-2">До {challenge.ends_at ? challenge.ends_at.slice(0, 10) : '—'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                    <div className="text-sm text-blue-700 font-semibold mb-1">Призы</div>
                    <div className="text-lg font-bold text-blue-900">{challenge.prize}</div>
                    {challenge.prize_type && <div className="text-xs text-blue-500">Тип: {challenge.prize_type === 'money' ? 'Деньги' : challenge.prize_type === 'certificate' ? 'Сертификат' : challenge.prize_type === 'item' ? 'Товар' : 'Баллы'}</div>}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                    <div className="text-sm text-gray-700 font-semibold mb-1">Условия участия</div>
                    <div className="text-gray-900 text-base">{challenge.description}</div>
                    {challenge.participants_limit && <div className="text-xs text-gray-500">Лимит участников: {challenge.participants_limit}</div>}
                    {challenge.brand && <div className="text-xs text-gray-500">Бренд: <span className="font-bold">{challenge.brand}</span></div>}
                </div>
            </div>

            {/* Форма отправки работы */}
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-6 flex flex-col gap-3">
                <label className="font-medium">Ваша работа (файл):</label>
                <input type="file" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar" onChange={e => setFile(e.target.files?.[0] || null)} />
                <div className="text-xs text-gray-400">Можно загрузить изображение или документ (pdf, docx, pptx, xlsx, txt, zip и др.)</div>
                <label className="font-medium">Комментарий:</label>
                <textarea className="rounded border px-2 py-1" value={comment} onChange={e => setComment(e.target.value)} rows={2} />
                {submitError && <div className="text-red-500 text-sm">{submitError}</div>}
                <Button type="submit" variant="primary" isLoading={submitting}>Отправить работу</Button>
            </form>

            {/* Список участников */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-lg">Участники</span>
                    <span className="text-xs text-gray-500">({(submissions || []).filter((s: any) => s.status === 'approved').length})</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {(submissions || []).filter((s: any) => s.status === 'approved').length === 0 ? (
                        <span className="text-gray-400 text-sm">Пока нет участников</span>
                    ) : (
                        (submissions || []).filter((s: any) => s.status === 'approved').map((s: any) => (
                            <div key={s.id} className="flex flex-col items-center min-w-[64px] cursor-pointer" onClick={() => navigate(`/profile/${s.user_id}`)}>
                                <Avatar src={s.user_avatar_url} name={s.user_name} size={48} />
                                <span className="text-xs text-gray-700 mt-1 max-w-[60px] truncate text-center">{s.user_name}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Список работ участников */}
            <h2 className="font-semibold text-lg mb-2">Работы участников</h2>
            {subsLoading ? (
                <div className="text-gray-400 py-6">Загрузка работ...</div>
            ) : (
                <div className="space-y-3">
                    {(submissions || []).filter((s: any) => s.status === 'approved').length === 0 ? (
                        <div className="text-gray-400">Пока нет одобренных работ</div>
                    ) : (
                        (submissions || []).filter((s: any) => s.status === 'approved').map((s: any) => {
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
                                <div key={s.id} className="bg-white rounded-lg shadow p-3 flex gap-4 items-center">
                                    <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                                        {s.file_url && s.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                            ? <img src={s.file_url} alt="Работа участника" className="w-full h-full object-cover" />
                                            : <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-blue-600 underline"><svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#e0e7ef" /><path d="M8 16h8M8 12h8M8 8h8" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" /></svg><span className="text-xs mt-1">Документ</span></a>
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-gray-500 mb-1">{s.comment}</div>
                                        {/* Комментарии */}
                                        <div className="mt-2">
                                            <div className="font-semibold text-sm mb-1">Комментарии:</div>
                                            <div className="space-y-2 mb-2">
                                                {(comments ?? []).length === 0 ? (
                                                    <div className="text-gray-400 text-xs">Комментариев нет</div>
                                                ) : (
                                                    (comments ?? []).map((c: any) => (
                                                        <div key={c.id} className="flex items-start gap-2">
                                                            <Avatar src={c.user_avatar_url} name={c.user_name} size={28} />
                                                            <div className="bg-gray-100 rounded-xl px-3 py-2 flex-1">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="font-semibold text-xs text-gray-800">{c.user_name}</span>
                                                                    <span className="text-[10px] text-gray-400">{c.created_at ? new Date(c.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-700">{c.text}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <form onSubmit={handleAddComment} className="flex gap-2 items-center mt-2">
                                                <Avatar src={currentUser?.avatar_url} name={currentUser?.name} size={28} />
                                                <input
                                                    type="text"
                                                    value={commentText}
                                                    onChange={e => setCommentTextMap(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                    className="border rounded-xl px-3 py-2 text-xs flex-1"
                                                    placeholder="Добавить комментарий..."
                                                    disabled={commentLoading}
                                                />
                                                <Button type="submit" size="sm" variant="primary" disabled={commentLoading}>Отправить</Button>
                                            </form>
                                            {commentError && <div className="text-red-500 text-xs mt-1">{commentError}</div>}
                                        </div>
                                    </div>
                                    <Button size="sm" variant="danger" onClick={() => setShowReport(s.id)}>Пожаловаться</Button>
                                    {showReport === s.id && (
                                        <Modal isOpen onClose={() => setShowReport(null)}>
                                            <div className="p-4">
                                                <h3 className="font-bold mb-2">Пожаловаться на работу</h3>
                                                <textarea className="w-full border rounded p-2 mb-2" rows={3} value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Опишите причину" />
                                                {reportError && <div className="text-red-500 text-xs mb-2">{reportError}</div>}
                                                <div className="flex gap-2">
                                                    <Button variant="outline" onClick={() => setShowReport(null)}>Отмена</Button>
                                                    <Button variant="danger" disabled={reportLoading} onClick={() => handleReport(s.id)}>Отправить</Button>
                                                </div>
                                            </div>
                                        </Modal>
                                    )}
                                    {challenge.status === 'voting' && currentUser?.id && !hasVotedMap[s.id]?.data && (
                                        <Button size="sm" variant="primary" onClick={() => vote.mutate({ submissionId: s.id, userId: currentUser.id })} disabled={vote.status === 'pending'}>Голосовать</Button>
                                    )}
                                    {challenge.status === 'finished' && (
                                        <div className="text-xs text-gray-500 mt-2">Голосов: {votesMap[s.id]?.data ?? 0}</div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {challenge.status === 'finished' && winners && winners.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">🏆 Победители</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {winners.map((w: any, idx: number) => (
                            <div key={w.id} className="bg-white rounded-2xl shadow-xl p-4 flex flex-col items-center text-center border-2 border-amber-300 relative">
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-4xl">
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                </div>
                                <Avatar src={w.user_avatar_url} name={w.user_name} size={64} className="mb-2 mt-4" />
                                <div className="font-bold text-lg mb-1">{w.user_name}</div>
                                <div className="text-xs text-gray-500 mb-2">{w.prize || challenge.prize}</div>
                                {w.file_url && w.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                    ? <img src={w.file_url} alt="Работа победителя" className="w-full h-32 object-cover rounded mb-2" />
                                    : <a href={w.file_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-blue-600 underline"><svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#e0e7ef" /><path d="M8 16h8M8 12h8M8 8h8" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" /></svg><span className="text-xs mt-1">Документ</span></a>
                                }
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChallengeDetailPage; 