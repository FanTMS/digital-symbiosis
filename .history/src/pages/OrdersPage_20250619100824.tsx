import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import { useTelegram } from "../hooks/useTelegram";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  Plus,
} from "lucide-react";
import Button from "../components/ui/Button";
import { chatApi } from "../lib/api/chat";
import { formatDate } from "../utils/formatters";
import Modal from "../components/ui/Modal";
import { supabase } from "../lib/supabase";
import { useOrders, useUpdateOrderStatus } from "../hooks/useOrders";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "../components/ui/Avatar";
import { useCreatePriceProposal } from '../hooks/usePriceProposals';
import { API_URL } from '../config';

const PAGE_SIZE = 20;
const CARD_HEIGHT = 120; // px, высота одной карточки заказа
const VISIBLE_COUNT = 8;

// Функция для отправки уведомления в бота
async function notifyBot(userId: number, text: string) {
  try {
    await fetch(`${API_URL}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, text }),
    });
  } catch (e) {
    // ignore
  }
}

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { tg } = useTelegram();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const [page, setPage] = useState(0);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const {
    data: userOrders = [],
    isLoading,
    isFetching,
  } = useOrders(userId ?? 0, "client", PAGE_SIZE, page * PAGE_SIZE);
  const updateOrderStatus = useUpdateOrderStatus();
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<"client" | "provider">("client");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<any | null>(null);
  const createProposal = useCreatePriceProposal();

  useEffect(() => {
    if (tg) {
      tg.setHeaderColor("#0BBBEF");
      tg.BackButton.show();
      tg.BackButton.onClick(() => navigate("/"));
      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick(() => navigate("/"));
      };
    }
  }, [tg, navigate]);

  useEffect(() => {
    if (userOrders && userOrders.length > 0) {
      setAllOrders((prev) =>
        page === 0 ? userOrders : [...prev, ...userOrders],
      );
      setHasMore(userOrders.length === PAGE_SIZE);
    } else if (page === 0) {
      setAllOrders([]);
      setHasMore(false);
    } else if (userOrders && userOrders.length < PAGE_SIZE) {
      setHasMore(false);
    }
  }, [userOrders, page]);

  useEffect(() => {
    setPage(0);
  }, []);

  const getOrderStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-500",
          bgColor: "bg-yellow-100",
          label: "Ожидает",
        };
      case "accepted":
        return {
          icon: AlertCircle,
          color: "text-blue-500",
          bgColor: "bg-blue-100",
          label: "Выполняется",
        };
      case "in_progress":
        return {
          icon: AlertCircle,
          color: "text-blue-500",
          bgColor: "bg-blue-100",
          label: "В процессе",
        };
      case "completed":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-100",
          label: "Завершен",
        };
      case "cancelled":
        return {
          icon: XCircle,
          color: "text-red-500",
          bgColor: "bg-red-100",
          label: "Отклонено",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-500",
          bgColor: "bg-gray-100",
          label: "Неизвестно",
        };
    }
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => setSelectedOrder(null);

  const handleContact = async (userId?: number) => {
    if (!user?.id || !userId) return;
    const chat = await chatApi.getOrCreateChat(user.id, userId);
    navigate(`/chat/${chat.id}`);
  };

  // Принять заказ
  const handleAcceptOrder = async (order: any) => {
    await updateOrderStatus.mutateAsync({ id: order.id, status: 'accepted' });
    // Инвалидируем кэш
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["orders", userId, "provider"] });
    }
    // Сообщение в чат
    const chat = await chatApi.getOrCreateChat(order.client_id, order.provider_id);
    await chatApi.sendMessage(
      chat.id,
      userId,
      `Исполнитель принял ваш заказ по услуге "${order.service?.title}". Работа начнётся в ближайшее время!`,
      { type: 'system_action_accept', orderId: order.id, role: 'client', status: 'accepted' }
    );
    // Уведомление в бота для клиента
    await notifyBot(order.client_id, `Ваш заказ по услуге "${order.service?.title}" был принят исполнителем!`);
  };

  // Отклонить заказ
  const handleDeclineOrder = async (order: any) => {
    await updateOrderStatus.mutateAsync({ id: order.id, status: 'cancelled' });
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["orders", userId, "provider"] });
    }
    const chat = await chatApi.getOrCreateChat(order.client_id, order.provider_id);
    await chatApi.sendMessage(
      chat.id,
      userId,
      `Исполнитель отклонил ваш заказ по услуге "${order.service?.title}". Вы можете выбрать другого исполнителя или создать новый заказ.`,
      { type: 'system_action_decline', orderId: order.id, role: 'client', status: 'cancelled' }
    );
    await notifyBot(order.client_id, `Ваш заказ по услуге "${order.service?.title}" был отклонён исполнителем.`);
  };

  // Модифицирую handleCompleteOrder для уведомления в бота
  const handleCompleteOrder = async (orderId: number) => {
    await updateOrderStatus.mutateAsync({ id: orderId, status: "completed_by_provider" });
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["orders", userId, "client"] });
    }
    const order = userOrders.find((o) => o.id === orderId);
    if (order) {
      const chat = await chatApi.getOrCreateChat(order.client_id, order.provider_id);
      await chatApi.sendMessage(
        chat.id,
        userId ?? order.provider_id,
        `Исполнитель завершил заказ по услуге "${order.service?.title}". Пожалуйста, подтвердите выполнение или обратитесь к администратору, если есть вопросы.`,
        { type: "system_action_client", orderId: orderId, role: "client", status: "completed_by_provider" }
      );
      await notifyBot(order.client_id, `Ваш заказ по услуге "${order.service?.title}" был завершён исполнителем. Пожалуйста, подтвердите выполнение!`);
      await notifyBot(order.provider_id, `Вы завершили заказ по услуге "${order.service?.title}". Ожидайте подтверждения от клиента.`);
    }
  };

  if (!userId) {
    return <div className="p-4">Загрузка пользователя...</div>;
  }

  return (
    <div className="pb-20 sm:pb-24 pt-2">
      <div className="px-4">
        <h1 className="text-2xl font-bold mb-4">Мои заказы</h1>

        {/* Tabs */}
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-md text-center ${activeTab === "client"
              ? "bg-white text-primary-500 shadow-sm"
              : "text-gray-600"
              }`}
            onClick={() => setActiveTab("client")}
          >
            Я заказчик
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-center ${activeTab === "provider"
              ? "bg-white text-primary-500 shadow-sm"
              : "text-gray-600"
              }`}
            onClick={() => setActiveTab("provider")}
          >
            Я исполнитель
          </button>
        </div>

        {/* Orders list с анимацией перехода между вкладками */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={
              activeTab +
              (isLoading
                ? "-loading"
                : allOrders.length > 0
                  ? "-list"
                  : "-empty")
            }
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {isLoading && page === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-100 animate-pulse h-32 rounded-lg"
                  ></div>
                ))}
              </div>
            ) : allOrders.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {allOrders.map((order) => {
                    const statusInfo = getOrderStatusInfo(order.status);
                    const service = order.service;
                    const otherUser =
                      activeTab === "client" ? order.provider : order.client;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        whileHover={{ scale: 1.018, boxShadow: '0 8px 32px 0 rgba(34, 197, 246, 0.10)' }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-3xl shadow-xl border border-blue-100 overflow-hidden flex flex-col transition-all duration-300 cursor-pointer group"
                      >
                        {/* Фото услуги */}
                        {service?.image_url && (
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="w-full h-32 object-cover"
                            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
                          />
                        )}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-blue-900 text-base line-clamp-2 group-hover:underline transition-all duration-200">
                                {service?.title}
                              </h3>
                              <div
                                className={`flex items-center px-2 py-1 rounded-full text-xs font-bold ${statusInfo.bgColor} ${statusInfo.color}`}
                              >
                                <StatusIcon size={13} className="mr-1" />
                                {statusInfo.label}
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-gray-500 mb-2">
                              <Clock size={13} className="mr-1" />
                              <span>{formatDate(new Date(order.created_at))}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar src={otherUser?.avatar_url} name={otherUser?.name} size={28} className="border" />
                              <div>
                                <div className="text-xs text-gray-500">
                                  {activeTab === "client" ? "Исполнитель" : "Заказчик"}
                                </div>
                                <div
                                  className="font-medium cursor-pointer text-primary-600 hover:underline text-sm"
                                  onClick={() =>
                                    otherUser?.id &&
                                    navigate(`/profile/${otherUser.id}`)
                                  }
                                >
                                  {otherUser?.name}
                                </div>
                              </div>
                              <div className="ml-auto text-right">
                                <div className="text-xs text-gray-500">Стоимость</div>
                                <div className="font-bold text-orange-500 text-base">{order.price} кр.</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2 sm:flex-row flex-col">
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<ExternalLink size={14} />}
                              onClick={() => handleViewDetails(order)}
                              className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95 rounded-2xl"
                            >
                              Подробнее
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<MessageCircle size={14} />}
                              onClick={() => handleContact(otherUser?.id)}
                              className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95 rounded-2xl"
                            >
                              Связаться
                            </Button>
                            {user && otherUser && user.id !== otherUser.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95 rounded-2xl"
                                onClick={() => { setCurrentOrder(order); setShowPriceModal(true); }}
                              >
                                Предложить цену
                              </Button>
                            )}
                            {/* Кнопки для исполнителя */}
                            {activeTab === "provider" && order.status === "pending" && (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleAcceptOrder(order)}
                                  className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95 rounded-2xl"
                                >
                                  Принять
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeclineOrder(order)}
                                  className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95 rounded-2xl"
                                >
                                  Отклонить
                                </Button>
                              </>
                            )}
                            {activeTab === "provider" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/edit-order/${order.id}`)}
                                className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95 rounded-2xl"
                              >
                                Редактировать
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {hasMore && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={isFetching}
                    >
                      {isFetching ? "Загрузка..." : "Показать ещё"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="text-4xl mb-2">📦</div>
                <h3 className="text-lg font-medium mb-1">Нет заказов</h3>
                <p className="text-gray-500 mb-4 max-w-xs">
                  Пока у вас нет заказов. Попробуйте заказать услугу!
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Модальное окно с деталями заказа */}
      {selectedOrder && (
        <Modal isOpen={!!selectedOrder} onClose={handleCloseModal}>
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">Детали заказа</h2>
            <div className="mb-2">
              <span className="font-medium">Услуга:</span>{" "}
              {selectedOrder.service?.title}
            </div>
            <div className="mb-2">
              <span className="font-medium">Описание:</span>{" "}
              {selectedOrder.service?.description}
            </div>
            <div className="mb-2">
              <span className="font-medium">Статус:</span>{" "}
              {getOrderStatusInfo(selectedOrder.status).label}
            </div>
            <div className="mb-2">
              <span className="font-medium">Стоимость:</span>{" "}
              {selectedOrder.price} кр.
            </div>
            <div className="mb-2">
              <span className="font-medium">
                {activeTab === "client" ? "Исполнитель" : "Заказчик"}:
              </span>{" "}
              {activeTab === "client"
                ? selectedOrder.provider?.name
                : selectedOrder.client?.name}
            </div>
            <div className="mb-2">
              <span className="font-medium">Создан:</span>{" "}
              {formatDate(new Date(selectedOrder.created_at))}
            </div>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="mt-4 w-full"
            >
              Закрыть
            </Button>
            <Button
              variant="primary"
              className="mt-2 w-full"
              onClick={() => {
                if (selectedOrder?.service?.id) {
                  navigate(`/services/${selectedOrder.service.id}`);
                }
              }}
            >
              Открыть услугу
            </Button>
          </div>
        </Modal>
      )}
      {/* Модалка для предложения цены по заказу */}
      <Modal isOpen={showPriceModal} onClose={() => { setShowPriceModal(false); setPriceError(null); }}>
        <h2 className="text-xl font-bold mb-3">Предложить цену по заказу</h2>
        <div className="mb-2 text-gray-600 text-sm">
          {currentOrder?.max_price ? (
            <>Максимальная цена заказчика: <b>{currentOrder.max_price} кр.</b></>
          ) : (
            <>Текущая цена: <b>{currentOrder?.price} кр.</b></>
          )}
        </div>
        <input
          type="number"
          className="w-full border rounded px-3 py-2 mb-2"
          placeholder="Введите вашу цену"
          value={proposedPrice}
          min={1}
          onChange={e => setProposedPrice(e.target.value)}
        />
        {priceError && <div className="text-red-500 text-sm mb-2">{priceError}</div>}
        <Button
          variant="primary"
          fullWidth
          disabled={createProposal.isLoading}
          onClick={async () => {
            setPriceError(null);
            const priceNum = Number(proposedPrice);
            if (!priceNum || (currentOrder?.max_price && priceNum > currentOrder.max_price)) {
              setPriceError(currentOrder?.max_price ? `Цена не может быть выше ${currentOrder.max_price} кр.` : 'Введите корректную цену');
              return;
            }
            try {
              await createProposal.mutateAsync({
                order_id: currentOrder.id,
                from_user_id: user.id,
                to_user_id: otherUser.id,
                proposed_price: priceNum,
              });
              setShowPriceModal(false);
              setProposedPrice('');
              setSuccessMsg('Ваше предложение отправлено!');
            } catch (e: any) {
              setPriceError(e.message || 'Ошибка отправки предложения');
            }
          }}
        >
          Отправить предложение
        </Button>
      </Modal>
      {/* Уведомление об успехе */}
      {successMsg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-100 text-green-800 px-4 py-2 rounded-xl shadow-lg z-50">
          {successMsg}
          <button className="ml-2 text-green-700 font-bold" onClick={() => setSuccessMsg(null)}>×</button>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
