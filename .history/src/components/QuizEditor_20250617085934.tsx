import React, { useEffect, useState } from 'react';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';
import type { Quiz, QuizQuestion } from '../types/models';

const emptyQuestion = (): Partial<QuizQuestion> => ({
    question: '',
    type: 'single',
    options: [''],
});

interface QuizEditorProps {
    quiz?: Quiz;
    questions?: QuizQuestion[];
    onSave?: () => void;
}

export default function QuizEditor({ quiz, questions: initialQuestions, onSave }: QuizEditorProps) {
    const [title, setTitle] = useState(quiz?.title || '');
    const [description, setDescription] = useState(quiz?.description || '');
    const [questions, setQuestions] = useState<Partial<QuizQuestion>[]>(initialQuestions || [emptyQuestion()]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Добавить вопрос
    const addQuestion = () => setQuestions(qs => [...qs, emptyQuestion()]);

    // Удалить вопрос
    const removeQuestion = (idx: number) => setQuestions(qs => qs.length > 1 ? qs.filter((_, i) => i !== idx) : qs);

    // Изменить вопрос
    const updateQuestion = (idx: number, patch: Partial<QuizQuestion>) => setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, ...patch } : q));

    // Добавить/удалить вариант ответа
    const updateOption = (qIdx: number, oIdx: number, value: string) => {
        setQuestions(qs => qs.map((q, i) => i === qIdx ? {
            ...q,
            options: (q.options || []).map((opt, j) => j === oIdx ? value : opt)
        } : q));
    };
    const addOption = (qIdx: number) => {
        setQuestions(qs => qs.map((q, i) => i === qIdx ? {
            ...q,
            options: [...(q.options || []), '']
        } : q));
    };
    const removeOption = (qIdx: number, oIdx: number) => {
        setQuestions(qs => qs.map((q, i) => i === qIdx ? {
            ...q,
            options: (q.options || []).filter((_, j) => j !== oIdx)
        } : q));
    };

    // Сохранить квиз и вопросы
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            let quizId = quiz?.id;
            if (!quizId) {
                // Создать квиз
                const { data, error } = await supabase.from('quizzes').insert({ title, description }).select().single();
                if (error) throw error;
                quizId = data.id;
            } else {
                // Обновить квиз
                await supabase.from('quizzes').update({ title, description }).eq('id', quizId);
                // Удалить старые вопросы (для простоты)
                await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
            }
            // Сохранить вопросы
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                await supabase.from('quiz_questions').insert({
                    quiz_id: quizId,
                    question: q.question,
                    type: q.type,
                    options: q.type !== 'text' ? q.options : null,
                    order: i,
                });
            }
            if (onSave) onSave();
            alert('Квиз сохранён!');
        } catch (e: any) {
            setError(e.message || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form
            className="max-w-xl w-full mx-auto p-2 sm:p-6 bg-white rounded-xl shadow min-h-[80vh] flex flex-col relative"
            style={{ paddingBottom: '110px', minHeight: '80vh' }}
            onSubmit={e => { e.preventDefault(); handleSave(); }}
        >
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-blue-900 text-center">{quiz ? 'Редактировать квиз' : 'Создать квиз'}</h2>
            <div className="mb-4">
                <label className="block font-medium mb-1">Название квиза</label>
                <input
                    className="w-full border rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-400"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={80}
                />
            </div>
            <div className="mb-6">
                <label className="block font-medium mb-1">Описание</label>
                <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[60px] text-base focus:ring-2 focus:ring-primary-400"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    maxLength={200}
                />
            </div>
            <h3 className="font-semibold mb-2 text-blue-800">Вопросы</h3>
            <div className="flex flex-col gap-6 mb-6">
                {questions.map((q, idx) => (
                    <div key={idx} className="bg-blue-50 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-blue-900">Вопрос {idx + 1}</span>
                            <Button size="xs" variant="ghost" onClick={e => { e.preventDefault(); removeQuestion(idx); }} disabled={questions.length === 1}>Удалить</Button>
                        </div>
                        <input
                            className="w-full border rounded-lg px-2 py-1 text-base focus:ring-2 focus:ring-primary-400"
                            placeholder="Текст вопроса"
                            value={q.question}
                            onChange={e => updateQuestion(idx, { question: e.target.value })}
                            maxLength={200}
                        />
                        <div className="mb-2">
                            <label className="block text-sm mb-1">Тип вопроса</label>
                            <select
                                className="border rounded-lg px-2 py-1 text-base focus:ring-2 focus:ring-primary-400"
                                value={q.type}
                                onChange={e => updateQuestion(idx, { type: e.target.value as any, options: e.target.value === 'text' ? null : [''] })}
                            >
                                <option value="single">Один вариант</option>
                                <option value="multiple">Несколько вариантов</option>
                                <option value="text">Свободный ответ</option>
                            </select>
                        </div>
                        {(q.type === 'single' || q.type === 'multiple') && (
                            <div>
                                <label className="block text-sm mb-1">Варианты ответа</label>
                                <div className="flex flex-col gap-2">
                                    {(q.options || []).map((opt, oIdx) => (
                                        <div key={oIdx} className="flex gap-2 mb-1">
                                            <input
                                                className="flex-1 border rounded-lg px-2 py-1 text-base focus:ring-2 focus:ring-primary-400"
                                                placeholder={`Вариант ${oIdx + 1}`}
                                                value={opt}
                                                onChange={e => updateOption(idx, oIdx, e.target.value)}
                                                maxLength={100}
                                            />
                                            <Button size="xs" variant="ghost" onClick={e => { e.preventDefault(); removeOption(idx, oIdx); }} disabled={(q.options?.length || 0) <= 1}>-</Button>
                                        </div>
                                    ))}
                                    <Button size="xs" variant="outline" onClick={e => { e.preventDefault(); addOption(idx); }} className="w-full sm:w-auto">Добавить вариант</Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <Button variant="outline" className="w-full py-2 rounded-xl mb-24" onClick={e => { e.preventDefault(); addQuestion(); }}>Добавить вопрос</Button>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {/* Фиксированная современная кнопка сохранения */}
            <div className="fixed left-0 right-0 bottom-0 z-40 px-2 pb-3 animate-fade-in">
                <Button type="submit" variant="primary" loading={saving} disabled={saving} fullWidth className="py-4 text-base rounded-2xl shadow-xl font-bold">
                    {quiz ? 'Сохранить изменения' : 'Создать квиз'}
                </Button>
            </div>
        </form>
    );
} 