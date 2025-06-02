import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useTelegram } from '../hooks/useTelegram';
import { Clock, CheckCircle, XCircle, AlertCircle, MessageCircle, ExternalLink, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import { chatApi } from '../lib/api/chat';
import { formatDate } from '../utils/formatters';
import Modal from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/ToastProvider';
import { useOrders, useUpdateOrderStatus } from '../hooks/useOrders';
import { useQueryClient } from '@tanstack/react-query';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { tg } = useTelegram();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'client' | 'provider'>('client');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const userId = user?.id;
  const { data: userOrders = [], isLoading } = useOrders(userId ?? 0, activeTab);
  const updateOrderStatus = useUpdateOrderStatus();
  
  useEffect(() => {
    if (tg) {
      tg.setHeaderColor('#0BBBEF');
      tg.BackButton.show();
      tg.BackButton.onClick(() => navigate('/'));
      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick(() => navigate('/'));
      };
    }
  }, [tg, navigate]);
  
  const getOrderStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-100', label: 'Ожидает' };
      case 'accepted':
        return { icon: AlertCircle, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Выполняется' };
      case 'in_progress':
        return { icon: AlertCircle, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'В процессе' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Завершен' };
      case 'cancelled':
        return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Отклонено' };
      default:
        return { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Неизвестно' };
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
    await updateOrderStatus.mutateAsync({ id: orderId, status: 'completed_by_provider' });
    // 2. Инвалидируем кэш заказов для обновления списка
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['orders', userId, activeTab] });
    }
    // 3. Отправляем системное сообщение в чат для клиента
    // Получаем заказ для получения client_id и provider_id
    const order = userOrders.find((o: any) => o.id === orderId);
    if (order) {
      const chat = await chatApi.getOrCreateChat(order.client_id, order.provider_id);
      await chatApi.sendMessage(
        chat.id,
        userId ?? order.provider_id,
        'Исполнитель завершил заказ. Пожалуйста, подтвердите выполнение или обратитесь к администратору, если есть вопросы.',
        { type: 'system_action_client', orderId: orderId, role: 'client', status: 'completed_by_provider' }
      );
    }
  };

  if (!userId) {
    return <div className="p-4">Загрузка пользователя...</div>;
  }

  return (
    <div className="pb-16 pt-2">
      <div className="px-4">
        <h1 className="text-2xl font-bold mb-4">Мои заказы</h1>
        
        {/* Tabs */}
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-md text-center ${
              activeTab === 'client'
                ? 'bg-white text-primary-500 shadow-sm'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('client')}
          >
            Я заказчик
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-center ${
              activeTab === 'provider'
                ? 'bg-white text-primary-500 shadow-sm'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('provider')}
          >
            Я исполнитель
          </button>
        </div>
        
        {/* Orders list с анимацией перехода между вкладками */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab + (isLoading ? '-loading' : userOrders.length > 0 ? '-list' : '-empty')}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, type: 'tween' }}
          >
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 animate-pulse h-32 rounded-lg"></div>
                ))}
              </div>
            ) : userOrders.length > 0 ? (
              <div className="space-y-4">
                {userOrders
                  .slice() // копия массива
                  .sort((a, b) => {
                    const activeStatuses = ['pending', 'accepted', 'in_progress'];
                    const aActive = activeStatuses.includes(a.status);
                    const bActive = activeStatuses.includes(b.status);
                    if (aActive === bActive) return 0;
                    return aActive ? -1 : 1;
                  })
                  .map(order => {
                    const statusInfo = getOrderStatusInfo(order.status);
                    const StatusIcon = statusInfo.icon;
                    const service = order.service;
                    const otherUser = activeTab === 'client' ? order.provider : order.client;
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-white rounded-lg shadow-card overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-gray-900">{service?.title}</h3>
                            <div className={`flex items-center px-2 py-1 rounded-full text-xs ${statusInfo.bgColor} ${statusInfo.color}`}>
                              <StatusIcon size={12} className="mr-1" />
                              {statusInfo.label}
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <Clock size={14} className="mr-1" />
                            <span>{formatDate(new Date(order.created_at))}</span>
                          </div>
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <div className="text-xs text-gray-500">
                                {activeTab === 'client' ? 'Исполнитель' : 'Заказчик'}
                              </div>
                              <div className="font-medium cursor-pointer text-primary-600 hover:underline" onClick={() => otherUser?.id && navigate(`/profile/${otherUser.id}`)}>{otherUser?.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">Стоимость</div>
                              <div className="font-medium text-accent-500">{order.price} кр.</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<ExternalLink size={14} />}
                              onClick={() => handleViewDetails(order)}
                              className="flex-1"
                            >
                              Детали
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<MessageCircle size={14} />}
                              onClick={() => handleContact(otherUser?.id)}
                              className="flex-1"
                            >
                              Связаться
                            </Button>
                            {/* Кнопка Завершить для исполнителя */}
                            {activeTab === 'provider' && (order.status === 'accepted' || order.status === 'in_progress') && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleCompleteOrder(order.id)}
                                className="flex-1"
                              >
                                Завершить
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                <div className="text-4xl mb-2">{activeTab === 'client' ? '' : '🧑‍💼'}</div>
                <h3 className="text-lg font-medium mb-1">{activeTab === 'client' ? 'Нет заказов как клиент' : 'Нет заказов как исполнитель'}</h3>
                <p className="text-gray-500 mb-4 max-w-xs">
                  {activeTab === 'client'
                    ? 'Вы ещё не сделали ни одного заказа. Найдите услугу и оформите первый заказ!'
                    : 'У вас пока нет заказов как исполнитель. Ожидайте новых заявок!'}
                </p>
                {activeTab === 'client' && (
                  <Button 
                    variant="primary" 
                    leftIcon={<Plus size={16} />}
                    onClick={() => navigate('/services')}
                  >
                    Найти услугу
                  </Button>
                )}
              </div>
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
              <span className="font-medium">Услуга:</span> {selectedOrder.service?.title}
            </div>
            <div className="mb-2">
              <span className="font-medium">Описание:</span> {selectedOrder.service?.description}
            </div>
            <div className="mb-2">
              <span className="font-medium">Статус:</span> {getOrderStatusInfo(selectedOrder.status).label}
            </div>
            <div className="mb-2">
              <span className="font-medium">Стоимость:</span> {selectedOrder.price} кр.
            </div>
            <div className="mb-2">
              <span className="font-medium">{activeTab === 'client' ? 'Исполнитель' : 'Заказчик'}:</span> {activeTab === 'client' ? selectedOrder.provider?.name : selectedOrder.client?.name}
            </div>
            <div className="mb-2">
              <span className="font-medium">Создан:</span> {formatDate(new Date(selectedOrder.created_at))}
            </div>
            <Button variant="outline" onClick={handleCloseModal} className="mt-4 w-full">Закрыть</Button>
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