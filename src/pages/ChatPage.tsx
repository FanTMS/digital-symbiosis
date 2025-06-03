import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { chatApi } from '../lib/api/chat';
import { ArrowLeft, CircleDot, Circle, AlertCircle, Star, Paperclip, Check, CheckCheck, File as FileIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ordersApi } from '../lib/api/orders';
import Modal from '../components/ui/Modal';

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useUser();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionedOrders, setActionedOrders] = useState<{ [orderId: string]: string }>({}); // orderId -> статус
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [orderStatuses, setOrderStatuses] = useState<{ [orderId: string]: string }>({});
  const [serviceRating, setServiceRating] = useState(5);
  const [serviceComment, setServiceComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 20;
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const fetchMessages = async (before?: string) => {
    let query = supabase
      .from('messages')
      .select('*, attachments(*)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (before) {
      query = query.lt('created_at', before);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  useEffect(() => {
    if (chatId) {
      (async () => {
        const msgs = await fetchMessages();
        setMessages(msgs.reverse());
        setHasMore(msgs.length === PAGE_SIZE);
      })();
      // Получаем данные чата и собеседника
      (async () => {
        const { data: chat } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .single();
        if (chat) {
          const otherUserId = chat.user1_id === user?.id ? chat.user2_id : chat.user1_id;
          if (otherUserId) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', otherUserId)
              .single();
            setOtherUser(userData);
          }
        }
        setLoading(false);
      })();
    }
  }, [chatId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Загружаем статусы заказов для всех orderId из сообщений с action-кнопками
  useEffect(() => {
    const orderIds = messages
      .filter(m => m.meta?.orderId && (m.meta?.type === 'system_action_client' || m.meta?.type === 'system_action'))
      .map(m => m.meta.orderId);
    if (orderIds.length > 0) {
      Promise.all(orderIds.map(async (orderId) => {
        const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single();
        return { orderId, status: order?.status };
      })).then(results => {
        const statuses: { [orderId: string]: string } = {};
        results.forEach(r => { if (r.orderId && r.status) statuses[r.orderId] = r.status; });
        setOrderStatuses(statuses);
      });
    }
  }, [messages]);

  // Отметить сообщения как прочитанные
  useEffect(() => {
    if (!chatId || !user?.id || messages.length === 0) return;
    const unread = messages.filter(m => m.sender_id !== user.id && (!m.reads || !m.reads.some((r: any) => r.user_id === user.id)));
    if (unread.length === 0) return;
    unread.forEach(async m => {
      await supabase.from('message_reads').upsert({
        message_id: m.id,
        user_id: user.id,
        read_at: new Date().toISOString()
      });
      setReadIds(prev => new Set(prev).add(m.id));
    });
  }, [messages, chatId, user?.id]);

  const send = async () => {
    if (input.trim() && chatId && user?.id) {
      await chatApi.sendMessage(chatId, user.id, input);
      setInput('');
      chatApi.listMessages(chatId).then(setMessages);
    }
  };

  const handleSendComplaint = async () => {
    if (!complaintText.trim() || !chatId || !user?.id || !otherUser?.id) return;
    setComplaintLoading(true);
    await supabase.from('complaints').insert({
      chat_id: chatId,
      from_user_id: user.id,
      to_user_id: otherUser.id,
      message: complaintText.trim(),
    });
    setComplaintLoading(false);
    setShowComplaintModal(false);
    setComplaintText('');
    alert('Жалоба отправлена!');
  };

  // Статус онлайн/не в сети
  let status = 'Не в сети';
  let statusColor = 'text-gray-400';
  let isOnline = false;
  let lastSeen = '';
  if (otherUser?.updated_at) {
    const updated = new Date(otherUser.updated_at);
    const now = new Date();
    const diffMs = now.getTime() - updated.getTime();
    if (diffMs < 5 * 60 * 1000) {
      status = 'Онлайн';
      statusColor = 'text-green-500';
      isOnline = true;
    } else {
      // Формируем строку "был(а) в сети N минут/часов назад"
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 60) {
        lastSeen = `был${otherUser?.gender === 'female' ? 'а' : ''} в сети ${diffMin} мин назад`;
      } else {
        const diffH = Math.floor(diffMin / 60);
        lastSeen = `был${otherUser?.gender === 'female' ? 'а' : ''} в сети ${diffH} ч назад`;
      }
      status = lastSeen;
    }
  }

  useEffect(() => {
    document.body.classList.add('hide-tabbar');
    return () => document.body.classList.remove('hide-tabbar');
  }, []);

  // Функция для загрузки вложения
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !user?.id) return;
    setUploading(true);
    try {
      const filePath = `user-${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase
        .storage
        .from('chat-attachments')
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;
      // Создаём сообщение с вложением
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: '',
          meta: { attachment: true }
        })
        .select()
        .single();
      if (msgError) throw msgError;
      await supabase.from('attachments').insert({
        message_id: message.id,
        url: publicUrl,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        size: file.size
      });
      fetchMessages().then(msgs => setMessages(msgs.reverse()));
    } catch (err) {
      alert('Ошибка загрузки файла');
    }
    setUploading(false);
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldest = messages[0];
    const more = await fetchMessages(oldest?.created_at);
    setMessages(prev => [...more.reverse(), ...prev]);
    if (more.length < PAGE_SIZE) setHasMore(false);
    setLoadingMore(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasMore && !loadingMore) {
      loadMore();
    }
  };

  useEffect(() => {
    if (!otherUser?.id) return;
    const channel = supabase
      .channel('user_status_' + otherUser.id)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${otherUser.id}` },
        (payload) => {
          setOtherUser((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [otherUser?.id]);

  return (
    <div
      className="flex flex-col min-h-screen max-h-screen w-full bg-gray-50 md:max-w-3xl md:mx-auto md:rounded-2xl md:shadow-2xl md:my-6 md:border md:border-gray-200"
      style={{ position: 'relative' }}
    >
      {/* Верхний заголовок */}
      <div className="flex items-center px-4 py-3 border-b bg-white sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mr-3 p-1 rounded hover:bg-gray-100">
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center space-x-3 w-full justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={otherUser?.avatar_url || 'https://images.pexels.com/photos/4926674/pexels-photo-4926674.jpeg?auto=compress&cs=tinysrgb&w=150'}
              alt={otherUser?.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
            <div>
              <div className="font-semibold text-lg text-gray-900 cursor-pointer hover:underline" onClick={() => otherUser?.id && navigate(`/profile/${otherUser.id}`)}>{otherUser?.name}</div>
              <div className="text-xs text-gray-500 flex items-center">
                {isOnline ? (
                  <span className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                ) : (
                  <Circle size={10} className="text-gray-400 mr-1" />
                )}
                {status}
              </div>
            </div>
          </div>
          <button
            className="flex items-center px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium border border-red-200 ml-2"
            onClick={() => setShowComplaintModal(true)}
            title="Пожаловаться"
          >
            <AlertCircle size={16} className="mr-1" /> Пожаловаться
          </button>
        </div>
      </div>

      {/* Сообщения */}
      <div
        className="flex-1 min-h-0 overflow-y-auto p-4 pb-32 max-w-full chat-messages-container"
        style={{ minHeight: 0 }}
        onScroll={handleScroll}
      >
        {loadingMore && (
          <div className="text-center text-xs text-gray-400 mb-2">Загрузка...</div>
        )}
        {messages.map(m => {
          // Системные сообщения с action-кнопками для исполнителя
          if (m.meta?.type === 'system_action' && user?.id && m.meta.role === 'provider' && user.id === m.meta?.providerId) {
            const orderId = m.meta.orderId;
            const status = orderStatuses[orderId] || m.meta.status;
            if (!(status === 'pending' || status === 'accepted' || status === 'in_progress')) return null;
            return (
              <div key={m.id} className="mb-4 text-center">
                <div className="inline-block px-4 py-3 rounded-lg bg-yellow-50 text-yellow-900 font-medium max-w-[90%]">
                  {m.content.split('\n').map((line: string, i: number) => <div key={i}>{line}</div>)}
                  <button
                    className={`px-4 py-1.5 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60`}
                    disabled={actionLoading}
                    onClick={async () => {
                      setActionLoading(true);
                      await ordersApi.updateOrderStatus(orderId, 'accepted');
                      setActionedOrders(prev => ({ ...prev, [orderId]: 'accepted' }));
                      setActionLoading(false);
                    }}
                  >
                    Принять
                  </button>
                  <button
                    className={`px-4 py-1.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60`}
                    disabled={actionLoading}
                    onClick={async () => {
                      setActionLoading(true);
                      await ordersApi.updateOrderStatus(orderId, 'cancelled');
                      setActionedOrders(prev => ({ ...prev, [orderId]: 'cancelled' }));
                      setActionLoading(false);
                    }}
                  >
                    Отклонить
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
            );
          }
          // Обычные системные сообщения
          if (m.meta?.type === 'system') {
            return (
              <div key={m.id} className="mb-4 text-center">
                <div className="inline-block px-4 py-3 rounded-lg bg-gray-200 text-gray-900 font-medium max-w-[90%]">
                  {m.content}
                </div>
                <div className="text-xs text-gray-400 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
            );
          }
          // Action-кнопки для клиента после завершения заказа исполнителем
          if (m.meta?.type === 'system_action_client' && user?.id && m.meta.role === 'client' && user.id !== otherUser?.id) {
            const orderId = m.meta.orderId;
            const status = orderStatuses[orderId] || m.meta.status;
            if (status !== 'completed_by_provider') return null;
            return (
              <div key={m.id} className="mb-4 text-center">
                <div className="inline-block px-4 py-3 rounded-lg bg-yellow-50 text-yellow-900 font-medium max-w-[90%]">
                  {m.content.split('\n').map((line: string, i: number) => <div key={i}>{line}</div>)}
                  <button
                    className={`px-4 py-1.5 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60`}
                    disabled={actionLoading}
                    onClick={async () => {
                      setActionLoading(true);
                      await ordersApi.updateOrderStatus(orderId, 'completed');
                      setActionedOrders(prev => ({ ...prev, [orderId]: 'completed' }));
                      if (chatId) {
                        await chatApi.sendMessage(
                          chatId,
                          user.id,
                          'Заказ подтверждён. Пожалуйста, оцените исполнителя.',
                          { type: 'system', orderId, role: 'client', status: 'completed' }
                        );
                      }
                      setActionLoading(false);
                      // Открыть модалку отзыва
                      setReviewOrderId(orderId);
                      setShowReviewModal(true);
                    }}
                  >
                    Подтвердить выполнение
                  </button>
                  <button
                    className={`px-4 py-1.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 ml-2`}
                    disabled={actionLoading}
                    onClick={async () => {
                      setActionLoading(true);
                      await ordersApi.updateOrderStatus(orderId, 'dispute');
                      setActionedOrders(prev => ({ ...prev, [orderId]: 'dispute' }));
                      if (chatId) {
                        await chatApi.sendMessage(
                          chatId,
                          user.id,
                          'Пользователь вызвал администратора для разрешения вопроса по заказу.',
                          { type: 'system', orderId, role: 'client', status: 'dispute' }
                        );
                      }
                      setActionLoading(false);
                    }}
                  >
                    Позвать администратора
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
            );
          }
          // Обычные сообщения
          return (
            <div key={m.id} className={`mb-2 ${m.sender_id === user?.id ? 'text-right' : 'text-left'}`}
              style={{ maxWidth: '100%' }}>
              <div className={`inline-block px-3 py-2 rounded-lg max-w-[80vw] break-words bg-blue-500 text-white`}
                style={{ boxSizing: 'border-box', wordBreak: 'break-word' }}>
                {m.attachments && m.attachments.length > 0 && m.attachments.map((a: any) => {
                  if (a.type === 'image') {
                    return <img key={a.id} src={a.url} alt="attachment" className="max-w-[200px] max-h-[200px] mb-2 rounded" />;
                  } else {
                    const full = decodeURIComponent(a.url.split('/').pop()?.split('?')[0] || 'Скачать файл');
                    const name = full.includes('-') ? full.substring(full.lastIndexOf('-') + 1) : full;
                    const linkClass = m.sender_id === user?.id
                      ? 'inline-flex items-center gap-1 underline text-white hover:text-blue-200 mr-2'
                      : 'inline-flex items-center gap-1 text-blue-300 underline mr-2';
                    // Форматируем размер файла
                    let sizeStr = '';
                    if (a.size) {
                      if (a.size > 1024 * 1024) {
                        sizeStr = (a.size / (1024 * 1024)).toFixed(2) + ' МБ';
                      } else if (a.size > 1024) {
                        sizeStr = (a.size / 1024).toFixed(1) + ' КБ';
                      } else {
                        sizeStr = a.size + ' Б';
                      }
                    }
                    return (
                      <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        <FileIcon size={16} className={m.sender_id === user?.id ? 'text-white' : 'text-blue-300'} />
                        {name}
                        {sizeStr && <span className="ml-1 text-xs opacity-70">({sizeStr})</span>}
                      </a>
                    );
                  }
                })}
                {m.content}
                {/* Индикатор прочтения для последних сообщений пользователя */}
                {m.sender_id === user?.id && (
                  <span className="ml-2 align-middle text-xs inline-flex items-center">
                    {m.reads && m.reads.length > 1 ? (
                      <span title={m.reads[1]?.read_at ? `Прочитано: ${new Date(m.reads[1].read_at).toLocaleTimeString()}` : 'Прочитано'}>
                        <CheckCheck size={16} className="text-green-500" />
                      </span>
                    ) : (
                      <span title="Доставлено">
                        <Check size={16} className="text-gray-400" />
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">{new Date(m.created_at).toLocaleTimeString()}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Белый фон под формой ввода, чтобы не было "дыры" снизу */}
      <div style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 'calc(env(safe-area-inset-bottom, 0) + 32px)',
        background: '#fff',
        zIndex: 10
      }} />
      <form
        className="bg-white border-t border-gray-200 p-3 flex items-center gap-2 w-full md:max-w-3xl md:mx-auto md:rounded-b-2xl z-20 chat-input-bar shadow-lg rounded-t-2xl rounded-b-2xl mb-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 16px)', borderRadius: '1.25rem' }}
        onSubmit={e => { e.preventDefault(); send(); }}
      >
        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Прикрепить файл"
        >
          <Paperclip size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <input
          className="flex-1 border rounded-2xl px-4 py-2 bg-gray-100 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-base shadow-sm"
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Введите сообщение..."
          autoComplete="off"
          style={{ minHeight: 40, maxHeight: 80, borderRadius: '1.25rem' }}
        />
        <button
          type="submit"
          className="ml-2 px-5 py-2 bg-primary-500 text-white rounded-full font-medium disabled:opacity-50"
          disabled={!input.trim()}
          style={{ minHeight: 40 }}
        >
          Отправить
        </button>
      </form>

      {/* Модалка для жалобы */}
      <Modal isOpen={showComplaintModal} onClose={() => setShowComplaintModal(false)}>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2">Пожаловаться на пользователя</h2>
          <textarea
            className="w-full border rounded p-2 mb-3 min-h-[80px]"
            placeholder="Опишите причину жалобы..."
            value={complaintText}
            onChange={e => setComplaintText(e.target.value)}
            disabled={complaintLoading}
          />
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded bg-gray-200 text-gray-700"
              onClick={() => setShowComplaintModal(false)}
              disabled={complaintLoading}
            >
              Отмена
            </button>
            <button
              className="px-4 py-2 rounded bg-red-500 text-white font-semibold disabled:opacity-60"
              onClick={handleSendComplaint}
              disabled={complaintLoading || !complaintText.trim()}
            >
              {complaintLoading ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Модалка для отзыва */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)}>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2">Оцените исполнителя и услугу</h2>
          <div className="mb-4">
            <div className="font-medium mb-1">Оценка исполнителя</div>
            <div className="flex items-center mb-2">
              {[1,2,3,4,5].map(star => (
                <Star
                  key={star}
                  size={28}
                  className={star <= reviewRating ? 'text-yellow-400 fill-yellow-400 cursor-pointer' : 'text-gray-300 cursor-pointer'}
                  onClick={() => setReviewRating(star)}
                />
              ))}
            </div>
            <textarea
              className="w-full border rounded p-2 mb-3 min-h-[60px]"
              placeholder="Комментарий для исполнителя (необязательно)"
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              disabled={reviewLoading}
            />
          </div>
          <div className="mb-4">
            <div className="font-medium mb-1">Оценка услуги</div>
            <div className="flex items-center mb-2">
              {[1,2,3,4,5].map(star => (
                <Star
                  key={star}
                  size={28}
                  className={star <= serviceRating ? 'text-blue-400 fill-blue-400 cursor-pointer' : 'text-gray-300 cursor-pointer'}
                  onClick={() => setServiceRating(star)}
                />
              ))}
            </div>
            <textarea
              className="w-full border rounded p-2 mb-3 min-h-[60px]"
              placeholder="Комментарий для услуги (необязательно)"
              value={serviceComment}
              onChange={e => setServiceComment(e.target.value)}
              disabled={reviewLoading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded bg-gray-200 text-gray-700"
              onClick={() => setShowReviewModal(false)}
              disabled={reviewLoading}
            >
              Отмена
            </button>
            <button
              className="px-4 py-2 rounded bg-primary-500 text-white font-semibold disabled:opacity-60"
              disabled={reviewLoading || !reviewRating || !serviceRating}
              onClick={async () => {
                if (!reviewOrderId || !user?.id) return;
                setReviewLoading(true);
                // Получаем order для user_id исполнителя и service_id
                const { data: order } = await supabase.from('orders').select('*').eq('id', reviewOrderId).single();
                if (!order) {
                  setReviewLoading(false);
                  return;
                }
                // 1. Оценка исполнителя
                await supabase.from('reviews').insert({
                  order_id: reviewOrderId,
                  user_id: order.provider_id,
                  rating: reviewRating,
                  comment: reviewComment,
                  created_at: new Date().toISOString(),
                });
                // 2. Оценка услуги (user_id = service_id)
                await supabase.from('reviews').insert({
                  order_id: reviewOrderId,
                  user_id: order.service_id, // service_id как user_id для услуги
                  rating: serviceRating,
                  comment: serviceComment,
                  created_at: new Date().toISOString(),
                });
                // Пересчитать средний рейтинг исполнителя
                const { data: allReviews } = await supabase
                  .from('reviews')
                  .select('rating')
                  .eq('user_id', order.provider_id);
                if (allReviews && allReviews.length > 0) {
                  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
                  await supabase.from('users').update({ rating: avgRating }).eq('id', order.provider_id);
                }
                // После добавления отзывов обновляем страницу
                window.location.reload();
                setShowReviewModal(false);
                setReviewComment('');
                setReviewRating(5);
                setServiceComment('');
                setServiceRating(5);
                setReviewOrderId(null);
                setReviewLoading(false);
                if (chatId) {
                  await chatApi.sendMessage(
                    chatId,
                    user.id,
                    'Спасибо за ваш отзыв!',
                    { type: 'system', orderId: reviewOrderId, role: 'client', status: 'reviewed' }
                  );
                }
              }}
            >
              Отправить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 