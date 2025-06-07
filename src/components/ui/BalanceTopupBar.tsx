import React, { useState } from "react";
import Button from "./Button";
import Modal from "./Modal";
import { useUser } from "../../contexts/UserContext";
import { Coins } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// Временные шаблоны, позже будут подгружаться из БД
const defaultTemplates = [
  { credits: 20, price: 49 },
  { credits: 50, price: 99 },
  { credits: 100, price: 179 },
  { credits: 200, price: 299 },
  { credits: 500, price: 699 },
  { credits: 1000, price: 1299 },
  { credits: 2000, price: 2499 },
];

const BalanceTopupBar: React.FC = () => {
  const { user, refetch } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (selected === null || !user) return;
    setLoading(true);
    setError(null);
    try {
      // В реальном проекте: id шаблона должен быть из БД, а не индекс
      const template_id = selected + 1;
      const res = await fetch(`${API_URL}/api/yookassa/create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, template_id }),
      });
      const data = await res.json();
      if (!res.ok || !data.confirmation_url)
        throw new Error(data.error || "Ошибка оплаты");
      window.open(data.confirmation_url, "_blank");
      setShowModal(false);
      setSelected(null);
      // После оплаты пользователь вернётся, и баланс обновится через refetch
      setTimeout(() => refetch && refetch(), 2000);
    } catch (e: any) {
      setError(e.message || "Ошибка оплаты");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setSelected(null);
    setError(null);
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1 shadow-sm">
      <Coins size={18} className="text-amber-400 mr-1" />
      <span className="text-base font-medium text-gray-800">
        <span className="text-primary-500 font-bold">{user?.credits ?? 0}</span>{" "}
        кредитов
      </span>
      <Button
        variant="primary"
        size="sm"
        className="ml-2 px-3 py-1 text-xs rounded-lg font-semibold shadow-none"
        style={{ minWidth: 0 }}
        onClick={() => setShowModal(true)}
      >
        Пополнить
      </Button>
      <Modal isOpen={showModal} onClose={handleClose}>
        <h2 className="text-xl font-bold mb-4">Пополнение баланса</h2>
        <div className="space-y-3 mb-2">
          {defaultTemplates.map((tpl, idx) => (
            <button
              key={tpl.credits}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition mb-1 ${selected === idx ? "border-primary-500 bg-primary-50" : "border-gray-200 bg-white"}`}
              onClick={() => setSelected(idx)}
            >
              <span className="font-medium">{tpl.credits} кредитов</span>
              <span className="text-primary-500 font-bold text-lg">
                {tpl.price} ₽
              </span>
            </button>
          ))}
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <Button
          className="mt-4 w-full"
          variant="primary"
          size="md"
          disabled={selected === null || loading}
          isLoading={loading}
          onClick={handlePayment}
        >
          Оплатить
        </Button>
      </Modal>
    </div>
  );
};

export default BalanceTopupBar;
