import { supabase } from './supabase';
import type { Quiz, QuizQuestion } from '../types/models';

export async function getQuizById(quizId: string) {
    const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();
    if (error) throw error;
    return data as Quiz;
}

export async function getQuizQuestions(quizId: string) {
    const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order', { ascending: true });
    if (error) throw error;
    return data as QuizQuestion[];
} 