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

const PAGE_SIZE = 20;
const CARD_HEIGHT = 120; // px, высота одной карточки заказа
const VISIBLE_COUNT = 8;

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

  const handleContact = async (userId: number) => {
    if (!user?.id || !userId) return;
    const chat = await chatApi.getOrCreateChat(user.id, userId);
    navigate(`/chat/${chat.id}`);
  };

  const handleCompleteOrder = async (orderId: string) => {
    // 1. Меняем статус на 'completed_by_provider'
    await updateOrderStatus.mutateAsync({
      id: orderId,
      status: "completed_by_provider",
    });
    // 2. Инвалидируем кэш заказов для обновления списка
    if (userId) {
      queryClient.invalidateQueries({
        queryKey: ["orders", userId, "client"],
      });
    }
    // 3. Отправляем системное сообщение в чат для клиента
    // Получаем заказ для получения client_id и provider_id
    const order = userOrders.find((o: any) => o.id === orderId);
    if (order) {
      const chat = await chatApi.getOrCreateChat(
        order.client_id,
        order.provider_id,
      );
      await chatApi.sendMessage(
        chat.id,
        userId ?? order.provider_id,
        "Исполнитель завершил заказ. Пожалуйста, подтвердите выполнение или обратитесь к администратору, если есть вопросы.",
        {
          type: "system_action_client",
          orderId: orderId,
          role: "client",
          status: "completed_by_provider",
        },
      );
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
                        className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden flex flex-col"
                      >
                        {/* Фото услуги */}
                        {service?.image_url && (
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-blue-900 text-base line-clamp-2">
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
                              <img
                                src={otherUser?.avatar_url || 'https://images.pexels.com/photos/4926674/pexels-photo-4926674.jpeg?auto=compress&cs=tinysrgb&w=150'}
                                alt={otherUser?.name}
                                className="w-7 h-7 rounded-full object-cover border"
                              />
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
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<ExternalLink size={14} />}
                              onClick={() => handleViewDetails(order)}
                              className="flex-1"
                            >
                              Подробнее
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<MessageCircle size={14} />}
                              onClick={() => handleContact(otherUser?.id)}
                              className="flex-1"
                            >
                              Связаться
                            </Button>
                            {/* Кнопка Завершить для исполнителя */}
                            {activeTab === "provider" &&
                              (order.status === "accepted" ||
                                order.status === "in_progress") && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleCompleteOrder(order.id)}
                                  className="flex-1"
                                >
                                  Завершить
                                </Button>
                              )}
                            {activeTab === "provider" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/edit-order/${order.id}`)}
                                className="flex-1"
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
    </div>
  );
};

export default OrdersPage;
