import React, { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import type { Quiz } from '../types/models';

const QuizzesPage: React.FC = () => {
    const { user } = useUser();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
                                {/* <Button size="sm" variant="danger" onClick={() => handleDelete(quiz.id)}>Удалить</Button> */}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuizzesPage; 