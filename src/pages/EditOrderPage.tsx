import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { ordersApi } from "../lib/api/orders";
import Button from "../components/ui/Button";
import { Loader2, X, CheckCircle, AlertCircle, Clock } from "lucide-react";
import Modal from "../components/ui/Modal";

const statusSteps = [
    { key: "pending", label: "Создан", icon: Clock },
    { key: "accepted", label: "Принят", icon: AlertCircle },
    { key: "in_progress", label: "В работе", icon: AlertCircle },
    { key: "completed", label: "Завершён", icon: CheckCircle },
    { key: "cancelled", label: "Отменён", icon: X },
];

const EditOrderPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const { user } = useUser();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [fields, setFields] = useState({ description: "", price: "", deadline: "" });

    useEffect(() => {
        if (!orderId) return;
        setLoading(true);
        ordersApi.getOrder(orderId).then((data) => {
            setOrder(data);
            setFields({
                description: data?.description || "",
                price: data?.price?.toString() || "",
                deadline: data?.deadline || "",
            });
            setLoading(false);
        });
    }, [orderId]);

    if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" size={32} /></div>;
    if (!order || user?.id !== order.provider_id) return <div className="p-6 text-center">Нет доступа</div>;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFields({ ...fields, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        await ordersApi.updateOrder(order.id, {
            description: fields.description,
            price: Number(fields.price),
            deadline: fields.deadline,
        });
        setSaving(false);
        alert("Изменения сохранены!");
        navigate(-1);
    };

    const handleCancelOrder = async () => {
        setSaving(true);
        await ordersApi.updateOrder(order.id, { status: "cancelled", cancel_reason: cancelReason });
        setSaving(false);
        setShowCancelModal(false);
        alert("Заказ отменён");
        navigate(-1);
    };

    // Текущий шаг статуса
    const currentStep = statusSteps.findIndex(s => s.key === order.status);

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white flex justify-center items-start pb-20">
            <div className="w-full max-w-md mx-auto px-2 sm:px-0 mt-4">
                <h1 className="text-2xl font-bold mb-6 text-blue-700 text-center">Редактирование заказа</h1>
                {/* Трекер статуса */}
                <div className="flex items-center justify-between mb-8">
                    {statusSteps.map((step, idx) => (
                        <div key={step.key} className="flex-1 flex flex-col items-center">
                            <div className={`rounded-full p-2 ${idx <= currentStep ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                                <step.icon size={22} />
                            </div>
                            <span className={`text-xs mt-1 ${idx <= currentStep ? "text-blue-700 font-bold" : "text-gray-400"}`}>{step.label}</span>
                            {idx < statusSteps.length - 1 && <div className={`h-1 w-full ${idx < currentStep ? "bg-blue-400" : "bg-gray-200"}`}></div>}
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-2xl shadow-xl p-5 mb-6 border border-blue-100">
                    <label className="block font-semibold mb-2 text-gray-700">Описание заказа</label>
                    <textarea
                        name="description"
                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none min-h-[80px] text-base transition mb-4"
                        value={fields.description}
                        onChange={handleChange}
                        disabled={saving}
                    />
                    <label className="block font-semibold mb-2 text-gray-700">Стоимость (₽)</label>
                    <input
                        type="number"
                        name="price"
                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-base transition mb-4"
                        value={fields.price}
                        onChange={handleChange}
                        disabled={saving}
                    />
                    <label className="block font-semibold mb-2 text-gray-700">Срок выполнения</label>
                    <input
                        type="date"
                        name="deadline"
                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-base transition mb-4"
                        value={fields.deadline}
                        onChange={handleChange}
                        disabled={saving}
                    />
                    <div className="flex gap-2 mt-4">
                        <Button
                            type="button"
                            variant="primary"
                            className="flex-1 py-3 rounded-xl text-lg font-bold shadow-md bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="animate-spin" size={22} /> : <CheckCircle size={22} />}
                            Сохранить
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            className="flex-1 py-3 rounded-xl text-lg font-bold"
                            onClick={() => setShowCancelModal(true)}
                            disabled={saving}
                        >
                            <X size={22} /> Отменить заказ
                        </Button>
                    </div>
                </div>
                <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)}>
                    <div className="p-4">
                        <h2 className="text-lg font-bold mb-2">Причина отмены заказа</h2>
                        <textarea
                            className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50 mb-2"
                            rows={3}
                            placeholder="Опишите причину отмены..."
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            maxLength={200}
                        />
                        <div className="flex gap-2 mt-2">
                            <Button variant="outline" onClick={() => setShowCancelModal(false)}>Отмена</Button>
                            <Button variant="danger" onClick={handleCancelOrder} disabled={saving || !cancelReason.trim()}>
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <X size={20} />} Подтвердить
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default EditOrderPage; 