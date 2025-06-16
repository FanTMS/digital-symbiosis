import React, { useState } from 'react';
import type { QuizQuestion, QuizAnswers } from '../types/models';
import Button from './ui/Button';

interface QuizRunnerProps {
    questions: QuizQuestion[];
    onSubmit: (answers: QuizAnswers) => void;
    onCancel?: () => void;
}

export default function QuizRunner({ questions, onSubmit, onCancel }: QuizRunnerProps) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswers>([]);
    const [selected, setSelected] = useState<string | string[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const current = questions[step];
    const total = questions.length;
    const progress = Math.round(((step + 1) / total) * 100);

    function handleNext() {
        if (current.type === 'text' && (!selected || (typeof selected === 'string' && selected.trim() === ''))) {
            setError('Пожалуйста, введите ответ');
            return;
        }
        if ((current.type === 'single' || current.type === 'multiple') && (!selected || (Array.isArray(selected) && selected.length === 0))) {
            setError('Пожалуйста, выберите вариант');
            return;
        }
        setError(null);
        const newAnswers = [...answers];
        newAnswers[step] = { questionId: current.id, answer: selected! };
        setAnswers(newAnswers);
        setSelected(null);
        if (step < total - 1) {
            setStep(step + 1);
        } else {
            onSubmit(newAnswers);
        }
    }

    function handleSelect(option: string) {
        if (current.type === 'single') {
            setSelected(option);
        } else if (current.type === 'multiple') {
            setSelected(prev => {
                const arr = Array.isArray(prev) ? prev : [];
                return arr.includes(option) ? arr.filter(o => o !== option) : [...arr, option];
            });
        }
    }

    function handleInput(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setSelected(e.target.value);
    }

    function handleBack() {
        if (step > 0) {
            setStep(step - 1);
            setSelected(answers[step - 1]?.answer || null);
            setError(null);
        } else if (onCancel) {
            onCancel();
        }
    }

    React.useEffect(() => {
        setSelected(answers[step]?.answer || null);
        setError(null);
        // eslint-disable-next-line
    }, [step]);

    return (
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6 mt-4 animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">Вопрос {step + 1} из {total}</div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
            </div>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">{current.question}</h2>
            {current.type === 'single' && current.options && (
                <div className="space-y-2 mb-4">
                    {current.options.map(opt => (
                        <Button
                            key={opt}
                            variant={selected === opt ? 'primary' : 'outline'}
                            className="w-full text-left"
                            onClick={() => handleSelect(opt)}
                        >
                            {opt}
                        </Button>
                    ))}
                </div>
            )}
            {current.type === 'multiple' && current.options && (
                <div className="space-y-2 mb-4">
                    {current.options.map(opt => (
                        <Button
                            key={opt}
                            variant={Array.isArray(selected) && selected.includes(opt) ? 'primary' : 'outline'}
                            className="w-full text-left"
                            onClick={() => handleSelect(opt)}
                        >
                            {opt}
                        </Button>
                    ))}
                </div>
            )}
            {current.type === 'text' && (
                <div className="mb-4">
                    <textarea
                        className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[80px]"
                        placeholder="Ваш ответ..."
                        value={typeof selected === 'string' ? selected : ''}
                        onChange={handleInput}
                        maxLength={400}
                    />
                </div>
            )}
            {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
            <div className="flex justify-between mt-4 gap-2">
                <Button variant="ghost" onClick={handleBack}>
                    {step === 0 ? (onCancel ? 'Отмена' : 'Назад') : 'Назад'}
                </Button>
                <Button variant="primary" onClick={handleNext}>
                    {step === total - 1 ? 'Завершить' : 'Далее'}
                </Button>
            </div>
        </div>
    );
} 