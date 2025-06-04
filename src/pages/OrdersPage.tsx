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
import { useToast } from "../components/ui/ToastProvider";
import { useOrders, useUpdateOrderStatus } from "../hooks/useOrders";
import { useQueryClient } from "@tanstack/react-query";
import { FixedSizeList as List } from "react-window";

const PAGE_SIZE = 20;
const CARD_HEIGHT = 120; // px, высота одной карточки заказа
const VISIBLE_COUNT = 8;

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { tg } = useTelegram();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"client" | "provider">("client");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const userId = user?.id;
  const [page, setPage] = useState(0);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const {
    data: userOrders = [],
    isLoading,
    isFetching,
  } = useOrders(userId ?? 0, activeTab, PAGE_SIZE, page * PAGE_SIZE);
  const updateOrderStatus = useUpdateOrderStatus();
  const [hasMore, setHasMore] = useState(true);

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
  }, [activeTab]);

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
        queryKey: ["orders", userId, activeTab],
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
    return (
      <div className="p-4" data-oid="6fik.tt">
        Загрузка пользователя...
      </div>
    );
  }

  return (
    <div className="pb-16 pt-2" data-oid="7qjrmqe">
      <div className="px-4" data-oid="e:9.f2t">
        <h1 className="text-2xl font-bold mb-4" data-oid="wnw7foc">
          Мои заказы
        </h1>

        {/* Tabs */}
        <div
          className="flex mb-4 bg-gray-100 rounded-lg p-1"
          data-oid="nxj5:ed"
        >
          <button
            className={`flex-1 py-2 rounded-md text-center ${
              activeTab === "client"
                ? "bg-white text-primary-500 shadow-sm"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("client")}
            data-oid="vkjszqa"
          >
            Я заказчик
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-center ${
              activeTab === "provider"
                ? "bg-white text-primary-500 shadow-sm"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("provider")}
            data-oid="xi6.v01"
          >
            Я исполнитель
          </button>
        </div>

        {/* Orders list с анимацией перехода между вкладками */}
        <AnimatePresence mode="wait" initial={false} data-oid="h:ybsax">
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
            data-oid="c.d67wq"
          >
            {isLoading && page === 0 ? (
              <div className="space-y-3" data-oid="lscvfoh">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-100 animate-pulse h-32 rounded-lg"
                    data-oid="_xy7wr."
                  ></div>
                ))}
              </div>
            ) : allOrders.length > 0 ? (
              <>
                <List
                  height={
                    CARD_HEIGHT * Math.min(allOrders.length, VISIBLE_COUNT)
                  }
                  itemCount={allOrders.length}
                  itemSize={CARD_HEIGHT}
                  width={"100%"}
                  style={{
                    minHeight:
                      CARD_HEIGHT * Math.min(allOrders.length, VISIBLE_COUNT),
                  }}
                  data-oid="nbcybrd"
                >
                  {({
                    index,
                    style,
                  }: {
                    index: number;
                    style: React.CSSProperties;
                  }) => {
                    const order = allOrders[index];
                    const statusInfo = getOrderStatusInfo(order.status);
                    const service = order.service;
                    const otherUser =
                      activeTab === "client" ? order.provider : order.client;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div style={style} key={order.id} data-oid="o.ib0kh">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="bg-white rounded-lg shadow mb-4"
                          data-oid="iojrk.6"
                        >
                          <div className="p-4" data-oid="8yi2_gb">
                            <div
                              className="flex justify-between items-start mb-2"
                              data-oid=".tm:32s"
                            >
                              <h3
                                className="font-medium text-gray-900"
                                data-oid="k0__27t"
                              >
                                {service?.title}
                              </h3>
                              <div
                                className={`flex items-center px-2 py-1 rounded-full text-xs ${statusInfo.bgColor} ${statusInfo.color}`}
                                data-oid="tikdazm"
                              >
                                <StatusIcon
                                  size={12}
                                  className="mr-1"
                                  data-oid="6dspv-t"
                                />

                                {statusInfo.label}
                              </div>
                            </div>
                            <div
                              className="flex items-center text-sm text-gray-500 mb-3"
                              data-oid="mgr1sjt"
                            >
                              <Clock
                                size={14}
                                className="mr-1"
                                data-oid="-af-g5n"
                              />

                              <span data-oid="e.n9joo">
                                {formatDate(new Date(order.created_at))}
                              </span>
                            </div>
                            <div
                              className="flex justify-between items-center mb-3"
                              data-oid="l3fxmxm"
                            >
                              <div data-oid="_gg861l">
                                <div
                                  className="text-xs text-gray-500 mb-1"
                                  data-oid="agd8:36"
                                >
                                  {activeTab === "client"
                                    ? "Исполнитель"
                                    : "Заказчик"}
                                </div>
                                <div
                                  className="font-medium cursor-pointer text-primary-600 hover:underline"
                                  onClick={() =>
                                    otherUser?.id &&
                                    navigate(`/profile/${otherUser.id}`)
                                  }
                                  data-oid="9vct-8k"
                                >
                                  {otherUser?.name}
                                </div>
                              </div>
                              <div className="text-right" data-oid="tyvhz:l">
                                <div
                                  className="text-xs text-gray-500"
                                  data-oid="ud0juya"
                                >
                                  Стоимость
                                </div>
                                <div
                                  className="font-medium text-accent-500"
                                  data-oid="8ger0dd"
                                >
                                  {order.price} кр.
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2" data-oid="v.gp-a2">
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={
                                  <ExternalLink size={14} data-oid="2_4:q9w" />
                                }
                                onClick={() => handleViewDetails(order)}
                                className="flex-1"
                                data-oid="nqt0ysq"
                              >
                                Подробнее
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={
                                  <MessageCircle size={14} data-oid="5ct_q5p" />
                                }
                                onClick={() => handleContact(otherUser?.id)}
                                className="flex-1"
                                data-oid="n_o7r8a"
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
                                    onClick={() =>
                                      handleCompleteOrder(order.id)
                                    }
                                    className="flex-1"
                                    data-oid="yb5j-b3"
                                  >
                                    Завершить
                                  </Button>
                                )}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  }}
                </List>
                {hasMore && (
                  <div className="flex justify-center mt-4" data-oid="t0cmbe7">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={isFetching}
                      data-oid=".v4v5ib"
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
                data-oid="dfp95te"
              >
                <div className="text-4xl mb-2" data-oid="2rpf0j1">
                  📦
                </div>
                <h3 className="text-lg font-medium mb-1" data-oid="j:1t7h.">
                  Нет заказов
                </h3>
                <p className="text-gray-500 mb-4 max-w-xs" data-oid="l.hq97n">
                  Пока у вас нет заказов. Попробуйте заказать услугу!
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Модальное окно с деталями заказа */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={handleCloseModal}
          data-oid="n.b3la5"
        >
          <div className="p-4" data-oid="393l:w1">
            <h2 className="text-xl font-bold mb-2" data-oid="s.akwuu">
              Детали заказа
            </h2>
            <div className="mb-2" data-oid="n32wp78">
              <span className="font-medium" data-oid="c21smjq">
                Услуга:
              </span>{" "}
              {selectedOrder.service?.title}
            </div>
            <div className="mb-2" data-oid="svr_-gf">
              <span className="font-medium" data-oid="5septwb">
                Описание:
              </span>{" "}
              {selectedOrder.service?.description}
            </div>
            <div className="mb-2" data-oid="ji83xhg">
              <span className="font-medium" data-oid="p36-25-">
                Статус:
              </span>{" "}
              {getOrderStatusInfo(selectedOrder.status).label}
            </div>
            <div className="mb-2" data-oid="510irto">
              <span className="font-medium" data-oid="zmvw6t:">
                Стоимость:
              </span>{" "}
              {selectedOrder.price} кр.
            </div>
            <div className="mb-2" data-oid="zr3o6:u">
              <span className="font-medium" data-oid="j3smgzu">
                {activeTab === "client" ? "Исполнитель" : "Заказчик"}:
              </span>{" "}
              {activeTab === "client"
                ? selectedOrder.provider?.name
                : selectedOrder.client?.name}
            </div>
            <div className="mb-2" data-oid="692lol_">
              <span className="font-medium" data-oid="78b5lt_">
                Создан:
              </span>{" "}
              {formatDate(new Date(selectedOrder.created_at))}
            </div>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="mt-4 w-full"
              data-oid="9imc525"
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
              data-oid="rcpps-t"
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
