import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import Button from '../components/ui/Button';
import { chatApi } from '../lib/api/chat';
import { ordersApi } from '../lib/api/orders';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

interface DisputedOrder {
    id: string;
    service_id: string;
    client_id: number;
    provider_id: number;
    price: number;
    created_at: string;
}

const notify = async (userId: number, text: string) => {
    await fetch(`${API_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, text })
    });
};

const AdminDisputesPage: React.FC = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<DisputedOrder[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDisputes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'disputed')
            .order('created_at', { ascending: false });
        if (!error) setOrders(data as DisputedOrder[]);
        setLoading(false);
    };

    useEffect(() => {
        if (user?.role === 'admin') fetchDisputes();
    }, [user]);

    const resolve = async (order: DisputedOrder, verdict: 'provider' | 'client') => {
        const newStatus = verdict === 'provider' ? 'completed' : 'refunded';
        // Обновляем статус через API, которое выполняет RPC выплат/разблокировки
        await ordersApi.updateOrderStatus(order.id, newStatus);
        // уведомления
        const chat = await chatApi.getOrCreateChat(order.client_id, order.provider_id);
        const msg = verdict === 'provider'
            ? 'Администратор решил спор в пользу исполнителя. Средства перечислены.'
            : 'Администратор решил спор в пользу заказчика. Средства возвращены.';
        await chatApi.sendMessage(chat.id, user!.id, msg, { type: 'admin_verdict', orderId: order.id, verdict });
        await notify(order.client_id, msg);
        await notify(order.provider_id, msg);
        fetchDisputes();
    };

    if (!user || user.role !== 'admin') {
        return <div className="p-6 text-center text-red-500">Доступ запрещён</div>;
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Споры по заказам</h1>
            {loading ? (
                <div>Загрузка...</div>
            ) : orders.length === 0 ? (
                <div className="text-gray-500">Споров нет</div>
            ) : (
                <div className="space-y-4">
                    {orders.map(o => (
                        <div key={o.id} className="border rounded-lg bg-white p-4 shadow">
                            <div className="mb-2 text-sm text-gray-500">Создан: {new Date(o.created_at).toLocaleString()}</div>
                            <div className="mb-2">Заказ #{o.id}</div>
                            <div className="mb-2">Цена: {o.price} кр.</div>
                            <div className="flex gap-2 mt-2">
                                <Button variant="success" onClick={() => resolve(o, 'provider')}>Отдать исполнителю</Button>
                                <Button variant="danger" onClick={() => resolve(o, 'client')}>Вернуть клиенту</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Button className="mt-6" onClick={() => navigate(-1)}>Назад</Button>
        </div>
    );
};

export default AdminDisputesPage; 