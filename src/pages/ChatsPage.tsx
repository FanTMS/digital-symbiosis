import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { supabase } from "../lib/supabase";
import {
  MessageCircle,
  File as FileIcon,
  Image as ImageIcon,
  ArrowRight,
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

  if (loading) {
    return (
      <div className="p-4 w-full max-w-2xl mx-auto pb-20 sm:pb-8 bg-gradient-to-br from-cyan-50 via-blue-50 to-white min-h-screen">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto pb-20 sm:pb-8 bg-gradient-to-br from-cyan-50 via-blue-50 to-white min-h-screen">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg">
            <MessageCircle size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Чаты</h1>
        </div>
        <p className="text-gray-600 ml-16">Ваши сообщения и переписки</p>
      </motion.div>

      {chats.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-12 text-center shadow-lg border border-gray-100"
        >
          <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle size={48} className="text-primary-500" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">Нет активных чатов</h3>
          <p className="text-gray-600">
            Начните общение с пользователями платформы
          </p>
        </motion.div>
      ) : (
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {chats.map((chat, index) => {
            const lastMsg = chat.lastMessage;
            const unread =
              lastMsg && !lastMsg.read && lastMsg.sender_id !== user?.id;
            return (
              <motion.li
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  y: -4,
                  scale: 1.02,
                }}
                whileTap={{ scale: 0.98 }}
                className={`group relative bg-white rounded-3xl shadow-lg border-2 flex items-center cursor-pointer transition-all overflow-hidden ${
                  unread ? "border-primary-300 ring-2 ring-primary-100" : "border-gray-100 hover:border-primary-200"
                }`}
                onClick={() => navigate(`/chat/${chat.id}`)}
              >
                {/* Gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 to-accent-500/0 group-hover:from-primary-500/5 group-hover:to-accent-500/5 transition-all duration-300" />
                
                <div className="relative z-10 flex items-center w-full p-4">
                  <div className="flex-shrink-0 relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 p-0.5 ${unread ? 'ring-2 ring-primary-300' : ''}`}>
                      <div className="w-full h-full rounded-2xl bg-white p-0.5">
                        <Avatar src={chat.otherUser?.avatar_url ?? ''} name={chat.otherUser?.name ?? ''} size={60} className="rounded-2xl" />
                      </div>
                    </div>
                    {unread && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 ml-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-gray-900 truncate">
                        {chat.otherUser?.name || "Пользователь"}
                      </span>
                      {unread && (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold shadow-md">
                          Новое
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {lastMsg &&
                        lastMsg.attachments &&
                        lastMsg.attachments.length > 0 ? (
                        lastMsg.attachments[0].type === "image" ? (
                          <div className="flex items-center gap-1">
                            <ImageIcon size={16} className="text-primary-500" />
                            <span className="truncate">Фото</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <FileIcon size={16} className="text-primary-500" />
                            <span className="truncate">Файл</span>
                          </div>
                        )
                      ) : (
                        <span className="truncate">
                          {lastMsg && lastMsg.content
                            ? lastMsg.content
                            : "Нет сообщений"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end ml-4 min-w-[80px]">
                    <span className="text-xs text-gray-400 mb-2 font-medium">
                      {formatTime(lastMsg?.created_at)}
                    </span>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-gradient-to-r from-primary-500 to-primary-600 shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/chat/${chat.id}`);
                        }}
                        rightIcon={<ArrowRight size={16} />}
                      >
                        Открыть
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
};

export default ChatsPage;
