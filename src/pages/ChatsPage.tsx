import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { supabase } from "../lib/supabase";
import {
  MessageCircle,
  File as FileIcon,
  Image as ImageIcon,
} from "lucide-react";
import Button from "../components/ui/Button";
import { motion } from "framer-motion";
import { BadgeCheck, Circle } from "lucide-react";
import { Avatar } from "../components/ui/Avatar";

// Типы для чата и пользователя
import type { Database } from "../types/supabase";
type Chat = Database["public"]["Tables"]["chats"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];

const formatTime = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
};

const ChatsPage: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [chats, setChats] = useState<
    (Chat & { otherUser: User | null; lastMessage: Message | null })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      if (!user?.id) return;
      setLoading(true);
      // Получаем все чаты, где участвует пользователь
      const { data: chatsData, error } = await supabase
        .from("chats")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) {
        setLoading(false);
        return;
      }
      // Для каждого чата получаем собеседника и последнее сообщение
      const chatDetails = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const otherUserId =
            chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
          let otherUser: User | null = null;
          let lastMessage: Message | null = null;
          if (otherUserId) {
            const { data: userData } = await supabase
              .from("users")
              .select("*")
              .eq("id", otherUserId)
              .single();
            otherUser = userData;
          }
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("*, attachments(*)")
            .eq("chat_id", chat.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          lastMessage = lastMsg || null;
          return { ...chat, otherUser, lastMessage };
        }),
      );
      setChats(chatDetails);
      setLoading(false);
    };
    fetchChats();
  }, [user?.id]);

  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-4 w-full max-w-2xl mx-auto pb-20 sm:pb-8 bg-gradient-to-br from-cyan-50 via-blue-50 to-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700">
        <MessageCircle size={28} /> Чаты
      </h1>
      {chats.length === 0 ? (
        <div className="text-gray-500 text-center mt-16">
          Нет активных чатов
        </div>
      ) : (
        <ul className="space-y-4">
          {chats.map((chat) => {
            const lastMsg = chat.lastMessage;
            const unread =
              lastMsg && !lastMsg.read && lastMsg.sender_id !== user?.id;
            return (
              <motion.li
                key={chat.id}
                whileHover={{
                  y: -2,
                  scale: 1.01,
                  boxShadow: "0 6px 32px 0 rgba(0, 160, 255, 0.08)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className={`group p-4 rounded-2xl border border-blue-100 bg-white shadow-card flex items-center cursor-pointer hover:bg-blue-50 transition min-w-0 relative ${unread ? "ring-2 ring-blue-200" : ""}`}
                onClick={() => navigate(`/chat/${chat.id}`)}
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 border-2 border-blue-200 flex items-center justify-center mr-4 overflow-hidden relative">
                  <Avatar src={chat.otherUser?.avatar_url ?? ''} name={chat.otherUser?.name ?? ''} size={56} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-base text-gray-900 truncate max-w-[160px] sm:max-w-[220px]">
                      {chat.otherUser?.name || "Пользователь"}
                    </span>
                    {/* Badge "Непрочитанные" */}
                    {unread && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold animate-pulse">
                        Новое
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 truncate max-w-[220px]">
                    {/* Иконка типа сообщения */}
                    {lastMsg &&
                      lastMsg.attachments &&
                      lastMsg.attachments.length > 0 ? (
                      lastMsg.attachments[0].type === "image" ? (
                        <ImageIcon size={16} className="text-blue-400 mr-1" />
                      ) : (
                        <FileIcon size={16} className="text-blue-400 mr-1" />
                      )
                    ) : null}
                    <span className="truncate">
                      {lastMsg &&
                        lastMsg.attachments &&
                        lastMsg.attachments.length > 0
                        ? lastMsg.attachments[0].type === "image"
                          ? "Фото"
                          : "Файл"
                        : lastMsg && lastMsg.content
                          ? lastMsg.content
                          : "Нет сообщений"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end ml-4 min-w-[60px]">
                  <span className="text-xs text-gray-400 mb-1">
                    {formatTime(lastMsg?.created_at)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-w-[70px] sm:min-w-[90px] px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chat/${chat.id}`);
                    }}
                  >
                    Открыть
                  </Button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ChatsPage;
