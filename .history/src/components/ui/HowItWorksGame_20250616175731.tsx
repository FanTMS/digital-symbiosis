import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Search, ShoppingBag, Gift, Plus, PartyPopper } from "lucide-react";

const steps = [
    {
        icon: <User size={40} className="text-blue-400" />,
        title: "Зарегистрируйтесь",
        desc: "Создайте аккаунт, чтобы пользоваться всеми возможностями платформы.",
        button: "Зарегистрироваться",
    },
    {
        icon: <Search size={40} className="text-cyan-500" />,
        title: "Найдите услугу",
        desc: "Воспользуйтесь поиском или каталогом, чтобы найти нужного специалиста.",
        button: "Найти услугу",
    },
    {
        icon: <ShoppingBag size={40} className="text-pink-500" />,
        title: "Оформите заказ",
        desc: "Опишите задачу, выберите исполнителя и оплатите заказ.",
        button: "Оформить заказ",
    },
    {
        icon: <Gift size={40} className="text-green-500" />,
        title: "Получите результат",
        desc: "Получите выполненную работу и оставьте отзыв исполнителю.",
        button: "Получить результат",
    },
    {
        icon: <Plus size={40} className="text-purple-500" />,
        title: "Предлагайте свои услуги",
        desc: "Добавьте свои услуги и начните зарабатывать на своих навыках!",
        button: "Предложить услугу",
    },
];

const HowItWorksGame: React.FC = () => {
    const [step, setStep] = useState(0);
    const isLast = step === steps.length;

    return (
        <div className="relative bg-white rounded-2xl shadow-card p-6 overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                    <span role="img" aria-label="game">🎮</span> Как это работает?
                </h2>
                <div className="flex items-center gap-1">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 w-6 rounded-full transition-all duration-300 ${step > i ? "bg-green-400" : step === i ? "bg-blue-400" : "bg-gray-200"}`}
                        />
                    ))}
                </div>
            </div>
            <AnimatePresence mode="wait">
                {isLast ? (
                    <motion.div
                        key="final"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center justify-center min-h-[220px]"
                    >
                        <PartyPopper size={60} className="text-pink-400 mb-4 animate-bounce" />
                        <h3 className="text-2xl font-bold text-center mb-2 text-blue-900">Поздравляем!</h3>
                        <p className="text-center text-gray-600 mb-4">Теперь вы знаете, как пользоваться платформой.<br />Пора начать!</p>
                        <button
                            className="mt-2 px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-bold shadow hover:from-cyan-500 hover:to-blue-600 transition text-base"
                            onClick={() => setStep(0)}
                        >
                            Пройти ещё раз
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center justify-center min-h-[220px]"
                    >
                        <div className="mb-4">{steps[step].icon}</div>
                        <h3 className="text-xl font-bold mb-2 text-blue-900 text-center">{steps[step].title}</h3>
                        <p className="text-gray-600 text-center mb-4">{steps[step].desc}</p>
                        <button
                            className="mt-2 px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-bold shadow hover:from-cyan-500 hover:to-blue-600 transition text-base"
                            onClick={() => setStep((s) => s + 1)}
                        >
                            {steps[step].button} <span className="ml-2">→</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HowItWorksGame; 