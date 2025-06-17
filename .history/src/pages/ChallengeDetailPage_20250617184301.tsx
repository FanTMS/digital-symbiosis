import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { challengesApi } from '../lib/api/challenges';
import { useChallengeSubmissions, useSubmitWork } from '../hooks/useChallengeSubmissions';
import { useChallengeComments, useAddComment } from '../hooks/useChallengeComments';
import { useUser } from '../contexts/UserContext';
import Modal from '../components/ui/Modal';
import { useChallengeVotes, useHasVoted, useVote } from '../hooks/useChallengeVotes';
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
                        (submissions || []).filter((s: any) => s.status === 'approved').map((s: any) => {
                            const { data: comments } = useChallengeComments(s.id);
                            const addComment = useAddComment();
                            const [commentText, setCommentText] = useState('');
                            const [commentError, setCommentError] = useState('');
                            const [commentLoading, setCommentLoading] = useState(false);
                            const votes = useChallengeVotes(s.id);
                            const hasVoted = useHasVoted(s.id, currentUser?.id || 0);
                            const vote = useVote();

                            const handleAddComment = async (e: React.FormEvent) => {
                                e.preventDefault();
                                setCommentError('');
                                if (!commentText.trim()) {
                                    setCommentError('Введите комментарий');
                                    return;
                                }
                                setCommentLoading(true);
                                try {
                                    await addComment.mutateAsync({
                                        submission_id: s.id,
                                        user_id: currentUser.id,
                                        text: commentText.trim(),
                                    });
                                    setCommentText('');
                                } catch (e: any) {
                                    setCommentError(e.message || 'Ошибка');
                                } finally {
                                    setCommentLoading(false);
                                }
                            };

                            return (
                                <div key={s.id} className="bg-white rounded-lg shadow p-3">
                                    <div className="font-medium mb-2">
                                        {s.file_url && (s.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                            ? <img src={s.file_url} alt="Работа участника" className="max-h-48 rounded mb-2" />
                                            : <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Скачать файл</a>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-1">{s.comment}</div>
                                    {/* Комментарии */}
                                    <div className="mt-2">
                                        <div className="font-semibold text-sm mb-1">Комментарии:</div>
                                        <div className="space-y-1 mb-2">
                                            {(comments || []).length === 0 ? (
                                                <div className="text-gray-400 text-xs">Комментариев нет</div>
                                            ) : (
                                                comments.map((c: any) => (
                                                    <div key={c.id} className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1">{c.text}</div>
                                                ))
                                            )}
                                        </div>
                                        <form onSubmit={handleAddComment} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={commentText}
                                                onChange={e => setCommentText(e.target.value)}
                                                className="border rounded px-2 py-1 text-xs flex-1"
                                                placeholder="Добавить комментарий..."
                                                disabled={commentLoading}
                                            />
                                            <Button type="submit" size="sm" variant="outline" disabled={commentLoading}>Ок</Button>
                                        </form>
                                        {commentError && <div className="text-red-500 text-xs mt-1">{commentError}</div>}
                                    </div>
                                    <Button size="xs" variant="danger" onClick={() => setShowReport(s.id)}>Пожаловаться</Button>
                                    {showReport === s.id && (
                                        <Modal isOpen onClose={() => setShowReport(null)}>
                                            <div className="p-4">
                                                <h3 className="font-bold mb-2">Пожаловаться на работу</h3>
                                                <textarea className="w-full border rounded p-2 mb-2" rows={3} value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Опишите причину" />
                                                {reportError && <div className="text-red-500 text-xs mb-2">{reportError}</div>}
                                                <div className="flex gap-2">
                                                    <Button variant="outline" onClick={() => setShowReport(null)}>Отмена</Button>
                                                    <Button variant="danger" isLoading={reportLoading} onClick={() => handleReport(s.id)}>Отправить</Button>
                                                </div>
                                            </div>
                                        </Modal>
                                    )}
                                    {challenge.status === 'voting' && currentUser?.id && !hasVoted.data && (
                                        <Button size="sm" variant="primary" onClick={() => vote.mutate({ submissionId: s.id, userId: currentUser.id })} disabled={vote.isLoading}>Голосовать</Button>
                                    )}
                                    {challenge.status === 'finished' && (
                                        <div className="text-xs text-gray-500 mt-2">Голосов: {votes.data ?? 0}</div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default ChallengeDetailPage; 