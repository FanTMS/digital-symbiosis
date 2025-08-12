import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  User,
  ShoppingBag,
  FileText,
  Users,
  Bell,
  MessageCircle,
  Shield,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "../../contexts/UserContext";
import { supabase } from "../../lib/supabase";

const NavigationBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [hidden, setHidden] = useState(false);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  useEffect(() => {
    const check = () =>
      setHidden(document.body.classList.contains("hide-tabbar"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  if (hidden) return null;

  const navItems = [
    { path: "/", icon: Home, label: "Главная" },
    { path: "/services", icon: ShoppingBag, label: "Услуги" },
    { path: "/chats", icon: MessageCircle, label: "Чаты" },
    { path: "/challenges", icon: Star, label: "Челленджи" },
    { path: "/profile", icon: User, label: "Профиль" },
  ];

  if (user && user.role === "admin") {
    navItems.push({ path: "/admin-dashboard", icon: Shield, label: "Админ" });
  }

  // Подсчёт количества непрочитанных чатов по последним сообщениям
  useEffect(() => {
    const fetchUnread = async () => {
      if (!user?.id) return;
      try {
        const { data: chatsData } = await supabase
          .from("chats")
          .select("id,user1_id,user2_id")
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
        if (!chatsData || chatsData.length === 0) {
          setUnreadChatsCount(0);
          return;
        }
        let unread = 0;
        // Проверяем по последнему сообщению каждого чата
        await Promise.all(
          chatsData.map(async (chat: any) => {
            const { data: lastMsg } = await supabase
              .from("messages")
              .select("id,sender_id,created_at")
              .eq("chat_id", chat.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (!lastMsg) return;
            if (lastMsg.sender_id === user.id) return;
            const { data: readRow } = await supabase
              .from("message_reads")
              .select("message_id")
              .eq("message_id", lastMsg.id)
              .eq("user_id", user.id)
              .maybeSingle();
            if (!readRow) unread += 1;
          }),
        );
        setUnreadChatsCount(unread);
      } catch (e) {
        // молча игнорируем ошибки подсчёта
      }
    };
    fetchUnread();
  }, [user?.id, location.pathname]);

  // Реалтайм — при прилёте нового сообщения увеличиваем счётчик
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`unread_messages_${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg: any = payload.new;
          if (!msg || msg.sender_id === user.id) return;
          // проверим, что пользователь участник чата
          const { data: chat } = await supabase
            .from("chats")
            .select("user1_id,user2_id")
            .eq("id", msg.chat_id)
            .maybeSingle();
          if (!chat) return;
          if (chat.user1_id === user.id || chat.user2_id === user.id) {
            setUnreadChatsCount((c) => c + 1);
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  // При заходе на вкладку Чаты сбрасываем индикатор
  useEffect(() => {
    if (location.pathname === "/chats") {
      setUnreadChatsCount(0);
    }
  }, [location.pathname]);

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-0 left-0 right-0 mx-auto max-w-md w-full z-50 bg-white backdrop-blur-lg shadow-lg border-t border-gray-200 navigation-bar-fixed"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 20px) + 8px)" }}
    >
      <div className="flex justify-around items-center w-full min-h-[64px] py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                if (item.path === "/chats") setUnreadChatsCount(0);
                navigate(item.path);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 relative min-w-[56px] ${isActive ? "text-primary-500" : "text-gray-500"} text-base`}
              style={{ flex: "1 0 0", minWidth: 0 }}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <item.icon size={26} />
              </motion.div>
              {item.path === "/chats" && unreadChatsCount > 0 && (
                <span className="absolute top-1 right-4 bg-red-500 text-white rounded-full text-[10px] px-[5px] py-[1px] min-w-[16px] h-[16px] flex items-center justify-center">
                  {unreadChatsCount > 9 ? "9+" : unreadChatsCount}
                </span>
              )}
              <span className="text-[13px] mt-1 leading-tight font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default NavigationBar;
