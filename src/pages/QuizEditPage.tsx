import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuizEditor from '../components/QuizEditor';
import { supabase } from '../lib/supabase';
import type { Quiz, QuizQuestion } from '../types/models';

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
        <QuizEditor quiz={quiz} questions={questions} onSave={() => navigate('/quizzes')} />
    );
};

export default QuizEditPage; 