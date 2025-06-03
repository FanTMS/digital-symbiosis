import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { MessageCircle, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import Button from '../components/ui/Button';

// Типы для чата и пользователя
import type { Database } from '../types/supabase';
type Chat = Database["public"]["Tables"]["chats"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];

const ChatsPage: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [chats, setChats] = useState<(Chat & { otherUser: User | null; lastMessage: Message | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      if (!user?.id) return;
      setLoading(true);
      // Получаем все чаты, где участвует пользователь
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) {
        setLoading(false);
        return;
      }
      // Для каждого чата получаем собеседника и последнее сообщение
      const chatDetails = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
          let otherUser: User | null = null;
          let lastMessage: Message | null = null;
          if (otherUserId) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', otherUserId)
              .single();
            otherUser = userData;
          }
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*, attachments(*)')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          lastMessage = lastMsg || null;
          return { ...chat, otherUser, lastMessage };
        })
      );
      setChats(chatDetails);
      setLoading(false);
    };
    fetchChats();
  }, [user?.id]);

  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-4 w-full max-w-full pb-20 sm:pb-8">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <MessageCircle size={24} /> Чаты
      </h1>
      {chats.length === 0 ? (
        <div className="text-gray-500">Нет активных чатов</div>
      ) : (
        <ul className="space-y-3">
          {chats.map((chat) => (
            <li
              key={chat.id}
              className="p-3 rounded-lg border bg-white shadow flex items-center cursor-pointer hover:bg-gray-50 w-full"
              style={{ minWidth: 0 }}
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                {chat.otherUser?.avatar_url ? (
                  <img src={chat.otherUser.avatar_url} alt={chat.otherUser.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <MessageCircle size={24} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{chat.otherUser?.name || 'Пользователь'}</div>
                <div className="text-xs text-gray-500 truncate">
                  {(() => {
                    const msg = chat.lastMessage;
                    if (msg && msg.attachments && msg.attachments.length > 0) {
                      const a = msg.attachments[0];
                      if (a.type === 'image') {
                        return <span className="inline-flex items-center gap-1"><ImageIcon size={14} className="text-blue-400" /> Фото</span>;
                      } else {
                        const full = decodeURIComponent(a.url.split('/').pop()?.split('?')[0] || 'Файл');
                        const name = full.includes('-') ? full.substring(full.lastIndexOf('-') + 1) : full;
                        let sizeStr = '';
                        if (a.size) {
                          if (a.size > 1024 * 1024) sizeStr = (a.size / (1024 * 1024)).toFixed(2) + ' МБ';
                          else if (a.size > 1024) sizeStr = (a.size / 1024).toFixed(1) + ' КБ';
                          else sizeStr = a.size + ' Б';
                        }
                        return <span className="inline-flex items-center gap-1"><FileIcon size={14} className="text-blue-400" />{name}{sizeStr && <span className="opacity-70 ml-1">({sizeStr})</span>}</span>;
                      }
                    } else if (msg && msg.content) {
                      return msg.content;
                    } else {
                      return 'Нет сообщений';
                    }
                  })()}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-2 min-w-[70px] sm:min-w-[90px] px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
                onClick={e => { e.stopPropagation(); navigate(`/chat/${chat.id}`); }}
              >
                Открыть
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatsPage; 