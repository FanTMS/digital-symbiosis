import React, { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import type { Quiz } from '../types/models';
import Modal from '../components/ui/Modal';

const QuizzesPage: React.FC = () => {
    const { user } = useUser();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        setLoading(true);
        supabase
            .from('quizzes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => setQuizzes(data || []))
            .finally(() => setLoading(false));
    }, [user?.id]);

    const handleDelete = async () => {
        if (!quizToDelete) return;
        setDeleting(true);
        // Удаляем связанные вопросы
        await supabase.from('quiz_questions').delete().eq('quiz_id', quizToDelete);
        // Удаляем сам квиз
        await supabase.from('quizzes').delete().eq('id', quizToDelete);
        setQuizzes(qs => qs.filter(q => q.id !== quizToDelete));
        setDeleting(false);
        setQuizToDelete(null);
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Мои квизы</h1>
            <Button variant="primary" className="mb-6" onClick={() => navigate('/quizzes/new')}>Создать квиз</Button>
            {loading ? (
                <div>Загрузка...</div>
            ) : quizzes.length === 0 ? (
                <div className="text-gray-500">У вас пока нет квизов.</div>
            ) : (
                <div className="space-y-4">
                    {quizzes.map(quiz => (
                        <div key={quiz.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-lg text-blue-900">{quiz.title}</div>
                                <div className="text-gray-500 text-sm">{quiz.description}</div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}>Редактировать</Button>
                                <Button size="sm" variant="danger" onClick={() => setQuizToDelete(quiz.id)}>Удалить</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Modal isOpen={!!quizToDelete} onClose={() => setQuizToDelete(null)}>
                <div className="p-2">
                    <h2 className="text-lg font-bold mb-2">Удалить квиз?</h2>
                    <p className="mb-4 text-gray-600">Это действие необратимо. Все вопросы квиза также будут удалены.</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setQuizToDelete(null)} disabled={deleting}>Отмена</Button>
                        <Button variant="danger" onClick={handleDelete} loading={deleting} disabled={deleting}>Удалить</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default QuizzesPage; 