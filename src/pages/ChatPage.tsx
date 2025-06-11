import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { chatApi } from "../lib/api/chat";
import {
  ArrowLeft,
  CircleDot,
  Circle,
  AlertCircle,
  Star,
  Paperclip,
  Check,
  CheckCheck,
  File as FileIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { ordersApi } from "../lib/api/orders";
import Modal from "../components/ui/Modal";
import { motion, AnimatePresence } from "framer-motion";

// Для TS: расширяем window для отладки
declare global {
  interface Window {
    __DEBUG_CHAT_PAGE?: any;
  }
}

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useUser();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionedOrders, setActionedOrders] = useState<{
    [orderId: string]: string;
  }>({}); // orderId -> статус
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [orderStatuses, setOrderStatuses] = useState<{
    [orderId: string]: string;
  }>({});
  const [serviceRating, setServiceRating] = useState(5);
  const [serviceComment, setServiceComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 20;
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const fetchMessages = async (before?: string) => {
    let query = supabase
      .from("messages")
      .select("*, attachments(*)")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (before) {
      query = query.lt("created_at", before);
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
          .from("chats")
          .select("*")
          .eq("id", chatId)
          .single();
        if (chat) {
          const otherUserId =
            chat.user1_id === user?.id ? chat.user2_id : chat.user1_id;
          if (otherUserId) {
            const { data: userData } = await supabase
              .from("users")
              .select("*")
              .eq("id", otherUserId)
              .single();
            setOtherUser(userData);
          }
        }
        setLoading(false);
      })();
    }
  }, [chatId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Загружаем статусы заказов для всех orderId из сообщений с action-кнопками
  useEffect(() => {
    const orderIds = messages
      .filter(
        (m) =>
          m.meta?.orderId &&
          (m.meta?.type === "system_action_client" ||
            m.meta?.type === "system_action"),
      )
      .map((m) => m.meta.orderId);
    if (orderIds.length > 0) {
      Promise.all(
        orderIds.map(async (orderId) => {
          const { data: order } = await supabase
            .from("orders")
            .select("status")
            .eq("id", orderId)
            .single();
          return { orderId, status: order?.status };
        }),
      ).then((results) => {
        const statuses: { [orderId: string]: string } = {};
        results.forEach((r) => {
          if (r.orderId && r.status) statuses[r.orderId] = r.status;
        });
        setOrderStatuses(statuses);
      });
    }
  }, [messages]);

  // Отметить сообщения как прочитанные
  useEffect(() => {
    if (!chatId || !user?.id || messages.length === 0) return;
    const unread = messages.filter(
      (m) =>
        m.sender_id !== user.id &&
        (!m.reads || !m.reads.some((r: any) => r.user_id === user.id)),
    );
    if (unread.length === 0) return;
    unread.forEach(async (m) => {
      await supabase.from("message_reads").upsert({
        message_id: m.id,
        user_id: user.id,
        read_at: new Date().toISOString(),
      });
      setReadIds((prev) => new Set(prev).add(m.id));
    });
  }, [messages, chatId, user?.id]);

  const send = async () => {
    if (input.trim() && chatId && user?.id) {
      await chatApi.sendMessage(chatId, user.id, input);
      setInput("");
      chatApi.listMessages(chatId).then(setMessages);
    }
  };

  const handleSendComplaint = async () => {
    if (!complaintText.trim() || !chatId || !user?.id || !otherUser?.id) return;
    setComplaintLoading(true);
    await supabase.from("complaints").insert({
      chat_id: chatId,
      from_user_id: user.id,
      to_user_id: otherUser.id,
      message: complaintText.trim(),
    });
    setComplaintLoading(false);
    setShowComplaintModal(false);
    setComplaintText("");
    alert("Жалоба отправлена!");
  };

  // Статус онлайн/не в сети
  let status = "Не в сети";
  let statusColor = "text-gray-400";
  let isOnline = false;
  let lastSeen = "";
  if (otherUser?.updated_at) {
    const updated = new Date(otherUser.updated_at);
    const now = new Date();
    const diffMs = now.getTime() - updated.getTime();
    if (diffMs < 5 * 60 * 1000) {
      status = "Онлайн";
      statusColor = "text-green-500";
      isOnline = true;
    } else {
      // Формируем строку "был(а) в сети N минут/часов назад"
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 60) {
        lastSeen = `был${otherUser?.gender === "female" ? "а" : ""} в сети ${diffMin} мин назад`;
      } else {
        const diffH = Math.floor(diffMin / 60);
        lastSeen = `был${otherUser?.gender === "female" ? "а" : ""} в сети ${diffH} ч назад`;
      }
      status = lastSeen;
    }
  }

  // Функция для загрузки вложения
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !user?.id) return;
    setUploading(true);
    try {
      const filePath = `user-${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;
      // Создаём сообщение с вложением
      const { data: message, error: msgError } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: "",
          meta: { attachment: true },
        })
        .select()
        .single();
      if (msgError) throw msgError;
      await supabase.from("attachments").insert({
        message_id: message.id,
        url: publicUrl,
        type: file.type.startsWith("image/") ? "image" : "file",
        size: file.size,
      });
      fetchMessages().then((msgs) => setMessages(msgs.reverse()));
    } catch (err) {
      alert("Ошибка загрузки файла");
    }
    setUploading(false);
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldest = messages[0];
    const more = await fetchMessages(oldest?.created_at);
    setMessages((prev) => [...more.reverse(), ...prev]);
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
      .channel("user_status_" + otherUser.id)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${otherUser.id}`,
        },
        (payload) => {
          setOtherUser((prev: any) => ({ ...prev, ...payload.new }));
        },
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [otherUser?.id]);

  // Отладочный вывод состояния
  console.log('DEBUG ChatPage', { user, chatId, loading, otherUser, messages });

  // Глобальный отладочный лог
  if (typeof window !== 'undefined') {
    window.__DEBUG_CHAT_PAGE = {
      user,
      chatId,
      loading,
      otherUser,
      messagesLength: messages.length,
      pathname: window.location.pathname,
      href: window.location.href,
      bodyClass: document.body.className,
    };
    console.log('DEBUG: ChatPage mount', window.__DEBUG_CHAT_PAGE);
  }

  if (loading) {
    console.log('DEBUG: return loading', { loading, user, chatId, otherUser, pathname: window.location.pathname });
    return (
      <div style={{background:'#ffb',padding:8}}>
        <b>DEBUG: return loading</b>
        <pre style={{fontSize:12}}>{JSON.stringify({ loading, user, chatId, otherUser, pathname: window.location.pathname }, null, 2)}</pre>
      </div>
    );
  }
  if (!user) {
    console.log('DEBUG: return no user', { loading, user, chatId, otherUser, pathname: window.location.pathname });
    return (
      <div style={{background:'#fbb',padding:8}}>
        <b>DEBUG: return no user</b>
        <pre style={{fontSize:12}}>{JSON.stringify({ loading, user, chatId, otherUser, pathname: window.location.pathname }, null, 2)}</pre>
      </div>
    );
  }
  if (!chatId) {
    console.log('DEBUG: return no chatId', { loading, user, chatId, otherUser, pathname: window.location.pathname });
    return (
      <div style={{background:'#bbf',padding:8}}>
        <b>DEBUG: return no chatId</b>
        <pre style={{fontSize:12}}>{JSON.stringify({ loading, user, chatId, otherUser, pathname: window.location.pathname }, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white">
      {/* Визуальный отладочный блок */}
      <div style={{background:'#efe',padding:8,border:'1px solid #0a0',marginBottom:8}}>
        <b>DEBUG: ChatPage render</b>
        <pre style={{fontSize:12}}>{JSON.stringify({ user, chatId, loading, otherUser, messagesLength: messages.length, pathname: window.location.pathname, href: window.location.href, bodyClass: document.body.className }, null, 2)}</pre>
      </div>
      {/* Header */}
      <div className="sticky top-0 z-20 w-full bg-gradient-to-r from-cyan-100 via-blue-50 to-white shadow flex items-center px-4 py-3 gap-3">
        <button
          onClick={() => navigate(-1)}
          className="mr-2 p-1 rounded hover:bg-gray-100"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-blue-200 bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center overflow-hidden relative">
            {otherUser?.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <CircleDot size={32} className="text-blue-200" />
            )}
            {isOnline && (
              <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base text-gray-900">
              {otherUser?.name || "Пользователь"}
            </span>
            <span
              className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400"}`}
            >
              {status}
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="flex items-center px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium border border-red-200"
            onClick={() => setShowComplaintModal(true)}
            title="Пожаловаться"
          >
            <AlertCircle size={16} className="mr-1" /> Пожаловаться
          </button>
        </div>
      </div>

      {/* Сообщения */}
      <div
        className="flex-1 overflow-y-auto px-2 py-4"
        style={{ maxHeight: "calc(100vh - 140px)" }}
      >
        <AnimatePresence initial={false}>
          <div className="flex flex-col gap-3">
            {messages.map((msg, idx) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{
                    duration: 0.25,
                    delay: 0.01 * (messages.length - idx),
                  }}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-card relative ${isOwn ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"}`}
                  >
                    {/* Вложения */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mb-1">
                        {msg.attachments[0].type === "image" ? (
                          <img
                            src={msg.attachments[0].url}
                            alt="Фото"
                            className="rounded-lg max-w-[180px] max-h-[180px] mb-1"
                          />
                        ) : (
                          <a
                            href={msg.attachments[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-200 hover:underline"
                          >
                            <FileIcon size={18} />
                            <span className="truncate max-w-[120px]">
                              {decodeURIComponent(
                                msg.attachments[0].url
                                  .split("/")
                                  .pop()
                                  ?.split("?")[0] || "Файл",
                              )}
                            </span>
                          </a>
                        )}
                      </div>
                    )}
                    {/* Текст сообщения */}
                    {msg.content && (
                      <div className="whitespace-pre-line break-words text-base">
                        {msg.content}
                      </div>
                    )}
                    {/* Время */}
                    <div
                      className={`text-xs mt-1 ${isOwn ? "text-cyan-100/80" : "text-gray-400"}`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </AnimatePresence>
      </div>

      {/* Современная панель ввода сообщения (по мотивам Figma) */}
      <div className="chat-input-bar-container">
        <form
          className="chat-input-bar"
          onSubmit={e => { e.preventDefault(); send(); }}
        >
          <button
            type="button"
            className="chat-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Прикрепить файл"
            disabled={uploading}
          >
            <Paperclip size={22} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Введите сообщение..."
            autoComplete="off"
            disabled={uploading}
            style={{ minHeight: 40, maxHeight: 80, borderRadius: 9999 }}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!input.trim() || uploading}
            title="Отправить"
            style={{ minHeight: 40, minWidth: 40, borderRadius: '50%' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
            </svg>
          </button>
        </form>
        <style>{`
          .chat-input-bar-container {
            position: fixed;
            left: 0; right: 0; bottom: 0;
            width: 100vw;
            background: #fff;
            z-index: 50;
            box-shadow: 0 4px 24px 0 rgba(0,160,255,0.07);
            padding-bottom: env(safe-area-inset-bottom, 0);
          }
          .chat-input-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            border-top: 1px solid #e5e7eb;
            max-width: 600px;
            margin: 0 auto;
          }
          .chat-attach-btn, .chat-send-btn {
            background: none;
            border: none;
            padding: 8px;
            border-radius: 50%;
            transition: background 0.2s;
            color: #06b6d4;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .chat-attach-btn:hover, .chat-send-btn:hover {
            background: #f0f9ff;
          }
          .chat-input {
            flex: 1;
            border: none;
            outline: none;
            background: #f3f4f6;
            border-radius: 9999px;
            padding: 10px 16px;
            font-size: 16px;
            min-width: 0;
          }
          @media (max-width: 768px) {
            .chat-input-bar {
              max-width: 100vw;
              border-radius: 0 !important;
            }
            .chat-input-bar-container {
              width: 100vw;
              max-width: 100vw;
              border-radius: 0 !important;
            }
          }
        `}</style>
      </div>

      {/* Модалка для жалобы */}
      <Modal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2">
            Пожаловаться на пользователя
          </h2>
          <textarea
            className="w-full border rounded p-2 mb-3 min-h-[80px]"
            placeholder="Опишите причину жалобы..."
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
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
              {complaintLoading ? "Отправка..." : "Отправить"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Модалка для отзыва */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)}>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2">
            Оцените исполнителя и услугу
          </h2>
          <div className="mb-4">
            <div className="font-medium mb-1">Оценка исполнителя</div>
            <div className="flex items-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={28}
                  className={
                    star <= reviewRating
                      ? "text-yellow-400 fill-yellow-400 cursor-pointer"
                      : "text-gray-300 cursor-pointer"
                  }
                  onClick={() => setReviewRating(star)}
                />
              ))}
            </div>
            <textarea
              className="w-full border rounded p-2 mb-3 min-h-[60px]"
              placeholder="Комментарий для исполнителя (необязательно)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              disabled={reviewLoading}
            />
          </div>
          <div className="mb-4">
            <div className="font-medium mb-1">Оценка услуги</div>
            <div className="flex items-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={28}
                  className={
                    star <= serviceRating
                      ? "text-blue-400 fill-blue-400 cursor-pointer"
                      : "text-gray-300 cursor-pointer"
                  }
                  onClick={() => setServiceRating(star)}
                />
              ))}
            </div>
            <textarea
              className="w-full border rounded p-2 mb-3 min-h-[60px]"
              placeholder="Комментарий для услуги (необязательно)"
              value={serviceComment}
              onChange={(e) => setServiceComment(e.target.value)}
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
                const { data: order } = await supabase
                  .from("orders")
                  .select("*")
                  .eq("id", reviewOrderId)
                  .single();
                if (!order) {
                  setReviewLoading(false);
                  return;
                }
                // 1. Оценка исполнителя
                await supabase.from("reviews").insert({
                  order_id: reviewOrderId,
                  user_id: order.provider_id,
                  rating: reviewRating,
                  comment: reviewComment,
                  created_at: new Date().toISOString(),
                });
                // 2. Оценка услуги (user_id = service_id)
                await supabase.from("reviews").insert({
                  order_id: reviewOrderId,
                  user_id: order.service_id, // service_id как user_id для услуги
                  rating: serviceRating,
                  comment: serviceComment,
                  created_at: new Date().toISOString(),
                });
                // Пересчитать средний рейтинг исполнителя
                const { data: allReviews } = await supabase
                  .from("reviews")
                  .select("rating")
                  .eq("user_id", order.provider_id);
                if (allReviews && allReviews.length > 0) {
                  const avgRating =
                    allReviews.reduce((sum, r) => sum + r.rating, 0) /
                    allReviews.length;
                  await supabase
                    .from("users")
                    .update({ rating: avgRating })
                    .eq("id", order.provider_id);
                }
                // После добавления отзывов обновляем страницу
                window.location.reload();
                setShowReviewModal(false);
                setReviewComment("");
                setReviewRating(5);
                setServiceComment("");
                setServiceRating(5);
                setReviewOrderId(null);
                setReviewLoading(false);
                if (chatId) {
                  await chatApi.sendMessage(
                    chatId,
                    user.id,
                    "Спасибо за ваш отзыв!",
                    {
                      type: "system",
                      orderId: reviewOrderId,
                      role: "client",
                      status: "reviewed",
                    },
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
