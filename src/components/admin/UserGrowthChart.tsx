import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    TimeScale,
} from "chart.js";
import 'chartjs-adapter-date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from "../../lib/supabase";
import { Loader2 } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, TimeScale);

const UserGrowthChart: React.FC = () => {
    const [labels, setLabels] = useState<string[]>([]);
    const [counts, setCounts] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.rpc('users_by_day');
            /* Если нет функции, второй вариант: */
            // const { data } = await supabase.from('users').select('created_at');
            if (data) {
                const lbls: string[] = [];
                const cnts: number[] = [];
                data.forEach((row: any) => {
                    lbls.push(row.day);
                    cnts.push(row.count);
                });
                setLabels(lbls);
                setCounts(cnts);
            }
            setLoading(false);
        })();
    }, []);

    if (loading) return <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={20} /> Загрузка...</div>;

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Новые пользователи',
                data: counts,
                borderColor: '#0BBBEF',
                backgroundColor: 'rgba(11,187,239,0.2)',
                tension: 0.3,
                pointRadius: 0,
                fill: true,
            },
        ],
    };

    const options = {
        scales: {
            x: { type: 'time', time: { unit: 'day', tooltipFormat: 'dd MMM', displayFormats: { day: 'dd MMM' } } },
            y: { beginAtZero: true },
        },
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false,
    } as const;

    return (
        <div className="h-64">
            <Line data={chartData} options={options} />
        </div>
    );
};

export default UserGrowthChart; 