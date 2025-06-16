import React, { useState } from 'react';
import type { QuizQuestion, QuizAnswers } from '../types/models';
import Button from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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

    if (onCancel) {
        return (
            <AnimatePresence>
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onCancel}
                    />
                    <motion.div
                        className="relative w-full max-w-md mx-auto animate-fade-in"
                        initial={{ scale: 0.95, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 40 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 flex flex-col gap-6 min-h-[350px] sm:min-h-[420px]">
                            <button
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-3xl font-bold transition-transform duration-200 hover:scale-125 hover:rotate-12 z-20"
                                onClick={onCancel}
                                aria-label="Закрыть квиз"
                                type="button"
                            >
                                <X size={32} />
                            </button>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-gray-500">Вопрос {step + 1} из {total}</div>
                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-blue-900 text-center leading-snug">{current.question}</h2>
                            {current.type === 'single' && current.options && (
                                <div className="flex flex-col gap-3 mb-2">
                                    {current.options.map(opt => (
                                        <Button
                                            key={opt}
                                            variant={selected === opt ? 'primary' : 'outline'}
                                            className="w-full text-base py-3 rounded-xl shadow-sm"
                                            onClick={() => handleSelect(opt)}
                                            size="lg"
                                        >
                                            {opt}
                                        </Button>
                                    ))}
                                </div>
                            )}
                            {current.type === 'multiple' && current.options && (
                                <div className="flex flex-col gap-3 mb-2">
                                    {current.options.map(opt => (
                                        <Button
                                            key={opt}
                                            variant={Array.isArray(selected) && selected.includes(opt) ? 'primary' : 'outline'}
                                            className="w-full text-base py-3 rounded-xl shadow-sm"
                                            onClick={() => handleSelect(opt)}
                                            size="lg"
                                        >
                                            {opt}
                                        </Button>
                                    ))}
                                </div>
                            )}
                            {current.type === 'text' && (
                                <div className="mb-2">
                                    <textarea
                                        className="w-full border rounded-xl p-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[100px] resize-none shadow-sm"
                                        placeholder="Ваш ответ..."
                                        value={typeof selected === 'string' ? selected : ''}
                                        onChange={handleInput}
                                        maxLength={400}
                                        autoFocus
                                    />
                                </div>
                            )}
                            {error && <div className="text-red-500 mb-2 text-center text-base font-medium">{error}</div>}
                            <div className="flex flex-col sm:flex-row justify-between gap-2 mt-auto">
                                <Button variant="ghost" onClick={handleBack} className="w-full sm:w-auto py-3 rounded-xl text-base">
                                    {step === 0 ? (onCancel ? 'Отмена' : 'Назад') : 'Назад'}
                                </Button>
                                <Button variant="primary" onClick={handleNext} className="w-full sm:w-auto py-3 rounded-xl text-base">
                                    {step === total - 1 ? 'Завершить' : 'Далее'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <div className="relative w-full max-w-md mx-auto animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 flex flex-col gap-6 min-h-[350px] sm:min-h-[420px]">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Вопрос {step + 1} из {total}</div>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-blue-900 text-center leading-snug">{current.question}</h2>
                {current.type === 'single' && current.options && (
                    <div className="flex flex-col gap-3 mb-2">
                        {current.options.map(opt => (
                            <Button
                                key={opt}
                                variant={selected === opt ? 'primary' : 'outline'}
                                className="w-full text-base py-3 rounded-xl shadow-sm"
                                onClick={() => handleSelect(opt)}
                                size="lg"
                            >
                                {opt}
                            </Button>
                        ))}
                    </div>
                )}
                {current.type === 'multiple' && current.options && (
                    <div className="flex flex-col gap-3 mb-2">
                        {current.options.map(opt => (
                            <Button
                                key={opt}
                                variant={Array.isArray(selected) && selected.includes(opt) ? 'primary' : 'outline'}
                                className="w-full text-base py-3 rounded-xl shadow-sm"
                                onClick={() => handleSelect(opt)}
                                size="lg"
                            >
                                {opt}
                            </Button>
                        ))}
                    </div>
                )}
                {current.type === 'text' && (
                    <div className="mb-2">
                        <textarea
                            className="w-full border rounded-xl p-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[100px] resize-none shadow-sm"
                            placeholder="Ваш ответ..."
                            value={typeof selected === 'string' ? selected : ''}
                            onChange={handleInput}
                            maxLength={400}
                            autoFocus
                        />
                    </div>
                )}
                {error && <div className="text-red-500 mb-2 text-center text-base font-medium">{error}</div>}
                <div className="flex flex-col sm:flex-row justify-between gap-2 mt-auto">
                    <Button variant="ghost" onClick={handleBack} className="w-full sm:w-auto py-3 rounded-xl text-base">
                        {step === 0 ? (onCancel ? 'Отмена' : 'Назад') : 'Назад'}
                    </Button>
                    <Button variant="primary" onClick={handleNext} className="w-full sm:w-auto py-3 rounded-xl text-base">
                        {step === total - 1 ? 'Завершить' : 'Далее'}
                    </Button>
                </div>
            </div>
        </div>
    );
} 