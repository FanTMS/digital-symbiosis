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
import Button from "../components/ui/Button";

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
  const [complaintFile, setComplaintFile] = useState<File | null>(null);
  const [complaintFilePreview, setComplaintFilePreview] = useState<string | null>(null);
  const complaintFileInputRef = useRef<HTMLInputElement>(null);
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [chatFilePreview, setChatFilePreview] = useState<string | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!input.trim() && !chatFile) || !chatId || !user?.id) return;
    setUploading(true);
    let attachmentUrl = null;
    let attachmentType = null;
    let messageId = null;
    try {
      if (chatFile) {
        const filePath = `user-${user.id}/${Date.now()}-${chatFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("chat-attachments")
          .upload(filePath, chatFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("chat-attachments")
          .getPublicUrl(filePath);
        attachmentUrl = publicUrlData?.publicUrl;
        attachmentType = chatFile.type.startsWith("image/") ? "image" : "file";
      }
      // Создаём сообщение
      const { data: message, error: msgError } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: input.trim(),
          meta: attachmentUrl ? { attachment: true } : {},
        })
        .select()
        .single();
      if (msgError) throw msgError;
      messageId = message.id;
      // Если есть вложение — добавляем attachment
      if (attachmentUrl && messageId) {
        await supabase.from("attachments").insert({
          message_id: messageId,
          url: attachmentUrl,
          type: attachmentType,
          size: chatFile?.size,
        });
      }
      fetchMessages().then((msgs) => setMessages(msgs.reverse()));
      setInput("");
      setChatFile(null);
      setChatFilePreview(null);
    } catch (err) {
      alert("Ошибка отправки сообщения");
    }
    setUploading(false);
  };

  const handleSendComplaint = async () => {
    if (!complaintText.trim() || !chatId || !user?.id || !otherUser?.id) return;
    setComplaintLoading(true);
    let attachmentUrl = null;
    let attachmentType = null;
    if (complaintFile) {
      try {
        const filePath = `complaints/user-${user.id}/${Date.now()}-${complaintFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("chat-attachments")
          .upload(filePath, complaintFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("chat-attachments")
          .getPublicUrl(filePath);
        attachmentUrl = publicUrlData?.publicUrl;
        attachmentType = complaintFile.type.startsWith("image/") ? "image" : "file";
      } catch (err) {
        alert("Ошибка загрузки файла для жалобы");
        setComplaintLoading(false);
        return;
      }
    }
    await supabase.from("complaints").insert({
      chat_id: chatId,
      from_user_id: user.id,
      to_user_id: otherUser.id,
      message: complaintText.trim(),
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
    });
    setComplaintLoading(false);
    setShowComplaintModal(false);
    setComplaintText("");
    setComplaintFile(null);
    setComplaintFilePreview(null);
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setChatFile(file);
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setChatFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setChatFilePreview(null);
    }
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

  useEffect(() => {
    document.body.classList.add('hide-tabbar');
    return () => {
      document.body.classList.remove('hide-tabbar');
    };
  }, []);

  if (loading) {
    return null;
  }
  if (!user) {
    return null;
  }
  if (!chatId) {
    return null;
  }
  return (
    <div className="chat-redesign-root">
      {/* Header */}
      <header className="chat-header">
        <button className="chat-header-back" onClick={() => navigate(-1)}>
          <svg width="24" height="24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="chat-header-avatar">
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} alt={otherUser.name} />
          ) : (
            <div className="chat-header-avatar-placeholder">{otherUser?.name?.[0] || '?'}</div>
          )}
        </div>
        <div className="chat-header-info">
          <div className="chat-header-name">{otherUser?.name || 'Пользователь'}</div>
          <div className="chat-header-status">{isOnline ? 'Онлайн' : status}</div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-header-action" onClick={() => setShowComplaintModal(true)} title="Пожаловаться">
            <svg width="20" height="20" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="9" /><line x1="10" y1="6" x2="10" y2="10" /><circle cx="10" cy="14" r="1" /></svg>
          </button>
        </div>
      </header>

      {/* Сообщения */}
      <main className="chat-messages-list pb-20 sm:pb-24" id="chat-messages-list">
        {messages.map((msg, idx) => {
          const isOwn = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`chat-message-row ${isOwn ? 'own' : 'other'}`}>
              <div className={`chat-message-bubble ${isOwn ? 'own' : 'other'}`}>
                {/* Вложения */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="chat-message-attachment">
                    {msg.attachments[0].type === "image" ? (
                      <img src={msg.attachments[0].url} alt="Фото" className="chat-message-img" />
                    ) : (
                      <a href={msg.attachments[0].url} target="_blank" rel="noopener noreferrer" className="chat-message-file">
                        <svg width="18" height="18" fill="none" stroke="#06b6d4" strokeWidth="2"><rect x="3" y="3" width="12" height="12" rx="2" /><path d="M7 7h6M7 11h6M7 15h6" /></svg>
                        <span>{decodeURIComponent(msg.attachments[0].url.split("/").pop()?.split("?")[0] || "Файл")}</span>
                      </a>
                    )}
                  </div>
                )}
                {/* Текст сообщения */}
                {msg.content && (
                  <div className="chat-message-text">{msg.content}</div>
                )}
                {/* Время */}
                <div className="chat-message-time">{new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Панель ввода */}
      <div className="chat-input-bar-container">
        <form className="chat-input-bar" onSubmit={e => { e.preventDefault(); send(); }}>
          <button type="button" className="chat-attach-btn" onClick={() => chatFileInputRef.current?.click()} title="Прикрепить файл" disabled={uploading}>
            <svg width="22" height="22" fill="none" stroke="#06b6d4" strokeWidth="2"><circle cx="11" cy="11" r="9" /><path d="M7 13V9a4 4 0 018 0v4a4 4 0 01-8 0V9" /></svg>
          </button>
          <input type="file" ref={chatFileInputRef} className="hidden" onChange={handleFileChange} disabled={uploading} />
          {/* Предпросмотр выбранного файла */}
          {chatFile && (
            <span className="inline-flex items-center ml-2">
              {chatFile.type.startsWith("image/") && chatFilePreview ? (
                <img src={chatFilePreview} alt="preview" className="w-12 h-12 object-cover rounded border mr-2" />
              ) : (
                <span className="text-sm text-gray-700 mr-2">{chatFile.name}</span>
              )}
              <button
                type="button"
                className="ml-1 text-red-500 hover:text-red-700 text-lg"
                onClick={() => { setChatFile(null); setChatFilePreview(null); }}
                title="Удалить файл"
                disabled={uploading}
              >
                ×
              </button>
            </span>
          )}
          <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Введите сообщение..." autoComplete="off" disabled={uploading} style={{ minHeight: 40, maxHeight: 80, borderRadius: 9999 }} />
          <button type="submit" className="chat-send-btn" disabled={(!input.trim() && !chatFile) || uploading} title="Отправить" style={{ minHeight: 40, minWidth: 40, borderRadius: '50%' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="#06b6d4" /></svg>
          </button>
        </form>
      </div>

      {/* Модалка для жалобы */}
      <Modal isOpen={showComplaintModal} onClose={() => setShowComplaintModal(false)}>
        <h2 className="text-xl font-bold mb-4">Пожаловаться на пользователя</h2>
        <textarea
          className="w-full border rounded p-2 mb-3 min-h-[80px]"
          placeholder="Опишите причину жалобы..."
          value={complaintText}
          onChange={(e) => setComplaintText(e.target.value)}
          disabled={complaintLoading}
          required
        />
        <div className="mb-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => complaintFileInputRef.current?.click()}
            disabled={complaintLoading}
          >
            {complaintFile ? "Заменить файл" : "Прикрепить файл/скриншот"}
          </Button>
          <input
            type="file"
            ref={complaintFileInputRef}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
            onChange={e => {
              const file = e.target.files?.[0] || null;
              setComplaintFile(file);
              if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = ev => setComplaintFilePreview(ev.target?.result as string);
                reader.readAsDataURL(file);
              } else {
                setComplaintFilePreview(null);
              }
            }}
            disabled={complaintLoading}
          />
          {complaintFile && (
            <span className="inline-flex items-center ml-2">
              {complaintFile.type.startsWith("image/") && complaintFilePreview ? (
                <img src={complaintFilePreview} alt="preview" className="w-16 h-16 object-cover rounded border mr-2" />
              ) : (
                <span className="text-sm text-gray-700 mr-2">{complaintFile.name}</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-1 text-red-500 hover:text-red-700 text-lg"
                onClick={() => { setComplaintFile(null); setComplaintFilePreview(null); }}
                title="Удалить файл"
                disabled={complaintLoading}
              >
                ×
              </Button>
            </span>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setShowComplaintModal(false)}
            disabled={complaintLoading}
          >
            Отмена
          </Button>
          <Button
            variant="danger"
            onClick={handleSendComplaint}
            disabled={complaintLoading || !complaintText.trim()}
            isLoading={complaintLoading}
          >
            {complaintLoading ? "Отправка..." : "Отправить"}
          </Button>
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
                if (order.status !== "completed") {
                  alert("Оставлять отзыв можно только после завершения заказа.");
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

      {/* Стилизация страницы чата */}
      <style>{`
        .chat-redesign-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 16px 12px 16px;
          background: #fff;
          box-shadow: 0 2px 12px 0 rgba(0,160,255,0.04);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .chat-header-back {
          background: none;
          border: none;
          padding: 6px;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .chat-header-back:hover {
          background: #e0f2fe;
        }
        .chat-header-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          background: #e0f2fe;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #bae6fd;
        }
        .chat-header-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .chat-header-avatar-placeholder {
          font-size: 22px; color: #06b6d4; font-weight: bold;
        }
        .chat-header-info {
          flex: 1;
          display: flex; flex-direction: column;
        }
        .chat-header-name {
          font-weight: 600; font-size: 17px; color: #0f172a;
        }
        .chat-header-status {
          font-size: 13px; color: #38bdf8; font-weight: 500;
        }
        .chat-header-actions {
          display: flex; gap: 8px;
        }
        .chat-header-action {
          background: none; border: none; padding: 6px; border-radius: 50%; transition: background 0.2s;
        }
        .chat-header-action:hover {
          background: #fee2e2;
        }
        .chat-messages-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px 0 90px 0;
          display: flex; flex-direction: column;
          gap: 10px;
        }
        .chat-message-row {
          display: flex;
          align-items: flex-end;
          margin: 0 16px;
        }
        .chat-message-row.own {
          justify-content: flex-end;
        }
        .chat-message-row.other {
          justify-content: flex-start;
        }
        .chat-message-bubble {
          max-width: 75vw;
          padding: 12px 16px;
          border-radius: 18px;
          box-shadow: 0 2px 8px 0 rgba(0,160,255,0.06);
          font-size: 16px;
          position: relative;
          display: flex;
          flex-direction: column;
          background: #fff;
        }
        .chat-message-bubble.own {
          background: linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%);
          color: #fff;
          border-bottom-right-radius: 6px;
        }
        .chat-message-bubble.other {
          background: #f1f5f9;
          color: #0f172a;
          border-bottom-left-radius: 6px;
        }
        .chat-message-attachment {
          margin-bottom: 6px;
        }
        .chat-message-img {
          max-width: 180px; max-height: 180px; border-radius: 10px; display: block;
        }
        .chat-message-file {
          display: flex; align-items: center; gap: 6px; color: #06b6d4; text-decoration: underline;
        }
        .chat-message-text {
          white-space: pre-line; word-break: break-word;
        }
        .chat-message-time {
          font-size: 12px; color: #bae6fd; margin-top: 6px; align-self: flex-end;
        }
        .chat-message-bubble.other .chat-message-time {
          color: #94a3b8;
        }
        .chat-input-bar-container {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          z-index: 50;
          padding: 12px 16px;
          padding-bottom: calc(48px + env(safe-area-inset-bottom, 0));
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
          border: 1.5px solid #06b6d4;
          outline: none;
          background: #f3f4f6;
          border-radius: 9999px;
          padding: 10px 16px;
          font-size: 16px;
          min-width: 0;
        }
        @media (max-width: 768px) {
          .chat-header, .chat-messages-list, .chat-input-bar {
            padding-left: 6px; padding-right: 6px;
          }
          .chat-input-bar {
            max-width: 100vw;
            border-radius: 0 !important;
          }
          .chat-input-bar-container {
            width: 100vw;
            max-width: 100vw;
            border-radius: 0 !important;
          }
          .chat-message-bubble {
            max-width: 90vw;
          }
          .chat-header-avatar {
            width: 40px;
            height: 40px;
            min-width: 40px;
            min-height: 40px;
          }
          .chat-header-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
        }
        html, body {
          background: #fff !important;
          color: #111 !important;
        }
        @media (prefers-color-scheme: dark) {
          html, body {
            background: #fff !important;
            color: #111 !important;
          }
        }
      `}</style>
    </div>
  );
}
