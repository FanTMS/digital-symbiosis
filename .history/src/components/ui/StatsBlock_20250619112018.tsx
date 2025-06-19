import React from 'react';
import { Users, CheckCircle, Layers, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
    users: number;
    completedOrders: number;
    categories: number;
    avgRating: number;
}

interface Props {
    stats: Stats;
    loading?: boolean;
}

const tiles = [
    {
        key: 'users',
        label: 'Активных пользователей',
        icon: Users,
        gradient: 'from-cyan-400 to-blue-500',
    },
    {
        key: 'completedOrders',
        label: 'Завершённых заданий',
        icon: CheckCircle,
        gradient: 'from-emerald-400 to-teal-500',
    },
    {
        key: 'categories',
        label: 'Категорий услуг',
        icon: Layers,
        gradient: 'from-amber-300 to-orange-400',
    },
    {
        key: 'avgRating',
        label: 'Средний рейтинг',
        icon: Star,
        gradient: 'from-pink-400 to-fuchsia-500',
    },
] as const;

const StatsBlock: React.FC<Props> = ({ stats, loading }) => {
    return (
        <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {tiles.map((t) => {
                    const value = (stats as any)[t.key] ?? 0;
                    const Icon = t.icon;
                    return (
                        <motion.div
                            key={t.key}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="flex flex-col items-center text-center"
                        >
                            {loading ? (
                                <div className="h-10 w-20 rounded-lg bg-gray-100 animate-pulse mb-3" />
                            ) : (
                                <div
                                    className={`w-12 h-12 mb-3 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white shadow-lg`}
                                >
                                    <Icon size={24} />
                                </div>
                            )}
                            <div className="text-2xl font-extrabold text-blue-900 mb-1">
                                {loading ? '—' : value}
                            </div>
                            <div className="text-sm text-gray-500 leading-tight max-w-[8rem]">
                                {t.label}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default StatsBlock; 