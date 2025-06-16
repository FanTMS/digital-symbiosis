import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuizEditor from '../components/QuizEditor';
import { supabase } from '../lib/supabase';
import type { Quiz, QuizQuestion } from '../types/models';
import { ChevronLeft } from 'lucide-react';

const QuizEditPage: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!quizId) return;
        setLoading(true);
        Promise.all([
            supabase.from('quizzes').select('*').eq('id', quizId).single(),
            supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('order', { ascending: true })
        ]).then(([quizRes, questionsRes]) => {
            setQuiz(quizRes.data || null);
            setQuestions(questionsRes.data || []);
        }).finally(() => setLoading(false));
    }, [quizId]);

    if (loading) return <div className="p-4">Загрузка...</div>;
    if (!quiz) return <div className="p-4 text-red-500">Квиз не найден</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white flex flex-col items-center py-4 px-2 sm:px-0">
            <div className="w-full max-w-xl">
                <button onClick={() => navigate('/quizzes')} className="mb-4 flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium">
                    <ChevronLeft size={22} /> <span>К списку квизов</span>
                </button>
                <QuizEditor quiz={quiz} questions={questions} onSave={() => navigate('/quizzes')} />
            </div>
        </div>
    );
};

export default QuizEditPage; 